import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";

import { Query } from "./query";

describe("Query", () => {
  it("defaults omitted pagination for router and request consumers", () => {
    expect(Schema.decodeUnknownSync(Query)({})).toEqual({
      page: 0,
      pageSize: 10,
    });
  });

  it("normalizes compact sorting", () => {
    expect(
      Schema.decodeUnknownSync(Query)({
        page: 2,
        pageSize: 25,
        globalFilter: "active",
        sort: "-name,createdAt",
      }),
    ).toEqual({
      page: 2,
      pageSize: 25,
      globalFilter: "active",
      sort: "-name,createdAt",
    });
  });
});
