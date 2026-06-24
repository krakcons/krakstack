import {
  Effect,
  Option,
  Schema,
  SchemaIssue,
  SchemaTransformation,
} from "effect";

export type SortDirection = "asc" | "desc";

export interface SortState {
  id: string;
  desc: boolean;
}

export interface SortParam {
  id: string;
  direction: SortDirection;
}

const parseSortParam = (sort: string): SortParam | null => {
  const id = sort.startsWith("-") ? sort.slice(1) : sort;

  if (!id || id.includes(",") || id.includes(":")) {
    return null;
  }

  return { id, direction: sort.startsWith("-") ? "desc" : "asc" };
};

export const SortDirection = Schema.Union([
  Schema.Literal("asc"),
  Schema.Literal("desc"),
]).pipe(
  Schema.annotate({
    identifier: "SortDirection",
    title: "Sort Direction",
    description: "Sort direction for list query results.",
    examples: ["asc", "desc"],
  }),
);

export const SortParam = Schema.Struct({
  id: Schema.NonEmptyString,
  direction: SortDirection,
}).pipe(
  Schema.annotate({
    identifier: "SortParam",
    title: "Sort Parameter",
    description: "Decoded sort parameter with a field id and direction.",
    examples: [{ id: "publicName", direction: "asc" }],
  }),
);

export const SortParamFromString = Schema.String.pipe(
  Schema.decodeTo(
    SortParam,
    SchemaTransformation.transformOrFail({
      decode: (sort) => {
        const sortParam = parseSortParam(sort);

        if (!sortParam) {
          return Effect.fail(
            new SchemaIssue.InvalidValue(Option.some(sort), {
              message: 'Expected sort in the format "field" or "-field"',
            }),
          );
        }

        return Effect.succeed(sortParam);
      },
      encode: (sort) =>
        Effect.succeed(sort.direction === "desc" ? `-${sort.id}` : sort.id),
    }),
  ),
  Schema.annotate({
    identifier: "SortParamFromString",
    title: "Sort Parameter From String",
    description:
      'URL encoded single sort parameter where descending fields are prefixed with "-".',
    examples: [{ id: "publicName", direction: "asc" }],
  }),
);

export const SortParamsFromString = Schema.String.pipe(
  Schema.decodeTo(
    Schema.Array(SortParam),
    SchemaTransformation.transformOrFail<ReadonlyArray<SortParam>, string>({
      decode: (sort) => {
        const parts = sort.split(",");
        const sortParams: SortParam[] = [];

        for (const part of parts) {
          const sortParam = parseSortParam(part);

          if (!sortParam) {
            return Effect.fail(
              new SchemaIssue.InvalidValue(Option.some(sort), {
                message: 'Expected sort in the format "field,-otherField"',
              }),
            );
          }

          sortParams.push(sortParam);
        }

        return Effect.succeed(sortParams);
      },
      encode: (sort) =>
        Effect.succeed(
          sort
            .map((part) => Schema.encodeSync(SortParamFromString)(part))
            .join(","),
        ),
    }),
  ),
  Schema.annotate({
    identifier: "SortParamsFromString",
    title: "Sort Parameters From String",
    description:
      'URL encoded sort parameters where descending fields are prefixed with "-" and multiple fields are comma-separated.',
    examples: [
      [
        { id: "name", direction: "desc" },
        { id: "age", direction: "asc" },
      ],
    ],
  }),
);

const SortParamSearch = SortParamsFromString.pipe(
  Schema.decodeTo(
    Schema.String,
    SchemaTransformation.transform({
      decode: (sort) => Schema.encodeSync(SortParamsFromString)(sort),
      encode: (sort) => Schema.decodeUnknownSync(SortParamsFromString)(sort),
    }),
  ),
  Schema.annotate({
    identifier: "SortParamSearch",
    title: "Sort Search Parameter",
    description:
      'Search parameter sort value normalized to the compact "-field,otherField" URL format.',
    examples: ["-name,age"],
  }),
);

export const Query = Schema.Struct({
  page: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  pageSize: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })),
  globalFilter: Schema.optional(Schema.String),
  sort: Schema.optional(SortParamSearch),
}).annotate({
  identifier: "Query",
  title: "Query",
  description:
    "Zero-based page request parameters with optional filtering and sorting for list endpoints.",
  examples: [
    {
      page: 0,
      pageSize: 10,
      globalFilter: "housing",
      sort: "-publicName,createdAt",
    },
  ],
});

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
