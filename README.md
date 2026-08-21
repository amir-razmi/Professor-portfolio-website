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
- Public, password-protected, and private file access with short-lived signed unlock cookies
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
- Complete blog workflow with protected post and taxonomy management, draft/publish transitions,
  duplicate-slug validation, public search/filtering/pagination, metadata, and a published-only
  sitemap
- Public SEO metadata with canonical URLs, Open Graph/Twitter cards, robots rules, and a
  request-time sitemap that excludes unpublished blog records
- `next/image` profile media with meaningful alt text and bounded public file queries
- Centralized blog taxonomy permission (`MANAGE_BLOG_TAXONOMY`) for category/tag administration
- Plain-text blog content rendering that escapes hostile markup and does not interpret raw HTML or
  Markdown
- SUPER_ADMIN-only administrator management with account creation, role changes, activation/
  deactivation, password reset, self-protection, last-active-super-admin protection, and audit
  logging

Research/publication CRUD remains intentionally deferred to a later stage. Secure file management
is available at `/admin/files`; profile images, publication PDFs, and blog cover assets still use
validated URL/metadata fields until those records are connected to the file manager.

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

`LOCAL_STORAGE_ROOT` defaults to `./storage`. The directory is created on demand, is ignored by
Git, and is intended for local development only.

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
- `/admin/blog` — blog post, category, and tag management
- `/admin/blog/new` — create a draft or (for publishing-capable roles) a published post
- `/admin/blog/[id]/edit` — edit, publish, unpublish, or delete a post
- `/admin/files` — upload files and manage metadata, visibility, and deletion
- `/admin/admins` — list administrator accounts (SUPER_ADMIN only)
- `/admin/admins/new` — create an administrator account (SUPER_ADMIN only)
- `/admin/admins/[id]/edit` — manage details, role, status, and password (SUPER_ADMIN only)
- `/admin/audit-logs` — paginated audit events with action/resource filters (SUPER_ADMIN only)

The public routes are:

- `/` — overview with selected research and publications
- `/about` — biography and academic record
- `/research` — public research interests and projects
- `/publications` — published scholarly work
- `/contact` — published contact details and academic links
- `/blog` — published blog listing with search, category/tag filters, and pagination
- `/blog/[slug]` — a published blog article
- `/files` — public, password-protected, and restricted academic file records
- `/sitemap.xml` — static public routes plus published blog slugs only
- `/robots.txt` — permits public pages and blocks `/admin/`, `/api/`, and `/login`
- `/api/files/public/[id]` — streams a public file or an unlocked password-protected file
- `/api/files/public/[id]/unlock` — verifies a file password and issues a short-lived HTTP-only
  signed access cookie
- `/api/admin/files/[id]/download` — authenticated file-manager download for public or private
  assets

Public file access

Files use one `FileVisibility` state: `PUBLIC`, `PASSWORD_PROTECTED`, or `PRIVATE`. Passwords are
validated and bcrypt-hashed before persistence. A successful visitor unlock creates a signed,
HTTP-only cookie scoped to that file's download endpoint for 15 minutes. The cookie contains no
plaintext password and is invalidated when an administrator changes or removes the password.
Private files remain unavailable to public download routes.

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
| Manage blog categories/tags      | Yes           | Yes     | No       |
| Manage files                     | Yes           | Yes     | No       |
| Manage administrators/roles      | Yes           | No      | No       |
| Manage authentication settings   | Yes           | No      | No       |
| View audit logs                  | Yes           | No      | No       |

`EDITOR` publishing is deliberately disabled by the current permission matrix. It can be enabled
later by changing the centralized matrix rather than individual pages or actions.

`MANAGE_BLOG_TAXONOMY` is separate from post editing, so editors can work on posts without changing
the site's shared category/tag vocabulary. The server-side blog policy also rejects forged
publication-state changes even when a request bypasses the UI.

The administrator role service rejects self-escalation, attempts to manage a higher-ranked
administrator, attempts to assign a role above the actor's own role, and attempts to demote the
last active `SUPER_ADMIN`. Administrator management is restricted to `SUPER_ADMIN` in both the
pages/actions and the server-side policy/service layer. Successful account, role, status, details,
and password-reset operations record only non-secret metadata in `AuditLog`; password hashes,
plaintext passwords, tokens, sessions, and secrets are never returned to the UI or persisted in
audit metadata. Audit persistence is best effort and cannot make a successful primary mutation
fail. Deactivation of the signed-in account is rejected, and the last active `SUPER_ADMIN` cannot
be deactivated.

The audit viewer is available at `/admin/audit-logs` to principals with `VIEW_AUDIT_LOGS` (currently
`SUPER_ADMIN` only). It supports 25-event pages and filters by action or target resource. Research
and publication mutation screens are intentionally deferred; their target resource types are
supported by the centralized audit service for the later CRUD stage.

## Scripts

