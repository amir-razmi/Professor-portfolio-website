# Professor-portfolio-website

A maintainable foundation for an academic portfolio built with Next.js App Router, TypeScript,
Tailwind CSS, Prisma, MongoDB, and Zod.

## Current scope

This stage establishes the application shell and development boundaries:

- Public App Router layout with a responsive navigation placeholder
- Reusable header, footer, container, section heading, and surface components
- Admin layout and route placeholder
- Strict TypeScript configuration
- Tailwind CSS v4 with global styles
- Server-only environment validation for MongoDB
- Prisma configured for MongoDB without introducing the application data model yet

Authentication, CRUD workflows, file uploads, and the complete database schema are intentionally
deferred.

## Local setup

Requirements:

- Node.js 20.9 or newer
- pnpm 10 or newer
- A MongoDB connection string for Prisma operations

Create a local environment file only when one does not already exist:

```bash
cp -n .env.example .env
```

Set `MONGODB_URL` in `.env`, then install dependencies:

```bash
pnpm install
```

Generate the Prisma client:

```bash
pnpm db:generate
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the public shell. The admin layout
placeholder is available at [http://localhost:3000/admin](http://localhost:3000/admin).

## Scripts

| Command             | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | Start the development server                         |
| `pnpm build`        | Generate Prisma Client and create a production build |
| `pnpm start`        | Serve the production build                           |
| `pnpm lint`         | Run ESLint                                           |
| `pnpm typecheck`    | Run the TypeScript compiler without emitting files   |
| `pnpm format`       | Format supported files with Prettier                 |
| `pnpm format:check` | Check formatting without writing                     |
| `pnpm db:generate`  | Generate Prisma Client                               |
| `pnpm db:validate`  | Validate the Prisma schema                           |
| `pnpm db:push`      | Push a future Prisma schema to MongoDB               |

## Project structure

```text
src/
  app/                 App Router routes and layouts
  components/          Reusable presentation components
  config/              Public, non-secret site configuration
  features/            Feature-specific page composition and future domain modules
  lib/                 Small shared utilities and environment parsing
  server/db/           Server-only database access
prisma/
  schema.prisma        MongoDB datasource and future application models
```

Environment values remain server-side and are never placed in reusable presentation components.
