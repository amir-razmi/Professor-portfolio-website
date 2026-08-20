# Professor-portfolio-website

A maintainable foundation for an academic portfolio built with Next.js App Router, TypeScript,
Tailwind CSS, Prisma, MongoDB, and Zod.

## Current scope

This stage establishes the application shell and the initial server-side data layer:

- Public App Router layout with a responsive navigation placeholder
- Reusable header, footer, container, section heading, and surface components
- Admin layout and route placeholder
- Strict TypeScript configuration
- Tailwind CSS v4 with global styles
- Server-only environment validation for MongoDB
- Prisma 6.19.1 schema for administration, profile/settings, publishing, assets, research, and auditing
- Development-only, idempotent seed data with an explicit safety guard
- File metadata and storage keys without storing uploaded binary content in MongoDB

Authentication, CRUD workflows, file uploads, and public/admin content screens are intentionally
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

Set `DATABASE_ENV=development` and a development MongoDB URL in `.env`, then install dependencies:

```bash
pnpm install
```

Generate the Prisma client:

```bash
pnpm db:generate
```

Validate the schema:

```bash
pnpm db:validate
```

Synchronize a development MongoDB database with the schema:

```bash
pnpm db:push
```

`prisma db push` is the MongoDB schema workflow for this project. Relational migration
commands are not used. Do not run destructive flags against a shared or production database.

Run a read-only connectivity check:

```bash
pnpm db:check
```

Seed only a clearly identified development/test-named database, with an explicit confirmation:

```bash
DATABASE_ENV=development SEED_DATABASE_CONFIRMATION=YES pnpm db:seed
```

The seed contains fake `.test` values, is idempotent, and refuses production or
non-development-named connection strings. It does not create a password or write secrets to
audit logs.

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
| `pnpm db:push`      | Synchronize the Prisma schema with MongoDB           |
| `pnpm db:check`     | Run a read-only MongoDB ping                         |
| `pnpm db:seed`      | Run the guarded development seed                     |

## Project structure

```text
src/
  app/                 App Router routes and layouts
  components/          Reusable presentation components
  config/              Public, non-secret site configuration
  features/            Feature-specific page composition and future domain modules
  lib/                 Small shared utilities and environment parsing
  server/db/           Compatibility export for server-only database access
prisma/
  schema.prisma        MongoDB datasource, enums, models, and indexes
  seed.ts              Guarded development seed
  check-connection.ts  Read-only connectivity check
prisma.config.ts       Prisma schema and seed configuration
```

The data layer currently includes `AdminUser`, `ProfessorProfile`, `SiteSettings`, `BlogPost`,
`BlogCategory`, `BlogTag`, `FileAsset`, `ResearchItem`, `Publication`, and `AuditLog`. MongoDB
many-to-many blog relations use explicit ObjectId arrays on both models. Environment values remain
server-side and are never placed in reusable presentation components.
