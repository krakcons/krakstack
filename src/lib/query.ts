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
        const [id, direction, ...rest] = sort.split(":");

        if (
          !id ||
          rest.length > 0 ||
          (direction !== "asc" && direction !== "desc")
        ) {
          return Effect.fail(
            new SchemaIssue.InvalidValue(Option.some(sort), {
              message:
                'Expected sort in the format "field:asc" or "field:desc"',
            }),
          );
        }

        return Effect.succeed({ id, direction });
      },
      encode: (sort) => Effect.succeed(`${sort.id}:${sort.direction}`),
    }),
  ),
).pipe(
  Schema.annotate({
    identifier: "SortParamFromString",
    title: "Sort Parameter From String",
    description:
      'URL encoded sort parameter in the compact "field:direction" format.',
    examples: [{ id: "publicName", direction: "asc" }],
  }),
);

const SortParamSearch = Schema.Union([SortParamFromString, SortParam]).pipe(
  Schema.decodeTo(
    Schema.String,
    SchemaTransformation.transform({
      decode: (sort) => Schema.encodeSync(SortParamFromString)(sort),
      encode: (sort) => Schema.decodeUnknownSync(SortParamFromString)(sort),
    }),
  ),
  Schema.annotate({
    identifier: "SortParamSearch",
    title: "Sort Search Parameter",
    description:
      'Search parameter sort value normalized to the compact "field:direction" URL format.',
    examples: ["publicName:asc"],
  }),
);

export const Query = Schema.Struct({
  page: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  pageSize: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })),
  globalFilter: Schema.optional(Schema.String),
  sort: Schema.optional(SortParamSearch),
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
