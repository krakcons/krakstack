import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";

import {
  PaginatedResponse,
  Query,
  QueryStandard,
  SortParamFromString,
  SortParamsFromString,
} from "./query";

describe("Query", () => {
  it("validates router sorting with default pagination", async () => {
    const sort = [{ id: "name", direction: "desc" }];
    expect(await QueryStandard["~standard"].validate({ sort })).toEqual({
      value: { page: 0, pageSize: 10, sort },
    });
  });

  it("rejects malformed HTTP sorting", () => {
    const codec = Schema.toCodecStringTree(Query);
    for (const sort of ["-", "name,-", "name:desc"]) {
      expect(() => Schema.decodeUnknownSync(codec)({ sort })).toThrow();
    }
  });

  it("preserves item codecs in paginated responses", () => {
    const codec = PaginatedResponse(
      Schema.Struct({ createdAt: Schema.DateFromString }),
    );
    const encoded = {
      data: [{ createdAt: "2026-09-18T00:00:00.000Z" }],
      meta: { page: 0, pageSize: 10, total: 1, pageCount: 1 },
    };
    const decoded = Schema.decodeUnknownSync(codec)(encoded);
    expect(decoded.data[0]?.createdAt).toEqual(
      new Date(encoded.data[0]!.createdAt),
    );
    expect(Schema.encodeSync(codec)(decoded)).toEqual(encoded);
  });

  it("round-trips structured sorting through HTTP query strings", () => {
    const codec = Schema.toCodecStringTree(Query);
    const query = {
      page: 2,
      pageSize: 25,
      sort: [
        { id: "name", direction: "desc" as const },
        { id: "createdAt", direction: "asc" as const },
      ],
    };
    const encoded = Schema.encodeSync(codec)(query);
    expect(encoded).toEqual({
      page: "2",
      pageSize: "25",
      sort: "-name,createdAt",
    });
    expect(Schema.decodeUnknownSync(codec)(encoded)).toEqual(query);
  });

  it("round-trips cleared and omitted sorting over HTTP", () => {
    const codec = Schema.toCodecStringTree(Query);
    for (const query of [
      { page: 0, pageSize: 10 },
      { page: 0, pageSize: 10, sort: [] },
    ]) {
      expect(
        Schema.decodeUnknownSync(codec)(Schema.encodeSync(codec)(query)),
      ).toEqual(query);
    }
  });

  it("preserves sorting arrays in JSON", () => {
    const query = {
      page: 0,
      pageSize: 10,
      sort: [{ id: "name", direction: "asc" as const }],
    };
    expect(Schema.encodeSync(Schema.toCodecJson(Query))(query)).toEqual(query);
  });

  it("defaults omitted pagination for router and request consumers", () => {
    expect(Schema.decodeUnknownSync(Query)({})).toEqual({
      page: 0,
      pageSize: 10,
    });
  });

  it("validates structured sorting", () => {
    expect(
      Schema.decodeUnknownSync(Query)({
        page: 2,
        pageSize: 25,
        globalFilter: "active",
        sort: [
          { id: "name", direction: "desc" },
          { id: "createdAt", direction: "asc" },
        ],
      }),
    ).toEqual({
      page: 2,
      pageSize: 25,
      globalFilter: "active",
      sort: [
        { id: "name", direction: "desc" },
        { id: "createdAt", direction: "asc" },
      ],
    });
  });

  it("keeps structured sorting when encoded", () => {
    expect(
      Schema.encodeSync(Query)({
        page: 2,
        pageSize: 25,
        sort: [
          { id: "name", direction: "desc" },
          { id: "createdAt", direction: "asc" },
        ],
      }),
    ).toEqual({
      page: 2,
      pageSize: 25,
      sort: [
        { id: "name", direction: "desc" },
        { id: "createdAt", direction: "asc" },
      ],
    });
  });

  it("reports invalid encoded sorting", () => {
    expect(() => Schema.decodeUnknownSync(SortParamFromString)("-")).toThrow(
      'Expected sort in the format "field" or "-field"',
    );
    expect(() =>
      Schema.decodeUnknownSync(SortParamsFromString)("name,-"),
    ).toThrow('Expected sort in the format "field,-otherField"');
  });
});
