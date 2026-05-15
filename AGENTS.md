# AGENTS

## i18n

English and French are required for all public facing strings.

All public facing strings should be translated using paraglide.js and the vite plugin.

Custom translations are stored in `src/messages/global/en.json` and `src/messages/global/fr.json`. Do not edit the messages at `src/messages/en.json` and `src/messages/fr.json` directly as they are generated.

## Code Architecture

The application is divied into two classic areas: the frontend and the backend.

### Frontend

The frontend is a react application that uses:

- Tanstack start
- Shadcn
- Effect service state

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
  - `lib/` — Shared utilities, auth config
    - `atoms/` — Effect atom definitions
  - `messages/` — i18n source files
    - `global/` — Hand-written translations (en.json, fr.json) — edit these
    - `components/` — Component-specific translations — do not edit
    - Root `en.json`/`fr.json` are generated — do not edit
  - `paraglide/` — Generated paraglide runtime — do not edit
  - `routes/` — TanStack Start file-based routes
    - `api/` — API catch-all route
    - `docs/` — Documentation pages
  - `services/` — Effect service definitions and handlers

## Patterns

### Services

Use service based design where possible as an interface for related concerns. Use for crud, features, and other concerns.

#### Server

Use effect based httpapi, httpserver, openapi, opentelemetry, and database service with drizzle-orm. Make sure to use drizzle-orm queries not raw sql.

- `src/services/example/index.ts`:
  - Main interface for the service.
  - Recommended Packages: `@/services/database`, `./schema`, `effect`
  - Example: Crud, Tasks.list, Tasks.create, Tasks.update, Tasks.delete
- `src/services/example/schema.ts`:
  - Defines the schema for the service.
  - Recommended Packages: `effect`
- `src/services/example/api.group.ts`:
  - Defines the api contract with HttpApiGroup, routes, success/error schema, and request/response types.
  - Recommended Packages: `effect/unstable/httpapi`, `./schema`
- `src/services/example/api.builder.ts`:
  - Exposes the service through the api of the service based on the api group.
  - Recommended Packages: `./api`, `./schema`, `effect`, `effect/unstable/http`, `effect/unstable/httpapi`

#### Frontend

Use HttpClient instead of raw fetch, Reactivity for syncing state between components, IndexedDb for local persistence, and Atom for state management

- `src/services/example/client/`:
  - Defines the components for the service.
- `src/services/example/client/form.tsx`:
  - Defines the form for the service. Make it work for both create and update using default values.
  - Recommended Packages: `@/components/form.tsx`, `@/services/example/schema.ts`
- `src/services/example/client/table.tsx`:
  - Defines the table for the service. Add as many columns and actions as possible
  - Recommended Packages: `@/components/data-table.tsx`
- `src/services/example/client/atom.ts`:
  - Defines the atoms for the queries and mutations needed for the service.
  - Recommended Packages: `@effect/atom-react`, `effect/unstable/reactivity`, `@/lib/api-client`

#### Database

- Edit the `src/db/schema.ts` file to define the database schema, and relations at the bottom.

### API

Define the API within `src/api.ts` and merge the api groups found in services into it.

### Schema

All schemas should be generated from the effect schema and annotated with `Schema.annotate({ ... })`.

Do not use `zod` or other validation libraries.

### Documentation

Whenever you make an API or Schema, ensure it is documented.

- API: Use `OpenAPI` from `effect/unstable/httpapi` to generate the OpenAPI spec. Use annotations to add a title, description, summary, etc.
- Schema: Use `Schema.annotate({ ... })` to add a title, identifier, description, and examples to the schema.

## Testing

Use Vitest with `@effect/vitest` for tests.

- Add tests beside the code when practical using `*.test.ts` / `*.test.tsx`.
- Import `describe`, `expect`, and `it` from `@effect/vitest`.
- Use `it.effect` for Effect programs and provide dependencies with `Effect.provide(...)`.
- Prefer fresh per-test layers so mutable state does not leak. Use suite-shared layers only for expensive resources and reset state between tests.
- Backend/service tests should use the real Postgres test database through `TEST_DATABASE_URL`; never point tests at `DATABASE_URL`.
- The test database is provided externally. Set `TEST_DATABASE_URL` in `.env` or the shell before running tests.
- Expose service `testLayer`s for tests, backed by `DB.testLayer` where database access is needed.
- Run migrations against the test database before DB tests and reset affected tables between tests.
- Use Drizzle queries for test setup and cleanup where possible; avoid raw SQL unless a migration/lifecycle task requires it.

