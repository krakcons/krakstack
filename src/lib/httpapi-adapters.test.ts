import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Schema, SchemaTransformation, Stream } from "effect";
import { Command } from "effect/cli";
import { HttpClient, HttpClientResponse, HttpRouter } from "effect/http";
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { TestConsole } from "effect/testing";

import { ApiClient } from "./httpapi-client";
import {
  makeHttpApiCliCommand,
  httpApiCliEnvironmentLayer,
} from "./httpapi-cli";
import { HttpApiSpec } from "./httpapi-helpers";
import { HttpApiMcp } from "./httpapi-mcp";
import { makeHttpApiToolkit } from "./httpapi-toolkit";

const UrlFromString = Schema.String.pipe(
  Schema.decodeTo(
    Schema.instanceOf(URL),
    SchemaTransformation.transform({
      decode: (value) => new URL(value),
      encode: (value) => value.toString(),
    }),
  ),
).annotate({ identifier: "AdapterUrlFromString" });

const api = HttpApi.make("test").add(
  HttpApiGroup.make("items").add(
    HttpApiEndpoint.post("create", "/items/:id", {
      params: Schema.Struct({ id: Schema.Number.check(Schema.isFinite()) }),
      query: Schema.Struct({
        days: Schema.optional(Schema.Number.check(Schema.isFinite())),
        active: Schema.optional(Schema.Boolean),
      }),
      headers: Schema.Struct({ "x-enabled": Schema.Boolean }),
      payload: Schema.Struct({
        at: Schema.DateFromString,
        url: UrlFromString,
        label: Schema.optional(Schema.String),
      }),
      success: Schema.Struct({ ok: Schema.Boolean }),
    }),
  ),
);

class TestTransportError extends Schema.TaggedError<TestTransportError>()(
  "TestTransportError",
  {
    cause: Schema.Defect(),
  },
) {}

const RpcResult = Schema.Struct({ result: Schema.JsonObject }).annotate({
  identifier: "AdapterRpcResult",
});

describe("shared HTTP API adapter inputs", () => {
  for (const adapter of ["cli", "toolkit", "mcp"] as const) {
    for (const variant of ["required", "optional", "invalid"] as const) {
      const optional = variant !== "required";
      const invalid = variant === "invalid";
      it.effect(
        `${adapter} handles the shared typed input contract (${variant})`,
        () => {
          const requests: Array<{
            path: string;
            query: string;
            enabled: string | undefined;
            body: string;
          }> = [];
          const http = HttpClient.make((request, url) => {
            requests.push({
              path: url.pathname,
              query: url.search,
              enabled: request.headers["x-enabled"],
              body:
                request.body._tag === "Uint8Array"
                  ? new TextDecoder().decode(request.body.body)
                  : "",
            });
            return Effect.succeed(
              HttpClientResponse.fromWeb(request, Response.json({ ok: true })),
            );
          });
          const query: Record<string, Schema.Json> = {};
          if (optional) {
            query.days = invalid ? "7" : 7;
            query.active = false;
          }
          const input = {
            params: { id: 12 },
            headers: { "x-enabled": true },
            query,
            body: {
              at: "2026-10-09T00:00:00.000Z",
              url: "https://example.com/item",
            },
          };
          const clientLayer = ApiClient.layer({
            api,
            baseUrl: "http://localhost",
          }).pipe(Layer.provide(Layer.succeed(HttpClient.HttpClient, http)));
          return Effect.gen(function* () {
            if (adapter === "cli") {
              const args = [
                "items",
                "create",
                "12",
                "--x-enabled",
                "true",
                "--at",
                input.body.at,
                "--url",
                input.body.url,
              ];
              if (optional)
                args.push("--days", invalid ? "invalid" : "7", "--no-active");
              const command = yield* makeHttpApiCliCommand();
              const result = yield* Effect.result(
                Command.runWith(command, { version: "1.0.0" })(args).pipe(
                  Effect.provide(httpApiCliEnvironmentLayer(args)),
                ),
              );
              expect(result._tag).toBe(invalid ? "Failure" : "Success");
            } else if (adapter === "toolkit") {
              const { toolkit: definition, handlers } =
                yield* makeHttpApiToolkit({ needsApproval: () => false });
              const toolkit = yield* definition.pipe(Effect.provide(handlers));
              const results = Array.from(
                yield* Stream.runCollect(
                  yield* toolkit.handle("items_create", input),
                ),
              );
              expect(results[0]?.isFailure).toBe(invalid);
              if (!invalid) expect(results[0]?.result).toEqual({ ok: true });
            } else {
              const web = yield* Effect.acquireRelease(
                Effect.sync(() =>
                  HttpRouter.toWebHandler(
                    HttpApiMcp.layerHttp({
                      api,
                      baseUrl: "http://localhost",
                      methods: ["post"],
                    }).pipe(
                      Layer.provide(Layer.succeed(HttpClient.HttpClient, http)),
                    ),
                    { disableLogger: true },
                  ),
                ),
                (web) => Effect.promise(web.dispose),
              );
              const post = (body: Schema.JsonObject, session?: string | null) =>
                Effect.tryPromise({
                  try: () => {
                    const headers = new Headers({
                      "Content-Type": "application/json",
                      Accept: "application/json, text/event-stream",
                      "MCP-Protocol-Version": "2025-11-25",
                    });
                    if (session) headers.set("Mcp-Session-Id", session);
                    return web.handler(
                      new Request("http://localhost/api/mcp", {
                        method: "POST",
                        headers,
                        body: JSON.stringify(body),
                      }),
                    );
                  },
                  catch: (cause) => new TestTransportError({ cause }),
                });
              const initialized = yield* post({
                jsonrpc: "2.0",
                id: 1,
                method: "initialize",
                params: {
                  protocolVersion: "2025-11-25",
                  capabilities: {},
                  clientInfo: { name: "test", version: "1.0" },
                },
              });
              expect(initialized.status).toBe(200);
              const response = yield* post(
                {
                  jsonrpc: "2.0",
                  id: 2,
                  method: "tools/call",
                  params: { name: "items_create", arguments: input },
                },
                initialized.headers.get("mcp-session-id"),
              );
              expect(response.status).toBe(200);
              const text = yield* Effect.tryPromise({
                try: () => response.text(),
                catch: (cause) => new TestTransportError({ cause }),
              });
              const decoded = yield* Schema.decodeUnknownEffect(
                Schema.fromJsonString(RpcResult),
              )(text);
              expect(decoded.result.isError).toBe(invalid);
              if (invalid)
                expect(decoded.result.content).toMatchObject([
                  {
                    type: "text",
                    text: expect.stringContaining("Invalid parameters"),
                  },
                ]);
              else
                expect(decoded.result.structuredContent).toEqual({ ok: true });
            }
            expect(requests).toHaveLength(invalid ? 0 : 1);
            if (!invalid)
              expect(requests[0]).toEqual({
                path: "/items/12",
                query: optional ? "?days=7&active=false" : "",
                enabled: "true",
                body: '{"at":"2026-10-09T00:00:00.000Z","url":"https://example.com/item"}',
              });
          }).pipe(
            Effect.provide(
              Layer.mergeAll(
                HttpApiSpec.layer({ api }),
                clientLayer,
                TestConsole.layer,
              ),
            ),
          );
        },
      );
    }
  }
});
