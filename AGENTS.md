# Krakstack Site

This is a documentation site for KrakStack.

## i18n (required)

English and French are required for all public facing strings.

All public facing strings should be translated using paraglide.js and the vite plugin.

Custom translations are stored in `src/messages/global/en.json` and `src/messages/global/fr.json`. Do not edit the messages at `src/messages/en.json` and `src/messages/fr.json` directly as they are generated.

## Folder Structure

- `public/` — Static assets (favicon, logos, manifest, robots.txt)
- `registry/` — Installable registry items consumed by the CLI
  - `auth/` — Auth lib and route registry items
  - `components/` — UI component registry items (one subfolder per component)
  - `db/` — Database registry items
  - `lib/` — Shared library registry items
  - `routes/` — Route registry items
  - `services/` — Service registry items (database, opentelemetry)
  - `templates/` — Full-stack template registry items
- `scripts/` — Build and utility scripts (e.g. merge-messages for i18n)
- `src/` — Application source
  - `components/` — React components
    - `ui/` — Shadcn UI primitives (managed by shadcn CLI)
    - `registry-previews/` — Preview wrappers displayed on registry doc pages
  - `db/` — Drizzle schema definitions (app schema + auth schema)
  - `hooks/` — Shared React hooks
  - `lib/` — Shared utilities, auth config, registry helpers
  - `messages/` — i18n source files
    - `global/` — Hand-written translations (en.json, fr.json) — edit these
    - `components/` — Component-specific translations
    - Root `en.json`/`fr.json` are generated — do not edit directly
  - `paraglide/` — Generated paraglide runtime — do not edit
  - `routes/` — TanStack Start file-based routes
    - `api/` — API catch-all route
    - `docs/` — Documentation pages, including registry slug routes
  - `services/` — Effect service definitions and handlers

## Code Architecture

The application is divided into two classic areas: the frontend and the backend.

### Frontend

The frontend is a React application that uses:

- TanStack Start
- Shadcn
- Effect atom for state management and requesting from the Effect API

### Backend

The backend is an Effect application that uses:

- Postgres and drizzle-orm
- Effect based httpapi, httpserver, openapi, opentelemetry

### Patterns

#### Services

Use service based design where possible as an interface for related concerns. Use for crud, features, and other concerns.

- `src/services/example/index.ts`:
  - Main interface for the service.
  - Recommended Packages: `@/services/database`, `./schema`, `effect`
  - Example: Crud, Tasks.list, Tasks.create, Tasks.update, Tasks.delete
- `src/services/example/schema.ts`:
  - Defines the schema for the service.
  - Recommended Packages: [`drizzle-orm/effect-schema`](https://orm.drizzle.team/docs/effect-schema), `effect`
- `src/services/example/api.ts`:
  - Defines the HttpApiGroup, routes, success/error schema, and request/response types.
  - Recommended Packages: `effect/unstable/httpapi`, `./schema`
- `src/services/example/handler.ts`:
  - Implements the business logic for the api of the service.
  - Recommended Packages: `./api`, `./schema`, `effect`, `effect/unstable/http`, `effect/unstable/httpapi`

#### API

Define the API within `src/api.ts` and merge the api groups found in services into it.

Build strong OpenAPI specifications.

## Code patterns

- Use opentelemetry and mark spans for tracing (see `src/services/opentelemetry.ts`)

<!-- intent-skills:start -->

## Skill Loading

Before substantial work:

- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

<!-- effect-solutions:start -->

## Effect Best Practices

**IMPORTANT:** Always consult effect-solutions before writing Effect code.

1. Run `effect-solutions list` to see available guides
2. Run `effect-solutions show <topic>...` for relevant patterns (supports multiple topics)
3. Search `~/.local/share/effect-solutions/effect` for real implementations

Topics: quick-start, project-setup, tsconfig, basics, services-and-layers, data-modeling, error-handling, config, testing, cli.

Never guess at Effect patterns - check the guide first.

<!-- effect-solutions:end -->
