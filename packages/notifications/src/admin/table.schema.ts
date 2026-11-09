// Wire-compatible with KrakStack DataTable public state.
import { DateTime, Option, Schema } from "effect";

const CalendarDate = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/),
  Schema.makeFilter((value) =>
    Option.exists(
      DateTime.make(value),
      (date) => DateTime.formatIsoDateUtc(date) === value,
    ),
  ),
).annotate({ identifier: "NotificationAdminCalendarDate" });

export const TableFilter = Schema.Union([
  Schema.Struct({
    id: Schema.NonEmptyString,
    kind: Schema.Literal("text"),
    operator: Schema.Literals(["contains", "equals", "startsWith", "endsWith"]),
    value: Schema.NonEmptyString,
  }),
  Schema.Struct({
    id: Schema.NonEmptyString,
    kind: Schema.Literal("values"),
    values: Schema.NonEmptyArray(Schema.String),
  }),
  Schema.Struct({
    id: Schema.NonEmptyString,
    kind: Schema.Literal("boolean"),
    value: Schema.Boolean,
  }),
  Schema.Struct({
    id: Schema.NonEmptyString,
    kind: Schema.Literal("number"),
    min: Schema.optional(Schema.Finite),
    max: Schema.optional(Schema.Finite),
  }).check(
    Schema.makeFilter(
      (v) =>
        (v.min !== undefined || v.max !== undefined) &&
        (v.min === undefined || v.max === undefined || v.min <= v.max),
    ),
  ),
  Schema.Struct({
    id: Schema.NonEmptyString,
    kind: Schema.Literal("date"),
    from: Schema.optional(CalendarDate),
    to: Schema.optional(CalendarDate),
  }).check(
    Schema.makeFilter(
      (v) =>
        (v.from !== undefined || v.to !== undefined) &&
        (v.from === undefined || v.to === undefined || v.from <= v.to),
    ),
  ),
]).annotate({ identifier: "NotificationAdminTableFilter" });

export const TableState = Schema.Struct({
  page: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 1_000_000 })),
  pageSize: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })),
  globalFilter: Schema.optional(Schema.String.check(Schema.isMaxLength(200))),
  filters: Schema.optional(
    Schema.Array(TableFilter).check(Schema.isMaxLength(30)),
  ),
  sort: Schema.optional(
    Schema.Array(
      Schema.Struct({
        id: Schema.NonEmptyString,
        direction: Schema.Literals(["asc", "desc"]),
      }),
    ).check(Schema.isMaxLength(10)),
  ),
}).annotate({ identifier: "NotificationAdminTableState" });

export const TableQuery = Schema.Struct({
  table: Schema.fromJsonString(TableState),
}).annotate({ identifier: "NotificationAdminTableQuery" });
export const tablePage = <S extends Schema.Top>(
  row: S,
  identifier = "NotificationAdminTablePage",
) =>
  Schema.Struct({
    items: Schema.Array(row),
    total: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  }).annotate({ identifier });
export const initialTableState: typeof TableState.Type = {
  page: 0,
  pageSize: 20,
};