| Command             | Purpose                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| `pnpm dev`          | Start the development server                                                            |
| `pnpm build`        | Generate Prisma Client and create a production build                                    |
| `pnpm start`        | Serve the production build                                                              |
| `pnpm lint`         | Run ESLint                                                                              |
| `pnpm test`         | Run focused authentication, authorization, content, public, blog, file, and audit tests |
| `pnpm typecheck`    | Run the TypeScript compiler without emitting files                                      |
| `pnpm format`       | Format supported files with Prettier                                                    |
| `pnpm format:check` | Check formatting without writing                                                        |
| `pnpm db:generate`  | Generate Prisma Client                                                                  |
| `pnpm db:validate`  | Validate the Prisma schema                                                              |
| `pnpm db:push`      | Synchronize the Prisma schema with MongoDB                                              |
| `pnpm db:check`     | Run a read-only MongoDB ping                                                            |
| `pnpm db:seed`      | Run the guarded development seed                                                        |

## Project structure

```text
src/
  app/                 App Router routes and layouts
  components/          Reusable presentation components and form controls
  config/              Public, non-secret site configuration
  features/
    admin-management/ Administrator management UI-safe labels and protected forms
    admin-dashboard/   Dashboard summaries and protected admin composition
    professor-profile/ Profile schema, repository, service, actions, and form
    public-content/    Public readers, visibility policy, shared cards, and page composition
    blog/              Blog schemas, repository/service policy, actions, admin UI, and public UI
    files/             Upload validation, file policy/repository/service, and admin UI
    audit-log/         Protected paginated audit-log viewer and query policy
    site-settings/     Settings schema, repository, service, actions, and form
    home/              Public portfolio page composition
  lib/                 Small shared utilities and environment parsing
    storage/            Server-only storage contract and local filesystem provider
  server/admin/        Protected administrator-domain policies, actions, and services
  server/auth/         Authentication, roles, permissions, and authorization helpers
  server/audit/        Centralized sanitized audit-log writer
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
tests/blog/              Blog validation, authorization, visibility, and rendering tests
tests/files/             Upload, storage, download, and cleanup security tests
tests/audit/             Audit sanitization, event shape, and authorization tests
```

The data layer currently includes `AdminUser`, `ProfessorProfile`, `SiteSettings`, `BlogPost`,
`BlogCategory`, `BlogTag`, `FileAsset`, `ResearchItem`, `Publication`, and `AuditLog`. MongoDB
many-to-many blog relations use explicit ObjectId arrays on both models. Environment values remain
server-side and are never placed in reusable presentation components. Profile list fields are
entered one item per line in the initial management form. `pnpm db:push` is the supported MongoDB
schema synchronization workflow; MongoDB transactions require a replica set (a local development
replica set or an appropriately configured hosted cluster). Public research requires both
`isPublished=true` and `visibility=PUBLIC`; publications require `isPublished=true`; blog readers
require `status=PUBLISHED` and a non-null `publishedAt`.

## Blog content and safety

Blog posts intentionally use a plain-text content field in this stage. The admin form stores
paragraph text, and the public article component renders each paragraph as escaped React text.
There is no Markdown parser, raw HTML support, `dangerouslySetInnerHTML`, or rich-text editor.
Therefore strings such as `<script>alert("x")</script>` remain visible text and cannot create
elements or event handlers. If a future stage adds Markdown or rich text, it must introduce an
explicit, maintained sanitizer and cover the parser with security tests before changing the
stored format.

Public blog queries apply the published-state predicate in the repository and again in the
server-side policy. The same published-only reader powers article pages, generated metadata,
search/filter results, and `sitemap.xml`; draft and archived records are not exposed through those
paths.

## File storage and download security

`FileAsset` stores metadata and a random storage key; uploaded binary content is never stored in
MongoDB. The server validates the filename, extension, detected content signature, MIME type,
category, and 10 MiB size limit before writing an object. Local files are kept beneath
`LOCAL_STORAGE_ROOT`, and path separators, traversal segments, symlinks, executable extensions,
and arbitrary filesystem access are rejected.

The local provider is for development and small single-instance deployments. It implements the
`StorageProvider` interface in `src/lib/storage/storage-provider.ts`; a production S3-compatible
provider can implement the same `put`, `get`, and `delete` methods while keeping bucket names,
credentials, and private object URLs server-only. Public downloads are streamed through
`/api/files/public/[id]` with an attachment disposition, `nosniff`, a restrictive CSP, and
`no-store` caching so a visibility change cannot leave a stale public response in an intermediary
cache. The route only resolves records marked `PUBLIC`, so private records do not have a public
URL.
Administrators with `files:manage` can use the separate no-store admin route to review private
assets; it repeats the server-side permission check and never exposes a storage path.

Metadata operations live in `src/features/files/server/file-repository.ts` and
`file-service.ts`, while storage operations stay behind the provider interface. Deletion removes
the stored object before deleting its database record and attempts to restore the object if the
database transaction fails, preventing silent metadata/object divergence.
