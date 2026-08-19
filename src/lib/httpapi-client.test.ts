import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema, SchemaTransformation } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
} from "effect/unstable/httpapi";

import {
  encodeHttpApiOperationResult,
  makeHttpApiOperationResultEncoder,
} from "./httpapi-client";

const UrlFromString = Schema.String.pipe(
  Schema.decodeTo(
    Schema.instanceOf(URL),
    SchemaTransformation.transform({
      decode: (value) => new URL(value),
      encode: (value) => value.toString(),
    }),
  ),
);

const TestApi = HttpApi.make("test").add(
  HttpApiGroup.make("resources").add(
    HttpApiEndpoint.get("getResource", "/resources/:id", {
      success: Schema.Struct({
        canonicalUrl: UrlFromString,
        createdAt: Schema.Date,
        description: Schema.optional(Schema.String),
      }),
    }),
  ),
);

describe("encodeHttpApiOperationResult", () => {
  it.effect("normalizes empty responses to JSON null", () =>
    Effect.gen(function* () {
      expect(yield* encodeHttpApiOperationResult(undefined)).toBeNull();
    }),
  );

  it.effect("encodes decoded response values for tool transports", () =>
    Effect.gen(function* () {
      expect(
        yield* encodeHttpApiOperationResult(
          new Date("2026-08-17T00:00:00.000Z"),
        ),
      ).toBe("2026-08-17T00:00:00.000Z");
      expect(
        yield* encodeHttpApiOperationResult(new Uint8Array([75, 83])),
      ).toBe("S1M=");
    }),
  );

  it.effect("encodes decoded values nested in objects and arrays", () =>
    Effect.gen(function* () {
      expect(
        yield* encodeHttpApiOperationResult({
          createdAt: new Date("2026-08-17T00:00:00.000Z"),
          attachments: [new Uint8Array([75, 83])],
          sections: [{ updatedAt: new Date("2026-08-18T00:00:00.000Z") }],
        }),
      ).toEqual({
        createdAt: "2026-08-17T00:00:00.000Z",
        attachments: ["S1M="],
        sections: [{ updatedAt: "2026-08-18T00:00:00.000Z" }],
      });
    }),
  );

  it.effect("normalizes nested undefined values to JSON null", () =>
    Effect.gen(function* () {
      expect(
        yield* encodeHttpApiOperationResult({
          connection: undefined,
          nested: { domain: undefined },
          values: ["first", undefined],
        }),
      ).toEqual({
        connection: null,
        nested: { domain: null },
        values: ["first", null],
      });
    }),
  );

  it.effect("uses endpoint success codecs before JSON normalization", () =>
    Effect.gen(function* () {
      const encode = makeHttpApiOperationResultEncoder(TestApi);
      const result = yield* encode(
        {
          canonicalUrl: new URL("https://example.com/resources/one"),
          createdAt: new Date("2026-08-19T00:00:00.000Z"),
          description: undefined,
        },
        {
          method: "get",
          path: "/resources/{id}",
          operation: { operationId: "resources.getResource" },
        },
      );

      expect(result).toEqual({
        canonicalUrl: "https://example.com/resources/one",
        createdAt: "2026-08-19T00:00:00.000Z",
        description: null,
      });
    }),
  );

  it.effect("falls back to generic encoding without endpoint metadata", () =>
    Effect.gen(function* () {
      const encode = makeHttpApiOperationResultEncoder(TestApi);
      const result = yield* encode(
        { createdAt: new Date("2026-08-19T00:00:00.000Z") },
        {
          method: "get",
          path: "/unknown",
          operation: { operationId: "unknown.get" },
        },
      );

      expect(result).toEqual({
        createdAt: "2026-08-19T00:00:00.000Z",
      });
    }),
  );
});
