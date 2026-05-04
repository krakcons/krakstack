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

#### Server

Use effect based httpapi, httpserver, openapi, opentelemetry, and database service with drizzle-orm. Make sure to use drizzle-orm queries not raw sql.

- `src/services/example/index.ts`:
  - Main interface for the service.
  - Recommended Packages: `@/services/database`, `./schema`, `effect`
  - Example: Crud, Tasks.list, Tasks.create, Tasks.update, Tasks.delete
- `src/services/example/schema.ts`:
  - Defines the schema for the service.
  - Recommended Packages: [`drizzle-orm/effect-schema`](https://orm.drizzle.team/docs/effect-schema), `effect`
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

All schemas should be made using effect schema.

Do not use `zod` or other validation libraries.

### Documentation

Whenever you make an API or Schema, ensure it is documented.

- API: Use `OpenAPI` from `effect/unstable/httpapi` to generate the OpenAPI spec. Use annotations to add a title, description, summary, etc.
- Schema: Use `Schema.annotate({ ... })` to add a title, identifier, description, and examples to the schema.

## Examples

### Form (`src/services/example/client/form.tsx`)

Reusable create/edit dialog. `useAppForm` + Effect `Schema` validator, atoms for persistence, controlled or uncontrolled `open`.

```tsx
export function AgentDialog({ agent, open, onOpenChange, trigger }: Props) {
  const createAgent = useAtomSet(createAgentAtom);
  const updateAgent = useAtomSet(updateAgentAtom);
  const [error, setError] = useState("");
  const isEditing = Boolean(agent);

  const form = useAppForm({
    defaultValues: { name: agent?.name ?? "", description: agent?.description ?? "" },
    validators: { onSubmit: Schema.toStandardSchemaV1(CreateAgent) },
    onSubmit: async ({ value }) => {
      try {
        const payload = { name: value.name.trim(), description: value.description?.trim() || null };
        agent
          ? await updateAgent({ params: { id: agent.id }, payload, reactivityKeys: ["agents"] })
          : await createAgent({ payload, reactivityKeys: ["agents"] });
        onOpenChange?.(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : m.agent_save_failed());
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
            <DialogTitle>{isEditing ? m.agent_edit() : m.agent_create()}</DialogTitle>
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

Tanstack table of `Agent` rows. Loaded via atom, with edit/toggle/delete row actions and the `AgentDialog` wired in for inline edits.

```tsx
export function AgentTable() {
  const result = useAgentsAtom();
  const updateAgent = useAtomSet(updateAgentAtom);
  const deleteAgent = useAtomSet(deleteAgentAtom);
  const [editing, setEditing] = useState<Agent | null>(null);

  const agents = AsyncResult.match(result, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => Array.from(value),
  });

  const columns: ColumnDef<Agent>[] = [
    { accessorKey: "name", header: m.agent() },
    {
      accessorKey: "active",
      header: m.active(),
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "default" : "secondary"}>
          {row.original.active ? m.active() : m.inactive()}
        </Badge>
      ),
    },
    createDataTableActionsColumn<Agent>([
      { name: m.edit(), icon: <Pencil />, onClick: setEditing },
      {
        name: m.toggle(),
        icon: <Power />,
        onClick: (a) =>
          updateAgent({
            params: { id: a.id },
            payload: { active: !a.active },
            reactivityKeys: ["agents"],
          }),
      },
      {
        name: m.delete(),
        icon: <Trash2 />,
        variant: "destructive",
        onClick: (a) => deleteAgent({ params: { id: a.id }, reactivityKeys: ["agents"] }),
      },
    ]),
  ];

  return AsyncResult.match(result, {
    onInitial: () => <div>{m.loading()}</div>,
    onFailure: () => <div>{m.error()}</div>,
    onSuccess: () => (
      <>
        <DataTable columns={columns} data={agents} onRowClick={setEditing} />
        {editing && (
          <AgentDialog agent={editing} open onOpenChange={(o) => !o && setEditing(null)} />
        )}
      </>
    ),
  });
}
```

### Atom (`src/services/example/client/atom.ts`)

Optimistic CRUD atoms. Server query is wrapped with `Atom.optimistic`, and each mutation patches the cached list before the network round-trip resolves.

```ts
export type Agent = typeof AgentSchema.Type;
export type CreateAgentPayload = typeof CreateAgent.Type;

const serverAgentsAtom = ApiClient.query("agents", "listAgents", {
  timeToLive: "5 minutes",
  reactivityKeys: ["agents"],
});

const current = (r: AsyncResult.AsyncResult<ReadonlyArray<Agent>, unknown>) =>
  AsyncResult.match(r, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => Array.from(value),
  });

const optimisticAgent = (p: CreateAgentPayload): Agent => {
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

export const allAgentsAtom = Atom.optimistic(serverAgentsAtom);

export const createAgentAtom = Atom.optimisticFn(allAgentsAtom, {
  reducer: (c, a) => AsyncResult.success([optimisticAgent(a.payload), ...current(c)]),
  fn: ApiClient.mutation("agents", "createAgent"),
});

export const updateAgentAtom = Atom.optimisticFn(allAgentsAtom, {
  reducer: (c, a) =>
    AsyncResult.success(
      current(c).map((agent) =>
        agent.id === a.params.id ? { ...agent, ...a.payload, updatedAt: new Date() } : agent,
      ),
    ),
  fn: ApiClient.mutation("agents", "updateAgent"),
});

export const deleteAgentAtom = Atom.optimisticFn(allAgentsAtom, {
  reducer: (c, a) => AsyncResult.success(current(c).filter((x) => x.id !== a.params.id)),
  fn: ApiClient.mutation("agents", "deleteAgent"),
});

export const useAgentsAtom = () => useAtomValue(allAgentsAtom);
```

### Service (`src/services/example/index.ts`)

Effect `Context.Service` exposing CRUD for the service. Each method scopes by `userId` so callers can't reach across tenants.

```ts
export class Agents extends Context.Service<Agents>()("Agents", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    const list = Effect.fn("Agents.list")(function* (userId: string) {
      return yield* db.query.agents.findMany({ where: { userId } });
    });

    const get = Effect.fn("Agents.get")(function* (userId: string, id: string) {
      return yield* db.query.agents.findFirst({ where: { id, userId } });
    });

    const create = Effect.fn("Agents.create")(function* (
      userId: string,
      input: typeof CreateAgent.Type,
    ) {
      const [agent] = yield* db
        .insert(agents)
        .values({ ...input, userId })
        .returning();
      return agent;
    });

    const update = Effect.fn("Agents.update")(function* (
      userId: string,
      id: string,
      input: typeof UpdateAgent.Type,
    ) {
      const [agent] = yield* db
        .update(agents)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(agents.id, id), eq(agents.userId, userId)))
        .returning();
      return agent;
    });

    const _delete = Effect.fn("Agents.delete")(function* (userId: string, id: string) {
      const [agent] = yield* db
        .delete(agents)
        .where(and(eq(agents.id, id), eq(agents.userId, userId)))
        .returning();
      return agent;
    });

    return { list, get, create, update, delete: _delete };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(DB.layer));
}
```

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