Run checks after testing changes:

- `bun run test`
- `bun type:check`
- `bun lint`
- `bun fmt`

## Examples

### Schema (`src/services/example/schema.ts`)

Effect schemas for a service entity with CRUD payloads.

```ts
import { Schema } from "effect";

export const TaskSchema = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  title: Schema.String,
  description: Schema.NullOr(Schema.String),
  completed: Schema.Boolean,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "Task" });

export const CreateTaskSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
}).annotate({ identifier: "CreateTask" });

export const UpdateTaskSchema = Schema.Struct({
  title: Schema.optional(Schema.NonEmptyString),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  completed: Schema.optional(Schema.Boolean),
}).annotate({ identifier: "UpdateTask" });

export const TaskIdParamsSchema = Schema.Struct({ id: Schema.String }).annotate(
  {
    identifier: "TaskIdParamsSchema",
  },
);

export const TaskSchemaStandard = Schema.toStandardSchemaV1(TaskSchema);
```

### API Group (`src/services/example/api.group.ts`)

Defines the API contract with `HttpApiGroup`, routes, success/error schemas, and request/response types.

```ts
import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
} from "effect/unstable/httpapi";

import { AuthMiddleware } from "@/services/auth/middleware";

import {
  CreateExample,
  Example,
  ExampleIdParams,
  UpdateExample,
} from "./schema";

export const ExamplesApiGroup = HttpApiGroup.make("examples")
  .add(
    HttpApiEndpoint.get("listExamples", "/examples", {
      success: Schema.Array(Example),
      error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
    }),
  )
  .add(
    HttpApiEndpoint.post("createExample", "/examples", {
      payload: CreateExample,
      success: Example,
      error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
    }),
  )
  .add(
    HttpApiEndpoint.get("getExample", "/examples/:id", {
      params: ExampleIdParams,
      success: Example,
      error: [
        HttpApiError.Unauthorized,
        HttpApiError.NotFound,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.patch("updateExample", "/examples/:id", {
      params: ExampleIdParams,
      payload: UpdateExample,
      success: Example,
      error: [
        HttpApiError.Unauthorized,
        HttpApiError.NotFound,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.delete("deleteExample", "/examples/:id", {
      params: ExampleIdParams,
      success: Example,
      error: [
        HttpApiError.Unauthorized,
        HttpApiError.NotFound,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .middleware(AuthMiddleware);
```

### API Builder (`src/services/example/api.builder.ts`)

Exposes the service through the API using `HttpApiBuilder.group`, wiring handlers to the API group endpoints with auth and error mapping.

```ts
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { CurrentUser } from "@/services/auth/middleware";
import { Examples } from "@/services/example";

const internalServerError = () => new HttpApiError.InternalServerError({});

export const examplesHandler = HttpApiBuilder.group(
  Api,
  "examples",
  (handlers) =>
    handlers
      .handle("listExamples", () =>
        Effect.gen(function* () {
          const examples = yield* Examples;
          const user = yield* CurrentUser;

          return yield* examples
            .list({ userId: user.id })
            .pipe(Effect.mapError(internalServerError));
        }),
      )
      .handle("getExample", ({ params }) =>
        Effect.gen(function* () {
          const examples = yield* Examples;
          const user = yield* CurrentUser;
          const example = yield* examples
            .get({ userId: user.id, id: params.id })
            .pipe(Effect.mapError(internalServerError));

          if (!example) return yield* new HttpApiError.NotFound({});

          return example;
        }),
      )
      .handle("createExample", ({ payload }) =>
        Effect.gen(function* () {
          const examples = yield* Examples;
          const user = yield* CurrentUser;

          const example = yield* examples
            .create({ userId: user.id, payload })
            .pipe(Effect.mapError(internalServerError));

          if (!example) return yield* new HttpApiError.InternalServerError({});

          return example;
        }),
      )
      .handle("updateExample", ({ params, payload }) =>
        Effect.gen(function* () {
          const examples = yield* Examples;
          const user = yield* CurrentUser;

          const example = yield* examples
            .update({ userId: user.id, id: params.id, payload })
            .pipe(Effect.mapError(internalServerError));

          if (!example) return yield* new HttpApiError.NotFound({});

          return example;
        }),
      )
      .handle("deleteExample", ({ params }) =>
        Effect.gen(function* () {
          const examples = yield* Examples;
          const user = yield* CurrentUser;

          const example = yield* examples
            .delete({ userId: user.id, id: params.id })
            .pipe(Effect.mapError(internalServerError));

          if (!example) return yield* new HttpApiError.NotFound({});

          return example;
        }),
      ),
);
```

