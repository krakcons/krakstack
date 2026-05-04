# AGENTS

## i18n (required)

English and French are required for all public facing strings.

All public facing strings should be translated using paraglide.js and the vite plugin.

Custom translations are stored in `src/messages/global/en.json` and `src/messages/global/fr.json`. Do not edit the messages at `src/messages/en.json` and `src/messages/fr.json` directly as they are generated.

## Code Architecture

The application is divied into two classic areas: the frontend and the backend.

### Frontend

The frontend is a react application that uses:

- Tanstack start
- Shadcn
- Effect atom for state management and requesting from the effect api

### Backend

The backend is an effect application that uses:

- Postgres and drizzle-orm
- Effect based httpapi, httpserver, openapi, opentelemetry

### Folder Structure

- `public/` — Static assets (favicon, logos, manifest, robots.txt)
- `scripts/` — Build and utility scripts (e.g. merge-messages for i18n)
- `src/` — Application source
  - `components/` — React components
    - `ui/` — Shadcn UI primitives (managed by shadcn CLI)
  - `db/` — Drizzle schema definitions (app schema + auth schema)
  - `hooks/` — Shared React hooks
  - `lib/` — Shared utilities, auth config, registry helpers
    - `atoms/` — Effect atom definitions
  - `messages/` — i18n source files
    - `global/` — Hand-written translations (en.json, fr.json) — edit these
    - `components/` — Component-specific translations — do not edit
    - Root `en.json`/`fr.json` are generated — do not edit
  - `paraglide/` — Generated paraglide runtime — do not edit
  - `routes/` — TanStack Start file-based routes
    - `api/` — API catch-all route
    - `docs/` — Documentation pages, including registry slug routes
  - `services/` — Effect service definitions and handlers

## Patterns

### Services

Use service based design where possible as an interface for related concerns. Use for crud, features, and other concerns.

- `src/services/example/index.ts`:
  - Main interface for the service.
  - Recommended Packages: `@/services/database`, `./schema`, `effect`
  - Example: Crud, Tasks.list, Tasks.create, Tasks.update, Tasks.delete
- `src/services/example/schema.ts`:
  - Defines the schema for the service.
  - Recommended Packages: [`drizzle-orm/effect-schema`](https://orm.drizzle.team/docs/effect-schema), `effect`
- `src/services/example/api.group.ts`:
  - Defines the HttpApiGroup, routes, success/error schema, and request/response types.
  - Recommended Packages: `effect/unstable/httpapi`, `./schema`
- `src/services/example/api.builder.ts`:
  - Implements the business logic for the api of the service.
  - Recommended Packages: `./api`, `./schema`, `effect`, `effect/unstable/http`, `effect/unstable/httpapi`

### API

Define the API within `src/api.ts` and merge the api groups found in services into it.

### Documentation

Whenever you make an API or Schema, ensure it is documented.

- API: Use `OpenAPI` from `effect/unstable/httpapi` to generate the OpenAPI spec. Use annotations to add a title, description, summary, etc.
- Schema: Use `Schema.annotate({ ... })` to add a title, identifier, description, and examples to the schema.

## Checks

Run these on changes to ensure the code is in good shape.

- `bun type:check`: Check the types of the code.
- `bun lint`: Check the code for linting errors.
- `bun fmt`: Format the code.

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
