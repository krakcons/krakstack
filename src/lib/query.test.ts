import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";

import { Query, SortParamFromString, SortParamsFromString } from "./query";

describe("Query", () => {
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
