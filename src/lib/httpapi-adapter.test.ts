import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Schema, SchemaTransformation } from "effect";
import { HttpClient, HttpClientResponse } from "effect/http";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/http-api";

import {
  encodeHttpApiOperationResult,
  HttpApiAdapter,
} from "./httpapi-adapter";

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
      const adapter = yield* HttpApiAdapter;
      const operation = adapter.operations[0];
      if (!operation) return yield* Effect.die("Missing resource operation");
      const result = yield* adapter.encodeResult(
        {
          canonicalUrl: new URL("https://example.com/resources/one"),
          createdAt: new Date("2026-08-19T00:00:00.000Z"),
          description: undefined,
        },
        operation,
      );

      expect(result).toEqual({
        canonicalUrl: "https://example.com/resources/one",
        createdAt: "2026-08-19T00:00:00.000Z",
        description: null,
      });
    }).pipe(
      Effect.provide(
        HttpApiAdapter.layer({
          api: TestApi,
          baseUrl: "http://localhost",
        }).pipe(
          Layer.provide(
            Layer.succeed(
              HttpClient.HttpClient,
              HttpClient.make(() => Effect.die("HTTP not used")),
            ),
          ),
        ),
      ),
    ),
  );

  it.effect(
    "rejects results that do not match the endpoint success codec",
    () =>
      Effect.gen(function* () {
        const adapter = yield* HttpApiAdapter;
        const operation = adapter.operations[0];
        if (!operation) return yield* Effect.die("Missing resource operation");
        const error = yield* adapter
          .encodeResult({ canonicalUrl: 42 }, operation)
          .pipe(Effect.flip);
        expect(error.message).toBe(
          "HTTP API result does not match its success schema",
        );
      }).pipe(
        Effect.provide(
          HttpApiAdapter.layer({
            api: TestApi,
            baseUrl: "http://localhost",
          }).pipe(
            Layer.provide(
              Layer.succeed(
                HttpClient.HttpClient,
                HttpClient.make(() => Effect.die("HTTP not used")),
              ),
            ),
          ),
        ),
      ),
  );
});

describe("HttpApiAdapter", () => {
  for (const topLevel of [false, true]) {
    it.effect(
      `dispatches original identifiers with a custom OpenAPI name (topLevel=${topLevel})`,
      () => {
        const api = HttpApi.make("identity").add(
          HttpApiGroup.make("originalGroup", { topLevel }).add(
            HttpApiEndpoint.get("originalEndpoint", "/identity", {
              success: Schema.Struct({ ok: Schema.Boolean }),
            }).annotate(OpenApi.Identifier, "public.customName"),
          ),
        );
        const paths: Array<string> = [];
        const http = HttpClient.make((request, url) => {
          paths.push(url.pathname);
          return Effect.succeed(
            HttpClientResponse.fromWeb(request, Response.json({ ok: true })),
          );
        });
        return Effect.gen(function* () {
          const adapter = yield* HttpApiAdapter;
          const operation = adapter.operations[0];
          if (!operation) return yield* Effect.die("Missing custom operation");
          expect(operation.groupIdentifier).toBe("originalGroup");
          expect(operation.endpointIdentifier).toBe("originalEndpoint");
          expect(operation.operation.operationId).toBe("public.customName");
          const result = yield* adapter.execute({ operation, input: {} });
          expect(yield* adapter.encodeResult(result, operation)).toEqual({
            ok: true,
          });
          expect(paths).toEqual(["/identity"]);
        }).pipe(
          Effect.provide(
            HttpApiAdapter.layer({ api, baseUrl: "http://localhost" }).pipe(
              Layer.provide(Layer.succeed(HttpClient.HttpClient, http)),
            ),
          ),
        );
      },
    );
  }

  it.effect(
    "applies method and include filters to the shared catalogue",
    () => {
      const api = HttpApi.make("filtered").add(
        HttpApiGroup.make("items")
          .add(HttpApiEndpoint.get("list", "/items", { success: Schema.Json }))
          .add(
            HttpApiEndpoint.get("private", "/private", {
              success: Schema.Json,
            }),
          )
          .add(
            HttpApiEndpoint.post("create", "/items", { success: Schema.Json }),
          ),
      );
      return Effect.gen(function* () {
        const adapter = yield* HttpApiAdapter;
        expect(
          adapter.operations.map(({ operation }) => operation.operationId),
        ).toEqual(["items.list"]);
        const selected = adapter.operations[0];
        if (!selected) return yield* Effect.die("Missing list operation");
        const error = yield* adapter
          .execute({ operation: { ...selected, path: "/private" }, input: {} })
          .pipe(Effect.flip);
        expect(error.message).toContain(
          "not in this HTTP API adapter catalogue",
        );
      }).pipe(
        Effect.provide(
          HttpApiAdapter.layer({
            api,
            baseUrl: "http://localhost",
            methods: ["get"],
            include: ({ path }) => path !== "/private",
          }).pipe(
            Layer.provide(
              Layer.succeed(
                HttpClient.HttpClient,
                HttpClient.make(() =>
                  Effect.die("Filtered operation must not execute"),
                ),
              ),
            ),
          ),
        ),
      );
    },
  );
});
