# AGENTS

## Core Rules

- If `PROJECT_AGENTS.md` exists in the repository root, read it immediately and treat it as additional mandatory project instructions.
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

### Client State And Mutations

- Define server queries with Effect Atom and keep authoritative query atoms wrapped in `Atom.optimistic(...)` when previous successful data should remain visible during refresh.
- Default to `Atom.optimisticFn(...)` for create, update, and delete operations when the expected client-side result can be calculated safely.
- Do not expose a plain `ApiClient.mutation(...)` directly to a form when an existing query atom can be updated optimistically and rolled back on failure.
- Reconcile optimistic state with authoritative server data after a successful mutation by invalidating the relevant queries.
- Keep invalidation policy beside the mutation definition rather than repeating domain dependencies in form submit handlers when practical.
- Use a plain mutation when the result cannot be predicted safely, including imports, generated results, complex server transformations, and destructive operations with unknown side effects.
- For paginated, filtered, sorted, or localized query families, do not guess which cached results a mutation affects. Scope the optimistic mutation to an explicit query instance, or introduce a canonical entity store when updates must appear across every query.
- Name query-retention and mutation-optimism concepts precisely: `Atom.optimistic(queryAtom)` preserves provisional or previous query state, while `Atom.optimisticFn(...)` applies an optimistic mutation reducer with rollback.
- Use `src/agent-examples/service/atom.ts` in the KrakStack reference repository as the required starting pattern for optimistic CRUD atoms, then adapt it to the application's real `AtomHttpApi` query and mutation atoms.

### Backend

- Effect application services.
- Effect Postgres and Drizzle ORM for database access.
- Effect HttpApi, HttpServer, OpenAPI, and OpenTelemetry for API and runtime concerns.
- Effect durable workflows for long-running, retryable, or resumable orchestration.

## Folder Structure

- `public/` contains static assets.
- `scripts/` contains build and utility scripts.
- `tmp/` contains local temporary files that should not be committed.
- `src/components/` contains React components.
- `src/components/ui/` contains shadcn-managed primitives. Do not edit directly.
- `src/db/` contains Drizzle schema definitions.
- `src/hooks/` contains shared React hooks.
- `src/lib/` contains shared utilities.
- `src/messages/` contains i18n source files.
- `src/paraglide/` contains generated i18n runtime. Do not edit directly.
- `src/routes/` contains TanStack Start file-based routes.
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

## Schema

- Use Effect `Schema` for all parsing, decoding, validation, and type-safe boundary checks.
- Define reusable schemas in the nearest `schema.ts` file and annotate them with `.annotate({ identifier: "Name" })`.
- Validate untrusted inputs at boundaries using Effect schema decoders, including API payloads, query params, route params, form inputs, external API responses, environment variables, JSON blobs, and persisted data.
- Do not write custom runtime validation such as `typeof value === "object"`, `Array.isArray(value)`, manual property checks, custom type guards, or ad hoc `JSON.parse` validation when an Effect `Schema` can express the shape.
- Prefer Effect codecs and helpers such as `Schema.decodeUnknown`, `Schema.decodeUnknownSync`, `Schema.fromJsonString(...)`, and `HttpClientResponse.schemaBodyJson(...)` over manual parsing.
- Keep validation failures typed and explicit. Map schema parse errors into domain-specific errors where needed instead of throwing broad errors.
- Use custom predicates only inside Effect schema refinements or filters, and only when the rule cannot be represented with built-in schema combinators.

## Services

Use service-based design for CRUD, features, integrations, and related domain concerns.

A typical service should use this structure:

- `src/services/<name>/schema.ts` defines Effect schemas, payload schemas, route params, and standard schema exports.
- `src/services/<name>/index.ts` implements the Effect `Context.Service` and exposes production and test layers where needed.
- `src/services/<name>/workflows.ts` defines versioned durable workflows and their activity orchestration.
- `src/services/<name>/api.group.ts` defines the HttpApiGroup contract.
- `src/services/<name>/api.builder.ts` wires the service into the root API with auth and error mapping.
- `src/services/<name>/client/atom.ts` defines query and mutation atoms.
- `src/services/<name>/client/form.tsx` defines reusable create/edit forms.
- `src/services/<name>/client/table.tsx` defines data tables and row actions.

Service methods should accept object inputs, scope by the current user or tenant where applicable, and avoid exposing cross-tenant data.

## Workflows

Use Effect durable workflows for operations that must survive interruption, retry individual steps, resume later, or coordinate multiple services over time.

