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

  it("decodes compact sorting into structured parameters", () => {
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
      sort: [
        { id: "name", direction: "desc" },
        { id: "createdAt", direction: "asc" },
      ],
    });
  });

  it("encodes structured sorting for the wire", () => {
    expect(
      Schema.encodeSync(Query)({
        page: 2,
        pageSize: 25,
        sort: [
          { id: "name", direction: "desc" },
          { id: "createdAt", direction: "asc" },
        ],
      }),
    ).toEqual({ page: 2, pageSize: 25, sort: "-name,createdAt" });
  });
});
