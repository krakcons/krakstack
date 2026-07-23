import { Context, Effect, Layer, Option, Schema } from "effect";
import { McpSchema, McpServer } from "effect/unstable/ai";

import { ApiClient, type ApiClientService } from "@/lib/httpapi-client";
import {
  HttpApiSpec,
  httpApiToolEntries,
  JsonObjectSchema,
  type HttpApiMethod,
  type HttpApiOperation,
  type HttpApiSpecService,
  type JsonObject,
} from "@/lib/httpapi-helpers";

export type HttpApiMcpConfig = {
  readonly toolMetaKey?: string;
};

export class HttpApiMcp extends Context.Service<HttpApiMcp>()("HttpApiMcp", {
  make: (config: HttpApiMcpConfig) =>
    Effect.gen(function* () {
      const spec = yield* HttpApiSpec;
      const client = yield* ApiClient;

      return {
        registerTools: registerHttpApiTools(spec, client, config),
      };
    }),
}) {
  static readonly layer = (config: HttpApiMcpConfig) =>
    Layer.effect(this, this.make(config));
}

const decodeStructuredContent = Schema.decodeUnknownOption(JsonObjectSchema);

const structuredContent = (value: unknown): JsonObject =>
  decodeStructuredContent(value).pipe(
    Option.getOrElse(() => ({ result: value ?? null })),
  );

const toolResult = (value: unknown) =>
  new McpSchema.CallToolResult({
    isError: false,
    structuredContent: structuredContent(value),
    content: [{ type: "text", text: JSON.stringify(value, null, 2) ?? "null" }],
  });

const toolError = (error: unknown) =>
  new McpSchema.CallToolResult({
    isError: true,
    content: [
      {
        type: "text",
        text: error instanceof Error ? error.message : String(error),
      },
    ],
  });

const executeOperation = Effect.fn("HttpApiMcp.executeOperation")(function* (
  method: HttpApiMethod,
  path: string,
  operation: HttpApiOperation,
  input: unknown,
  spec: HttpApiSpecService,
  client: ApiClientService,
) {
  const payload = yield* spec.decodeOperationInput(input, operation);

  return yield* client.execute({
    operation: { method, path, operation },
    input: {
      body: payload.body,
      headers: payload.headers,
      params: payload.params,
      query: payload.query,
    },
  });
});

const registerOperation = (
  method: HttpApiMethod,
  path: string,
  operation: HttpApiOperation,
  name: string,
  config: HttpApiMcpConfig,
  spec: HttpApiSpecService,
  client: ApiClientService,
) =>
  Effect.gen(function* () {
    const server = yield* McpServer.McpServer;
    yield* server.addTool({
      tool: new McpSchema.Tool({
        name,
        title: operation.summary,
        description: operation.description ?? operation.summary,
        inputSchema: spec.operationJsonSchema(operation),
        annotations: {
          readOnlyHint: method.toUpperCase() === "GET",
          destructiveHint: method === "delete",
          idempotentHint:
            method === "get" || method === "put" || method === "delete",
          openWorldHint: false,
        },
        _meta: {
          [config.toolMetaKey ?? "api/operation"]: {
            method: method.toUpperCase(),
            path,
          },
        },
      }),
      annotations: Context.empty(),
      handle: (payload) =>
        executeOperation(method, path, operation, payload, spec, client).pipe(
          Effect.match({
            onFailure: toolError,
            onSuccess: toolResult,
          }),
        ),
    });
  });

const registerHttpApiTools = (
  spec: HttpApiSpecService,
  client: ApiClientService,
  config: HttpApiMcpConfig,
) =>
  Effect.gen(function* () {
    const entries = yield* httpApiToolEntries(spec.operations);

    for (const { method, name, operation, path } of entries) {
      yield* registerOperation(
        method,
        path,
        operation,
        name,
        config,
        spec,
        client,
      );
    }
  });

export const httpApiMcpToolsLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const mcp = yield* HttpApiMcp;
    yield* mcp.registerTools;
  }),
);
