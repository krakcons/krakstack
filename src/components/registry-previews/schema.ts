import { Schema } from "effect";

import { QueryStandard } from "@/lib/query";

export const DataTablePreviewSearch = Schema.Struct({
  ...QueryStandard.fields,
  columnTypes: Schema.optional(QueryStandard),
}).annotate({ identifier: "DataTablePreviewSearch" });

export const DataTablePreviewSearchStandard = Schema.toStandardSchemaV1(
  DataTablePreviewSearch,
);
