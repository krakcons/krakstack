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
- Let the Paraglide Vite plugin compile translations automatically during development and builds. Do not run manual Paraglide compilation commands (such as `paraglide-js compile`) or rewrite `src/paraglide/`; doing so can conflict with the running Vite server and trigger reload loops.
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
- Effect Postgres with `SqlClient` and `SqlSchema` for database access.
- Effect HttpApi, HttpServer, OpenAPI, and OpenTelemetry for API and runtime concerns.
- Effect durable workflows for long-running, retryable, or resumable orchestration.

## Folder Structure

- `public/` contains static assets.
- `scripts/` contains build and utility scripts.
- `tmp/` contains local temporary files that should not be committed.
- `src/components/` contains React components.
- `src/components/ui/` contains shadcn-managed primitives. Do not edit directly.
- `src/db/` contains the Effect SQL migration runner.
- `src/db/migrations/` contains versioned SQL migrations.
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
- Expose `SqlSchema` operations directly when they already provide the complete service method; do not add pass-through `Effect.fn` wrappers.
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

## Database

- Depend directly on `SqlClient.SqlClient` in persistence services instead of wrapping it in an application database service.
- Define reusable SQL request and result schemas in the service's `schema.ts`, then use `SqlSchema.findAll`, `findOne`, or `findOneOption` for request encoding, result decoding, and row cardinality.
- Prefer explicit Effect schemas for straightforward select, create, and update representations. Introduce `Model.Class` only when database, insert, update, and JSON variants differ enough to justify it.
- Write parameterized SQL explicitly and include the current user or tenant in every applicable read, update, and delete predicate.
- Do not use an ID-only generated repository for tenant-owned records when it cannot enforce the tenant predicate.
- Define database-agnostic migration loaders with `Migrator.fromRecord(...)` and write their effects against `SqlClient.SqlClient`.
- Prefer the generic `Migrator` and `SqlClient` APIs when no PostgreSQL-specific capability is needed. Use `PgMigrator`, `PgClient`, or another dialect module only for its runner, layer, or dialect-specific behavior.
- Run PostgreSQL migration loaders through `PgMigrator.run(...)` during application layer acquisition before dependent services are exposed.
- Treat migration names and completed migrations as compatibility boundaries. Add a new migration instead of editing one that may have run in another environment.

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

- Test meaningful behavior and regression risks: business rules, authorization, tenant isolation, persistence, state transitions, validation, and error handling. Include focused regression tests for bug fixes when practical.
- Do not add or run tests solely for copy, translations, documentation, styling, layout, or static markup unless explicitly requested. Test UI changes only when meaningful behavior changes.
- Reuse existing coverage and prefer the smallest test at the lowest effective layer; do not duplicate cases across unit, integration, and end-to-end tests.
- Use Vitest with `@effect/vitest`, importing `describe`, `expect`, and `it` from it. Keep `*.test.ts` / `*.test.tsx` beside code; use `it.effect` and `Effect.provide(...)` for Effect programs.
- Isolate mutable state with fresh test layers or explicit resets.
- Persistence tests must use real Postgres through `TEST_DATABASE_URL`, never `DATABASE_URL`; pure logic needs no database. Run migrations first and use `SqlClient` with parameterized SQL for setup and cleanup.

## End-to-End Testing

- Use Playwright selectively for critical journeys requiring a browser or frontend-to-API integration; keep specs in `e2e/*.spec.ts` and lower-level edge cases in Vitest.
- Assert observable outcomes with accessible locators. Avoid incidental prose, CSS classes, DOM structure, and presentation snapshots unless they are explicit requirements.
- Use unique, deterministic data, isolate sessions, and clean up persistent state. Database-backed tests must use `TEST_DATABASE_URL`, never `DATABASE_URL`.
- E2E tests are slow: run them as final validation after implementation, not iteratively after each edit; rerun only to verify fixes for E2E failures. Use focused coverage with `bun run test:e2e -- e2e/<name>.spec.ts` or `bun run test:e2e -- --grep "<test name>"`; reserve the full suite for broad changes, insufficient focused coverage, or explicit requests.
- Diagnose failures with traces or screenshots; do not weaken assertions, add arbitrary sleeps, or increase timeouts without investigating.

## Checks

- Match checks to risk; do not run everything by default. Run focused tests for behavior changes and broader suites only when needed.
- Documentation-only changes need no application tests or type checks. For copy or presentation changes, use formatting, compilation checks, or visual review only when useful.
- Use `bun type:check` for TypeScript changes when practical; scope `bun lint` and `bun fmt` to changed files when supported and avoid unrelated churn.
- Report checks run and blockers; never imply unrun checks passed.

## Examples

KrakStack examples are the canonical architecture reference for this project. Prefer the configured `krakstack` project reference. If it is unavailable, use `https://github.com/krakcons/krakstack/tree/main/src/agent-examples`.

Before implementing or substantially refactoring one of the areas below, read the corresponding KrakStack example and the nearest equivalent implementation in this repository.

| Task                  | Required KrakStack reference                |
| --------------------- | ------------------------------------------- |
| Effect service        | `src/agent-examples/service/service.ts`     |
| Effect schemas        | `src/agent-examples/service/schema.ts`      |
| Effect SQL migrations | `src/agent-examples/database/migrations.ts` |
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