### Form (`src/services/example/client/form.tsx`)

Reusable create/edit dialog. `useAppForm` + Effect `Schema` validator, atoms for persistence, controlled or uncontrolled `open`.

```tsx
export function ExampleDialog({ example, open, onOpenChange, trigger }: Props) {
  const createExample = useAtomSet(createExampleAtom);
  const updateExample = useAtomSet(updateExampleAtom);
  const [error, setError] = useState("");
  const isEditing = Boolean(example);

  const form = useAppForm({
    defaultValues: {
      name: example?.name ?? "",
      description: example?.description ?? "",
    },
    validators: { onSubmit: Schema.toStandardSchemaV1(CreateExample) },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          name: value.name.trim(),
          description: value.description?.trim() || null,
        };
        example
          ? await updateExample({
              params: { id: example.id },
              payload,
              reactivityKeys: ["examples"],
            })
          : await createExample({ payload, reactivityKeys: ["examples"] });
        onOpenChange?.(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : m.example_save_failed());
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isEditing ? m.example_edit() : m.example_create()}
            </DialogTitle>
          </DialogHeader>
          <form.AppForm>
            <form.AppField name="name">
              {(f) => <f.TextField label={m.name()} autoFocus />}
            </form.AppField>
            <form.AppField name="description">
              {(f) => <f.TextAreaField label={m.description()} />}
            </form.AppField>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <form.SubmitButton />
            </DialogFooter>
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Table (`src/services/example/client/table.tsx`)

Tanstack table of `Example` rows. Loaded via atom, with edit/toggle/delete row actions and the `ExampleDialog` wired in for inline edits.

```tsx
export function ExampleTable() {
  const result = useExamplesAtom();
  const updateExample = useAtomSet(updateExampleAtom);
  const deleteExample = useAtomSet(deleteExampleAtom);
  const [editing, setEditing] = useState<Example | null>(null);

  const examples = AsyncResult.match(result, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => Array.from(value),
  });

  const columns: ColumnDef<Example>[] = [
    { accessorKey: "name", header: m.example() },
    {
      accessorKey: "active",
      header: m.active(),
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "default" : "secondary"}>
          {row.original.active ? m.active() : m.inactive()}
        </Badge>
      ),
    },
    createDataTableActionsColumn<Example>([
      { name: m.edit(), icon: <Pencil />, onClick: setEditing },
      {
        name: m.toggle(),
        icon: <Power />,
        onClick: (e) =>
          updateExample({
            params: { id: e.id },
            payload: { active: !e.active },
            reactivityKeys: ["examples"],
          }),
      },
      {
        name: m.delete(),
        icon: <Trash2 />,
        variant: "destructive",
        onClick: (e) =>
          deleteExample({ params: { id: e.id }, reactivityKeys: ["examples"] }),
      },
    ]),
  ];

  return AsyncResult.match(result, {
    onInitial: () => <div>{m.loading()}</div>,
    onFailure: () => <div>{m.error()}</div>,
    onSuccess: () => (
      <>
        <DataTable columns={columns} data={examples} onRowClick={setEditing} />
        {editing && (
          <ExampleDialog
            example={editing}
            open
            onOpenChange={(o) => !o && setEditing(null)}
          />
        )}
      </>
    ),
  });
}
```

### Atom (`src/services/example/client/atom.ts`)

Optimistic CRUD atoms. Server query is wrapped with `Atom.optimistic`, and each mutation patches the cached list before the network round-trip resolves.

```tsx
export type Example = typeof ExampleSchema.Type;
export type CreateExamplePayload = typeof CreateExample.Type;

