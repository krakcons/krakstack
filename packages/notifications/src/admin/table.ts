// SQL table queries for notification administration.
import { Effect, Schema } from "effect";
import { SqlClient, SqlSchema, type Statement } from "effect/sql";
import { SendValidationError, SendStorageError } from "./schema.js";
import { TableState, tablePage } from "./table.schema.js";

type Column = "text" | "number" | "date" | "boolean";

// Only explicitly exposed result columns can be searched, filtered or ordered.
// The base query owns installation/tenant scope and privacy exclusions.
export const queryTable = Effect.fn("NotificationAdmin.queryTable")(function* <
  S extends Schema.Top & { readonly DecodingServices: never },
>(options: {
  readonly sql: SqlClient.SqlClient;
  readonly row: S;
  readonly source: Statement.Statement<object>;
  readonly columns: Readonly<Record<string, Column>>;
  readonly key: string;
  readonly state: typeof TableState.Type;
}) {
  const sql = options.sql;
  const state = yield* Schema.decodeEffect(TableState)(options.state).pipe(
    Effect.mapError(
      () => new SendValidationError({ message: "Invalid table query" }),
    ),
  );
  const invalid = () =>
    new SendValidationError({
      message: "Unsupported table column or filter",
    });
  const clauses: Statement.Fragment[] = [];
  for (const filter of state.filters ?? []) {
    const kind = Object.hasOwn(options.columns, filter.id)
      ? options.columns[filter.id]
      : undefined;
    if (
      !kind ||
      (filter.kind === "values" ? kind !== "text" : kind !== filter.kind)
    )
      return yield* invalid();
    const column = sql(filter.id);
    switch (filter.kind) {
      case "text": {
        const value = filter.value.toLowerCase();
        clauses.push(
          filter.operator === "equals"
            ? sql`lower(${column}::text) = ${value}`
            : filter.operator === "startsWith"
              ? sql`starts_with(lower(${column}::text), ${value})`
              : filter.operator === "endsWith"
                ? sql`right(lower(${column}::text), length(${value})) = ${value}`
                : sql`strpos(lower(${column}::text), ${value}) > 0`,
        );
        break;
      }
      case "values":
        clauses.push(sql`${column} IN ${sql.in(filter.values)}`);
        break;
      case "boolean":
        clauses.push(sql`${column} = ${filter.value}`);
        break;
      case "number":
        if (filter.min !== undefined)
          clauses.push(sql`${column} >= ${filter.min}`);
        if (filter.max !== undefined)
          clauses.push(sql`${column} <= ${filter.max}`);
        break;
      case "date":
        if (filter.from)
          clauses.push(
            sql`${column} >= ${filter.from}::date::timestamp AT TIME ZONE 'UTC'`,
          );
        if (filter.to)
          clauses.push(
            sql`${column} < (${filter.to}::date + 1)::timestamp AT TIME ZONE 'UTC'`,
          );
        break;
    }
  }
  if (state.globalFilter) {
    const search = state.globalFilter.toLowerCase();
    clauses.push(
      sql.or(
        Object.entries(options.columns)
          .filter(([, kind]) => kind === "text")
          .map(
            ([id]) =>
              sql`strpos(lower(COALESCE(${sql(id)}::text, '')), ${search}) > 0`,
          ),
      ),
    );
  }
  const order: Statement.Fragment[] = [];
  for (const sort of state.sort ?? []) {
    if (!Object.hasOwn(options.columns, sort.id)) return yield* invalid();
    order.push(
      sql`${sql(sort.id)} ${sql.literal(sort.direction === "asc" ? "ASC NULLS LAST" : "DESC NULLS LAST")}`,
    );
  }
  // A stable tie-breaker prevents equal sort values from shuffling between pages.
  order.push(sql`${sql(options.key)} ASC`);
  // Count and page use one PostgreSQL statement/snapshot, including empty pages.
  return yield* SqlSchema.findOne({
    Request: Schema.Void,
    Result: tablePage(options.row),
    execute: () => sql`
    WITH filtered AS (SELECT * FROM (${options.source}) records WHERE ${clauses.length ? sql.and(clauses) : sql`TRUE`}),
    page AS (SELECT * FROM filtered ORDER BY ${sql.csv(order)} LIMIT ${state.pageSize} OFFSET ${state.page * state.pageSize})
    SELECT (SELECT count(*)::int FROM filtered) AS total,
      COALESCE((SELECT jsonb_agg(page) FROM page), '[]'::jsonb) AS items
  `,
  })(undefined).pipe(
    Effect.catchTag("NoSuchElementError", () =>
      Effect.fail(new SendStorageError({ message: "Missing table aggregate" })),
    ),
  );
});