- Define the shared `ClusterWorkflowEngine` layer in `src/services/workflow.ts` and provide its database and runner dependencies at the application composition root.
- Define service-owned workflows in `src/services/<name>/workflows.ts` with `Workflow.make(...)` and export their `toLayer(...)` implementation.
- Version workflow and activity names, such as `CreateExampleV1` and `PersistExampleV1`. Treat persisted workflow names and payload schemas as compatibility boundaries.
- Give every workflow a stable idempotency key derived from a caller-provided request or domain identifier.
- Wrap side effects in `Activity.make(...)` and define serializable Effect schemas for workflow payloads, successes, and typed errors.
- Keep HTTP, authentication, and request-specific concerns at the API boundary. Pass validated actor or tenant identifiers into the workflow payload.
- Keep durable orchestration in `workflows.ts`; keep reusable domain and persistence operations in the service.
- Compose each workflow layer with its service dependencies, then provide the shared workflow engine layer at the application root.

## API

- Define the root API in `src/api.ts`.
- Merge service API groups into the root API with `.add(...)`.
- Keep OpenAPI annotations on the root API.
- OpenAPI documentation is served at `/api/docs`.
- MCP server support is served at `/api/mcp` and should use `@krak-stack/httpapi-mcp`.
- CLI support should use `@krak-stack/httpapi-cli`.

## Tooling

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

## End-to-End Testing

- Use Playwright for browser-level tests of user journeys, UI behavior, routing, authentication, and frontend-to-API integrations.
- Keep end-to-end tests in `e2e/` as `*.spec.ts` files and share repeated setup through focused helpers.
- Run `bun run test:e2e:install` once when Chromium is not installed, `bun run test:e2e` for the full suite, and `bun run test:e2e:ui` when interactive debugging is useful.
- Use the Playwright CLI to exercise changed UI and integrations as you build, not only after implementation is complete. Start with the smallest relevant spec or title filter, inspect the browser result, and rerun after each meaningful change before running the full suite.
- Run a focused test with `bun run test:e2e -- e2e/<name>.spec.ts` or `bun run test:e2e -- --grep "<test name>"`.
- Prefer assertions against user-visible outcomes and accessible locators such as `getByRole`, `getByLabel`, and `getByText`. Avoid implementation-coupled selectors and arbitrary sleeps.
- Cover complete high-value flows across UI and API boundaries. Keep lower-level edge cases in Vitest rather than duplicating them in browser tests.
- Make test data unique and deterministic, isolate browser contexts where roles or sessions differ, and clean up persistent state when a test can affect later runs.
- End-to-end tests must use `TEST_DATABASE_URL`; never use `DATABASE_URL`. The Playwright configuration maps the test database into the application process and starts the development server automatically.
- Use Playwright traces, screenshots, and the UI runner to diagnose failures. Do not weaken assertions, add unconditional delays, or increase timeouts until the underlying behavior has been investigated.
- Before considering a UI or integration change complete, run the focused Playwright coverage for the changed journey and, when practical, the full end-to-end suite.

## Checks

Run checks after code changes when practical:

- `bun run test`
- `bun run test:e2e`
- `bun type:check`
- `bun lint`
- `bun fmt`

## Examples

KrakStack examples are the canonical architecture reference for this project. Prefer the configured `krakstack` project reference. If it is unavailable, use `https://github.com/krakcons/krakstack/tree/main/src/agent-examples`.

Before implementing or substantially refactoring one of the areas below, read the corresponding KrakStack example and the nearest equivalent implementation in this repository.

| Task                  | Required KrakStack reference                |
| --------------------- | ------------------------------------------- |
| Effect service        | `src/agent-examples/service/service.ts`     |
| Effect schemas        | `src/agent-examples/service/schema.ts`      |
| Durable workflows     | `src/agent-examples/service/workflows.ts`   |
| Workflow engine layer | `src/services/workflow.ts`                  |
| HttpApi contract      | `src/agent-examples/service/api.group.ts`   |
| HttpApi handlers      | `src/agent-examples/service/api.builder.ts` |
| Root API registration | `src/agent-examples/service/api-entry.ts`   |
| Client atoms          | `src/agent-examples/service/atom.ts`        |
| Forms                 | `src/agent-examples/service/form.tsx`       |
| Tables                | `src/agent-examples/service/table.tsx`      |

<!-- intent-skills:start -->

## Skill Loading

Before substantial work:

- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->