const serverExamplesAtom = ApiClient.query("examples", "listExamples", {
  timeToLive: "5 minutes",
  reactivityKeys: ["examples"],
});

const current = (r: AsyncResult.AsyncResult<ReadonlyArray<Example>, unknown>) =>
  AsyncResult.match(r, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => Array.from(value),
  });

const optimisticExample = (p: CreateExamplePayload): Example => {
  const now = new Date();
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    name: p.name,
    description: p.description ?? null,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
};

export const allExamplesAtom = Atom.optimistic(serverExamplesAtom);

export const createExampleAtom = Atom.optimisticFn(allExamplesAtom, {
  reducer: (c, a) =>
    AsyncResult.success([optimisticExample(a.payload), ...current(c)]),
  fn: ApiClient.mutation("examples", "createExample"),
});

export const updateExampleAtom = Atom.optimisticFn(allExamplesAtom, {
  reducer: (c, a) =>
    AsyncResult.success(
      current(c).map((example) =>
        example.id === a.params.id
          ? { ...example, ...a.payload, updatedAt: new Date() }
          : example,
      ),
    ),
  fn: ApiClient.mutation("examples", "updateExample"),
});

export const deleteExampleAtom = Atom.optimisticFn(allExamplesAtom, {
  reducer: (c, a) =>
    AsyncResult.success(current(c).filter((x) => x.id !== a.params.id)),
  fn: ApiClient.mutation("examples", "deleteExample"),
});

export const useExamplesAtom = () => useAtomValue(allExamplesAtom);
```

### Service (`src/services/example/index.ts`)

Effect `Context.Service` exposing CRUD for the service. Each method accepts object inputs and scopes by `userId` so callers can't reach across tenants.

```ts
export class Examples extends Context.Service<Examples>()("Examples", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    const list = Effect.fn("Examples.list")(function* ({
      userId,
    }: {
      userId: string;
    }) {
      return yield* db.query.examples.findMany({ where: { userId } });
    });

    const get = Effect.fn("Examples.get")(function* ({
      userId,
      id,
    }: {
      userId: string;
      id: string;
    }) {
      return yield* db.query.examples.findFirst({ where: { id, userId } });
    });

    const create = Effect.fn("Examples.create")(function* ({
      userId,
      payload,
    }: {
      userId: string;
      payload: typeof CreateExample.Type;
    }) {
      const [example] = yield* db
        .insert(examples)
        .values({ ...payload, userId })
        .returning();
      return example;
    });

    const update = Effect.fn("Examples.update")(function* ({
      userId,
      id,
      payload,
    }: {
      userId: string;
      id: string;
      payload: typeof UpdateExample.Type;
    }) {
      const [example] = yield* db
        .update(examples)
        .set({ ...payload, updatedAt: new Date() })
        .where(and(eq(examples.id, id), eq(examples.userId, userId)))
        .returning();
      return example;
    });

    const _delete = Effect.fn("Examples.delete")(function* ({
      userId,
      id,
    }: {
      userId: string;
      id: string;
    }) {
      const [example] = yield* db
        .delete(examples)
        .where(and(eq(examples.id, id), eq(examples.userId, userId)))
        .returning();
      return example;
    });

    return { list, get, create, update, delete: _delete };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(DB.layer),
  );
}
```

### API Entry (`src/api.ts`)

Defines the API for the service. Annotate with `OpenApi` to generate the OpenAPI spec. Chain groups with `.add`.

```tsx
import { HttpApi, OpenApi } from "effect/unstable/httpapi";

import { TasksApiGroup } from "@/services/task/api.group";

export const Api = HttpApi.make("Api")
  .annotateMerge(
    OpenApi.annotations({
      title: "KrakStack API",
      version: "1.0.0",
      description: "API for the KrakStack template application",
    }),
  )
  .add(TasksApiGroup)
  .prefix("/api");
```

## Preferences

- Prefer arrow functions `() => void` over function expressions `function () {}`
- Never use `as any` or `as Type` in typescript unless absolutely necessary

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
