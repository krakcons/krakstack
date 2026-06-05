import { Schema } from "effect";

export type SortDirection = "asc" | "desc";

export interface SortState {
  id: string;
  desc: boolean;
}

export interface SortParam {
  id: string;
  direction: SortDirection;
}

export const encodeSortParam = (sorting: ReadonlyArray<SortState> = []) => {
  const sort = sorting[0];
  return sort ? `${sort.id}:${sort.desc ? "desc" : "asc"}` : undefined;
};

export const decodeSortParam = (sort: string | undefined): SortParam | null => {
  const [id, direction] = sort?.split(":") ?? [];

  if (!id || (direction !== "asc" && direction !== "desc")) {
    return null;
  }

  return { id, direction };
};

export const Query = Schema.Struct({
  page: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  pageSize: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })),
  globalFilter: Schema.optional(Schema.String),
  sort: Schema.optional(Schema.String),
}).pipe(
  Schema.annotate({
    identifier: "Query",
    title: "Query",
    description:
      "Zero-based page request parameters with optional filtering and sorting for list endpoints.",
    examples: [
      {
        page: 0,
        pageSize: 10,
        globalFilter: "housing",
        sort: "publicName:asc",
      },
    ],
  }),
);

export type QueryType = typeof Query.Type;

export const PaginationMeta = Schema.Struct({
  page: Schema.Int,
  pageSize: Schema.Int,
  total: Schema.Int,
  pageCount: Schema.Int,
}).pipe(
  Schema.annotate({
    identifier: "PaginationMeta",
    title: "Pagination Metadata",
    description: "Pagination metadata returned with a paginated list response.",
    examples: [{ page: 0, pageSize: 10, total: 125, pageCount: 13 }],
  }),
);

export type PaginationMetaType = typeof PaginationMeta.Type;

export const PaginatedResponse = <A>(items: Schema.Schema<A>) =>
  Schema.Struct({
    data: Schema.Array(items),
    meta: PaginationMeta,
  });
