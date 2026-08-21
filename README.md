# Professor-portfolio-website

A maintainable foundation for an academic portfolio built with Next.js App Router, TypeScript,
Tailwind CSS, Prisma, MongoDB, and Zod.

## Current scope

This stage establishes the application shell, the initial server-side data layer, administrator
authentication, and centralized role-based authorization:

- Public App Router layout with responsive primary navigation
- Reusable header, footer, container, section heading, and surface components
- Protected administrator layout and dashboard routes
- Strict TypeScript configuration
- Tailwind CSS v4 with global styles
- Server-only environment validation for MongoDB
- Prisma 6.19.1 schema for administration, profile/settings, publishing, assets, research, and auditing
- Development-only, idempotent seed data with an explicit safety guard
- File metadata and storage keys without storing uploaded binary content in MongoDB
- Auth.js credentials authentication with an encrypted JWT session cookie
- Bcrypt password hashing, server-side Zod validation, login, logout, and protected admin access
- Centralized role and permission checks for server components, actions, route handlers, and services
- Guarded administrator role changes with privilege-escalation protection and audit logging
- Protected administrator dashboard at `/admin/dashboard` with responsive navigation and account
  controls
- Profile and site-settings management with server actions, Zod validation, audit entries, and
  permission checks
- Public home/layout content read from the published professor profile and site settings in
  MongoDB
- Public About, Research, Publications, and Contact pages with responsive academic presentation
- Server-side public readers that exclude draft and private research/publication records
- Research status, visibility, and ordering fields plus publication type and PDF-reference fields
- Accessible loading, empty, success, error, and forbidden states for the initial public/admin
  workflows

Blog/research/publication CRUD, administrator-management screens, and file uploads remain
intentionally deferred to later stages. Profile images and publication PDFs currently use
validated URL fields; binary storage is not implemented.

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

Set an Auth.js secret before opening the login route. It must be at least 32 characters and must
never be committed:

```bash
openssl rand -base64 32
```

