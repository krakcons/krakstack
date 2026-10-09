import { describe, expect, it } from "@effect/vitest";
import {
  Effect,
  Layer,
  JsonSchema,
  Schema,
  SchemaRepresentation,
} from "effect";
import { McpProtocol, McpServer } from "effect/ai";
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { HttpRouter } from "effect/http";

import { ApiClient, encodeHttpApiOperationResult } from "./httpapi-client";
import { HttpApiSpec } from "./httpapi-helpers";
import { HttpApiMcp } from "./httpapi-mcp";

describe("HTTP API MCP toolkit registration", () => {
  it.effect(
    "registers typed schemas, annotations and operation metadata",
    () => {
      const api = HttpApi.make("test").add(
        HttpApiGroup.make("workouts").add(
          HttpApiEndpoint.get("summary", "/summary", {
            query: Schema.Struct({
              days: Schema.optional(Schema.Number.check(Schema.isFinite())),
            }),
            success: Schema.Struct({ count: Schema.Number }),
          }),
        ),
      );
      return Effect.gen(function* () {
        const mcp = yield* HttpApiMcp;
        const server = yield* McpServer.McpServer;
        yield* mcp.registerTools;
        const tool = server.tools[0]?.tool;
        expect(tool?.name).toBe("workouts_summary");
        expect(tool?.annotations?.readOnlyHint).toBe(true);
        expect(tool?._meta).toEqual({
          "test/operation": { method: "GET", path: "/summary" },
        });
        if (!tool) return yield* Effect.die("Missing MCP tool");
        const schema = SchemaRepresentation.fromJsonSchemaDocument(
          JsonSchema.fromSchemaOpenApi3_1(tool.inputSchema),
        );
        expect(
          Schema.is(Schema.toEncoded(schema))({ query: { days: 7 } }),
        ).toBe(true);
        expect(
          Schema.is(Schema.toEncoded(schema))({ query: { days: "7" } }),
        ).toBe(false);
      }).pipe(
        Effect.provide(HttpApiMcp.layer({ toolMetaKey: "test/operation" })),
        Effect.provide(
          Layer.mergeAll(
            HttpApiSpec.layer({ api }),
            Layer.succeed(ApiClient, {
              execute: () => Effect.succeed({ count: 1 }),
              encodeResult: (result) => encodeHttpApiOperationResult(result),
            }),
            McpServer.layerHttp({
              name: "test",
              version: "1.0.0",
              path: "/mcp",
              protocols: [McpProtocol.v2025_11_25],
            }).pipe(Layer.provide(HttpRouter.layer)),
          ),
        ),
      );
    },
  );
});
