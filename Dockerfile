# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS base

ENV PNPM_HOME="/pnpm" \
  PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
  && apt-get install --yes --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ENV NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL}"

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Prisma's config requires DATABASE_URL during client generation. This is a
# build-only placeholder; runtime configuration is supplied with docker run or
# the deployment platform and is never baked into the final image.
RUN mkdir -p public \
  && DATABASE_URL="mongodb://127.0.0.1:27017/academic_portfolio_build" \
  DATABASE_ENV=production \
  pnpm build

FROM dependencies AS production-dependencies

RUN pnpm prune --prod

FROM dependencies AS tooling

COPY . .

RUN DATABASE_URL="mongodb://127.0.0.1:27017/academic_portfolio_tooling" \
  pnpm prisma generate

FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  HOSTNAME=0.0.0.0 \
  PORT=3000

WORKDIR /app

RUN apt-get update \
  && apt-get install --yes --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /app/storage \
  && chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Keep the complete production dependency tree. Next's output tracing can
# omit ESM helper files when the source install uses pnpm's isolated linker.
COPY --from=production-dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
