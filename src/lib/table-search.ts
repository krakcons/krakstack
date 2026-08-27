import { Query } from "@/lib/query";
import { Schema } from "effect";

export const TableSearchSchema = Schema.Struct({
  page: Schema.optional(Query.fields.page),
  pageSize: Schema.optional(Query.fields.pageSize),
  globalFilter: Query.fields.globalFilter,
  sort: Query.fields.sort,
  grouping: Schema.optional(Schema.Array(Schema.String)),
}).annotate({ identifier: "TableSearch" });

export const TableSearchSchemaStandard: ReturnType<
  typeof Schema.toStandardSchemaV1<typeof TableSearchSchema>
> = Schema.toStandardSchemaV1(TableSearchSchema);

export type TableParams = Schema.Schema.Type<typeof TableSearchSchema>;
