# AGENTS

## Core Rules

- Prefer the smallest correct change that fits the existing architecture.
- Keep frontend and backend concerns separated unless a feature explicitly spans both.
- Use project conventions already present in nearby files before introducing new patterns.
- Do not edit generated or registry-managed files unless explicitly requested.

## i18n

- English and French are required for all public-facing strings.
- Translate public-facing strings with paraglide.js and the Vite plugin.
- Store translations in `src/messages/en.json` and `src/messages/fr.json`.
- Import generated messages from `src/paraglide/messages` instead of hardcoding UI copy.

## Architecture

The application is divided into two areas: frontend and backend.

### Frontend

- React with TanStack Start and TanStack Router.
- shadcn UI primitives and installed registry components.
- Effect service state for data loading and mutations.
- Prefer existing app form, table, dialog, and data-fetching patterns before adding new abstractions.

### Backend

- Effect application services.
- Effect Postgres and Drizzle ORM for database access.
- Effect HttpApi, HttpServer, OpenAPI, and OpenTelemetry for API and runtime concerns.

## Folder Structure

- `public/` contains static assets.
- `scripts/` contains build and utility scripts.
- `tmp/` contains local temporary files that should not be committed.
- `src/components/` contains React components.
- `src/components/ui/` contains shadcn-managed primitives. Do not edit directly.
- `src/db/` contains Drizzle schema definitions.
- `src/hooks/` contains shared React hooks.
- `src/lib/` contains shared utilities and auth config.
- `src/messages/` contains i18n source files.
- `src/paraglide/` contains generated i18n runtime. Do not edit directly.
- `src/routes/` contains TanStack Start file-based routes.
- `src/routes/api/` contains the API catch-all route.
- `src/routes/docs/` contains documentation pages.
- `src/services/` contains Effect service definitions, API handlers, schemas, and client state.
- `src/api.ts` defines the root Effect API.

## Code Practices

- Prefer arrow functions `() => void` over function expressions `function () {}` except where Effect generator APIs require `function*`.
- Avoid `as any`, `as Type`, and `as unknown` unless absolutely necessary.
- Use Effect `Schema` for validation. Do not use Zod or other validation libraries.
- Prefer Effect-native integrations over ad hoc boundaries: use `FetchHttpClient`/`HttpClient` instead of raw `fetch`, Effect `Schema` codecs such as `Schema.fromJsonString(...)` and `HttpClientResponse.schemaBodyJson(...)` instead of manual `JSON.parse` or custom validation, and typed Effect errors instead of broad `try`/`tryPromise` wrappers.
- Use `Effect.try` or `Effect.tryPromise` only when wrapping a non-Effect API that has no suitable Effect adapter; keep the boundary as small as possible and map failures into domain-specific errors.
- Annotate schemas with `.annotate({ identifier: "Name" })`.
- Use `Schema.toStandardSchemaV1(...)` when integrating Effect schemas with form validators.
- Use `Effect.fn` for service methods when practical.
- Add OpenTelemetry through Effect runtime patterns where relevant.

## Services

Use service-based design for CRUD, features, integrations, and related domain concerns.

A typical service should use this structure:

- `src/services/<name>/schema.ts` defines Effect schemas, payload schemas, route params, and standard schema exports.
- `src/services/<name>/index.ts` implements the Effect `Context.Service` and exposes production and test layers where needed.
- `src/services/<name>/api.group.ts` defines the HttpApiGroup contract.
- `src/services/<name>/api.builder.ts` wires the service into the root API with auth and error mapping.
- `src/services/<name>/client/atom.ts` defines query and mutation atoms.
- `src/services/<name>/client/form.tsx` defines reusable create/edit forms.
- `src/services/<name>/client/table.tsx` defines data tables and row actions.

Service methods should accept object inputs, scope by the current user or tenant where applicable, and avoid exposing cross-tenant data.

## API

- Define the root API in `src/api.ts`.
- Merge service API groups into the root API with `.add(...)`.
- Keep OpenAPI annotations on the root API.
- OpenAPI documentation is served at `/api/docs`.
- MCP server support is served at `/api/mcp` and should use `@krak-stack/openapi-mcp`.
- CLI support should use `@krak-stack/openapi-cli`.

## Tooling

- Use KrakStack Auth for user management, auth components, sessions, and organizations.
- Use KrakStack Components where possible and keep installed registry components current.
- Install KrakStack registry items with shadcn using the `@krak-stack` registry alias configured in `components.json`; do not copy registry item files manually unless explicitly requested.
- Before creating a custom component, check the shadcn MCP server for a compatible component or registry item.
- Use shadcn through the registry workflow. If needed, initialize MCP with `bunx --bun shadcn@latest mcp init --client opencode`.

## Testing

- Use Vitest with `@effect/vitest`.
- Add tests beside code when practical using `*.test.ts` or `*.test.tsx`.
- Import `describe`, `expect`, and `it` from `@effect/vitest`.
- Use `it.effect` for Effect programs and provide dependencies with `Effect.provide(...)`.
- Prefer fresh per-test layers so mutable state does not leak.
- Use suite-shared layers only for expensive resources and reset state between tests.
- Backend and service tests must use the real Postgres test database through `TEST_DATABASE_URL`.
- Never point tests at `DATABASE_URL`.
- The test database is provided externally. Set `TEST_DATABASE_URL` in `.env` or the shell before DB tests.
- Expose service `testLayer`s for tests, backed by `DB.testLayer` where database access is needed.
- Run migrations against the test database before DB tests and reset affected tables between tests.
- Use Drizzle queries for test setup and cleanup where possible.
- Avoid raw SQL unless a migration or lifecycle task requires it.

## Checks

Run checks after code changes when practical:

- `bun run test`
- `bun type:check`
- `bun lint`
- `bun fmt`

## Examples

Use `https://github.com/krakcons/krakstack` as the external reference for this project pattern.

- `schema.ts` shows Effect schemas and standard schema exports.
- `api.group.ts` shows HttpApiGroup endpoint contracts.
- `api.builder.ts` shows HttpApiBuilder handlers with auth and error mapping.
- `service.ts` shows an Effect `Context.Service` implementation.
- `atom.ts` shows Effect Atom queries and optimistic mutations.
- `form.tsx` shows a reusable create/edit form pattern.
- `table.tsx` shows a TanStack table with row actions and edit dialog wiring.
- `api-entry.ts` shows root API registration.

<!-- intent-skills:start -->

## Skill Loading

Before substantial work:

- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->