Copy the generated value into `AUTH_SECRET` in `.env`. Auth.js also supports
`AUTH_TRUST_HOST=true` when the application is behind a trusted reverse proxy; local development
trusts localhost automatically.

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
ADMIN_SEED_PASSWORD="$(openssl rand -base64 24)" \
DATABASE_ENV=development \
SEED_DATABASE_CONFIRMATION=YES \
pnpm db:seed
```

For a safer shell workflow, read the password without putting it in shell history:

```bash
read -s ADMIN_SEED_PASSWORD
export ADMIN_SEED_PASSWORD
DATABASE_ENV=development SEED_DATABASE_CONFIRMATION=YES pnpm db:seed
unset ADMIN_SEED_PASSWORD
```

The seed contains fake `.test` values, is idempotent, and refuses production or
non-development-named connection strings. On the first run it hashes `ADMIN_SEED_PASSWORD` into
the development administrator record; it never stores the plaintext password or writes secrets
to audit logs. Later seed runs preserve an existing administrator hash.

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the public portfolio. Administrator
sign-in is available at [http://localhost:3000/login](http://localhost:3000/login). The protected
administrator routes are:

- `/admin` — authenticated entry point (redirects to the dashboard)
- `/admin/dashboard` — account and content status overview
- `/admin/profile` — professor profile management
- `/admin/settings` — site-wide settings management

The public routes are:

- `/` — overview with selected research and publications
- `/about` — biography and academic record
- `/research` — public research interests and projects
- `/publications` — published scholarly work
- `/contact` — published contact details and academic links

## Authentication model

The application uses `next-auth@5.0.0-beta.32` with the Credentials provider and an explicit JWT
session strategy. The custom `AdminUser` model remains the only administrator store; no Auth.js
adapter tables are created.

1. The login server action validates the submitted email and password with Zod.
2. The Credentials provider looks up the normalized email, compares the password with the stored
   bcrypt hash, and accepts only administrators with `status=ACTIVE` and `isActive=true`.
3. A successful login returns only the administrator ID, email, and display name to Auth.js.
   Password hashes, account status, and role are not placed in client-visible session data.
4. Auth.js stores the session in its encrypted JWT cookie. `getCurrentAdmin()` then rechecks the
   administrator record on the server, and `requireAuth()` redirects unauthenticated requests to
   `/login`.
5. Logout is a server action exposed in the protected admin shell.

The credentials flow intentionally returns the same generic `Invalid email or password.` message
for malformed, unknown, inactive, and incorrect credentials.

## Authorization model

Authorization is server-side and centralized in `src/server/auth/`. Page components and server
operations use `requireAuth()`, `requireRole()`, `requireAnyRole()`, or `requirePermission()`
instead of comparing roles directly. Every protected request re-reads the administrator from the
database, so a client-supplied identity or stale session role is not trusted.

| Capability                       | `SUPER_ADMIN` | `ADMIN` | `EDITOR` |
| -------------------------------- | ------------- | ------- | -------- |
| Manage professor profile         | Yes           | Yes     | No       |
| Manage site settings             | Yes           | Yes     | No       |
| Manage research and publications | Yes           | Yes     | No       |
| Create and edit blog posts       | Yes           | Yes     | Yes      |
| Publish blog posts               | Yes           | Yes     | No       |
| Manage files                     | Yes           | Yes     | No       |
| Manage administrators/roles      | Yes           | No      | No       |
| Manage authentication settings   | Yes           | No      | No       |
| View audit logs                  | Yes           | No      | No       |

`EDITOR` publishing is deliberately disabled by the current permission matrix. It can be enabled
later by changing the centralized matrix rather than individual pages or actions.

The administrator role service rejects self-escalation, attempts to manage a higher-ranked
administrator, and attempts to assign a role above the actor's own role. Successful role changes
record only non-secret role metadata in `AuditLog`. The protected action and API route both return
generic unauthorized (`401`) or forbidden (`403`) failures and delegate to a service that repeats
the permission check as a defense in depth. No administrator-management UI is included yet.

## Scripts

| Command             | Purpose                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`          | Start the development server                                            |
| `pnpm build`        | Generate Prisma Client and create a production build                    |
| `pnpm start`        | Serve the production build                                              |
| `pnpm lint`         | Run ESLint                                                              |
| `pnpm test`         | Run focused authentication, authorization, and content-management tests |
| `pnpm typecheck`    | Run the TypeScript compiler without emitting files                      |
| `pnpm format`       | Format supported files with Prettier                                    |
| `pnpm format:check` | Check formatting without writing                                        |
| `pnpm db:generate`  | Generate Prisma Client                                                  |
| `pnpm db:validate`  | Validate the Prisma schema                                              |
| `pnpm db:push`      | Synchronize the Prisma schema with MongoDB                              |
| `pnpm db:check`     | Run a read-only MongoDB ping                                            |
| `pnpm db:seed`      | Run the guarded development seed                                        |

## Project structure

```text
src/
  app/                 App Router routes and layouts
  components/          Reusable presentation components and form controls
  config/              Public, non-secret site configuration
  features/
    admin-dashboard/   Dashboard summaries and protected admin composition
    professor-profile/ Profile schema, repository, service, actions, and form
    public-content/    Public readers, visibility policy, shared cards, and page composition
    site-settings/     Settings schema, repository, service, actions, and form
    home/              Public portfolio page composition
  lib/                 Small shared utilities and environment parsing
  server/admin/        Protected administrator-domain actions and services
  server/auth/         Authentication, roles, permissions, and authorization helpers
  server/db/           Compatibility export for server-only database access
  types/               Auth.js TypeScript module augmentation
prisma/
  schema.prisma        MongoDB datasource, enums, models, and indexes
  seed.ts              Guarded development seed
  check-connection.ts  Read-only connectivity check
prisma.config.ts       Prisma schema and seed configuration
tests/auth/             Focused authentication and authorization tests
tests/content/          Profile/settings validation and authorization tests
tests/public/           Public visibility, ordering, and empty-collection tests
```

The data layer currently includes `AdminUser`, `ProfessorProfile`, `SiteSettings`, `BlogPost`,
`BlogCategory`, `BlogTag`, `FileAsset`, `ResearchItem`, `Publication`, and `AuditLog`. MongoDB
many-to-many blog relations use explicit ObjectId arrays on both models. Environment values remain
server-side and are never placed in reusable presentation components. Profile list fields are
entered one item per line in the initial management form. `pnpm db:push` is the supported MongoDB
schema synchronization workflow; MongoDB transactions require a replica set (a local development
replica set or an appropriately configured hosted cluster). Public research requires both
`isPublished=true` and `visibility=PUBLIC`; publications require `isPublished=true`.
