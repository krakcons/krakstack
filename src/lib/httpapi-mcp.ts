import { Context, Effect, Layer, Option, Schema } from "effect";
import { McpSchema, McpServer } from "effect/unstable/ai";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";
import { OpenApi } from "effect/unstable/httpapi";

type JsonSchema = Record<string, unknown>;
type HttpApiMethod = "get" | "post" | "put" | "patch" | "delete";
type HttpApiParameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: JsonSchema;
};
type HttpApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: ReadonlyArray<HttpApiParameter>;
  requestBody?: {
    content?: Record<string, { schema?: JsonSchema }>;
  };
};

const JsonObjectSchema = Schema.Record(Schema.String, Schema.Unknown).annotate({
  identifier: "HttpApiMcpJsonObject",
  title: "MCP JSON Object",
  description: "A JSON object passed to an MCP tool.",
  examples: [{ id: "example-id" }],
});
const JsonSchemaAnnotations = Schema.Struct({
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  examples: Schema.optional(Schema.Array(Schema.Unknown)),
}).annotate({
  identifier: "HttpApiMcpJsonSchemaAnnotations",
  title: "MCP JSON Schema Annotations",
  description: "JSON Schema annotations surfaced on MCP tool inputs.",
});
const JsonResponseFromString = Schema.fromJsonString(Schema.Unknown);

const ToolInputSchema = Schema.Struct({
  apiKey: Schema.optional(Schema.String),
  body: Schema.optional(Schema.Unknown),
}).annotate({
  identifier: "HttpApiMcpToolInput",
  title: "MCP Tool Input",
  description: "Input accepted by API-backed MCP tools.",
  examples: [{ apiKey: "example-key", body: { id: "example-id" } }],
});

type JsonObject = typeof JsonObjectSchema.Type;
type ToolInput = typeof ToolInputSchema.Type;
type OperationInput = ToolInput & {
  readonly params: JsonObject;
  readonly query: JsonObject;
};
export type HttpApiMcpConfig = {
  readonly api: Parameters<typeof OpenApi.fromApi>[0];
  readonly baseUrl: string;
  readonly serviceName?: string;
  readonly apiKeyEnv?: string;
  readonly apiKeyHeader?: string;
  readonly methods?: ReadonlyArray<HttpApiMethod>;
  readonly toolMetaKey?: string;
};

export class HttpApiMcp extends Context.Service<HttpApiMcp>()("HttpApiMcp", {
  make: (config: HttpApiMcpConfig) =>
    Effect.succeed({
      registerTools: registerHttpApiTools(config),
    }),
}) {
  static readonly layer = (config: HttpApiMcpConfig) =>
    Layer.effect(this, this.make(config));
}

const toError = (message: string, error: unknown) =>
  error instanceof Error ? error : new Error(`${message}: ${String(error)}`);

const sanitizeName = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 64);

const operationName = (
  method: string,
  path: string,
  operation: HttpApiOperation,
) =>
  sanitizeName(
    operation.operationId ??
      `${method}_${path.replace(/^\/api\//, "").replace(/[/:{}]/g, "_")}`,
  );

const decodeAnnotations = Schema.decodeUnknownOption(JsonSchemaAnnotations);

const schemaWithVisibleAnnotations = (schema: JsonSchema): JsonSchema => {
  const directAnnotations = decodeAnnotations(schema).pipe(
    Option.getOrElse(() => ({})),
  );
  const allOf = Array.isArray(schema.allOf) ? schema.allOf : [];
  const annotations = allOf.reduce(
    (acc, item) => ({
      ...acc,
      ...decodeAnnotations(item).pipe(Option.getOrElse(() => ({}))),
    }),
    directAnnotations,
  );

  return {
    ...schema,
    ...("title" in annotations && !("title" in schema)
      ? { title: annotations.title }
      : {}),
    ...("description" in annotations && !("description" in schema)
      ? { description: annotations.description }
      : {}),
    ...("examples" in annotations && !("examples" in schema)
      ? { examples: annotations.examples }
      : {}),
  };
};

const parameterInputSchema = (parameter: HttpApiParameter) => ({
  ...(parameter.schema
    ? schemaWithVisibleAnnotations(parameter.schema)
    : { type: "string" }),
  ...(parameter.description ? { description: parameter.description } : {}),
});

const operationParameters = (
  parameters: ReadonlyArray<HttpApiParameter>,
  location: HttpApiParameter["in"],
) => parameters.filter((parameter) => parameter.in === location);

const jsonBodySchema = (operation: HttpApiOperation) =>
  operation.requestBody?.content?.["application/json"]?.schema;

const inputSchema = (
  operation: HttpApiOperation,
  config: Pick<HttpApiMcpConfig, "apiKeyEnv" | "apiKeyHeader" | "serviceName">,
) => {
  const serviceName = config.serviceName ?? "API";
  const apiKeyHeader = config.apiKeyHeader ?? "x-api-key";
  const parameters = operation.parameters ?? [];
  const pathParameters = operationParameters(parameters, "path");
  const queryParameters = operationParameters(parameters, "query");
  const properties: Record<string, unknown> = {
    apiKey: {
      type: "string",
      description: `Optional API key sent to ${serviceName} as ${apiKeyHeader}.${config.apiKeyEnv ? ` If omitted, ${config.apiKeyEnv} is used when configured.` : ""}`,
    },
  };
  const required: Array<string> = [];
  const body = jsonBodySchema(operation);

  for (const parameter of [...pathParameters, ...queryParameters]) {
    properties[parameter.name] = parameterInputSchema(parameter);
    if (parameter.required) required.push(parameter.name);
  }
  if (body) properties.body = body;

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
};

const decodeToolInput = Effect.fn("HttpApiMcp.decodeToolInput")(function* (
  input: unknown,
  operation: HttpApiOperation,
) {
  const payload = yield* Schema.decodeUnknownEffect(JsonObjectSchema)(
    input ?? {},
  ).pipe(
    Effect.mapError(() => new Error("MCP tool input must be a JSON object")),
  );

  const decoded = yield* Schema.decodeUnknownEffect(ToolInputSchema)(
    payload,
  ).pipe(
    Effect.mapError(() => new Error("MCP tool input must be a JSON object")),
  );
  const parameters = operation.parameters ?? [];
  const pickParameters = (location: HttpApiParameter["in"]) => {
    const nestedKey = location === "path" ? "params" : location;
    const nested: JsonObject = decodeStructuredContent(payload[nestedKey]).pipe(
      Option.getOrElse((): JsonObject => ({})),
    );

    return Object.fromEntries(
      operationParameters(parameters, location)
        .map((parameter) => [
          parameter.name,
          nested[parameter.name] ?? payload[parameter.name],
        ])
        .filter(([, value]) => value !== undefined),
    );
  };

  return {
    ...decoded,
    params: pickParameters("path"),
    query: pickParameters("query"),
  };
});

const renderPath = Effect.fn("HttpApiMcp.renderPath")(function* (
  path: string,
  params: JsonObject = {},
) {
  return yield* Effect.try({
    try: () =>
      path.replace(/\{([^}]+)\}|:([A-Za-z0-9_]+)/g, (_, braced, colon) => {
        const key = braced || colon;
        const value = params[key];

        if (value === undefined || value === null) {
          throw new Error(`Missing path parameter: ${key}`);
        }

        return encodeURIComponent(String(value));
      }),
    catch: (error) => toError("Failed to render API path", error),
  });
});

const appendQuery = Effect.fn("HttpApiMcp.appendQuery")(function* (
  url: URL,
  query: JsonObject = {},
) {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
});

const buildUrl = Effect.fn("HttpApiMcp.buildUrl")(function* (
  path: string,
  input: OperationInput,
  baseUrl: string,
) {
  const renderedPath = yield* renderPath(path, input.params);
  const url = yield* Effect.try({
    try: () => new URL(renderedPath, baseUrl),
    catch: (error) => toError("Failed to build API URL", error),
  });

  yield* appendQuery(url, input.query);

  return url;
});

const decodeStructuredContent = Schema.decodeUnknownOption(JsonObjectSchema);

const structuredContent = (value: unknown): JsonObject =>
  decodeStructuredContent(value).pipe(
    Option.getOrElse(() => ({ result: value })),
  );

const toolResult = (value: unknown) =>
  new McpSchema.CallToolResult({
    isError: false,
    structuredContent: structuredContent(value),
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
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

const requestForMethod = (method: string, url: URL) => {
  switch (method.toUpperCase()) {
    case "DELETE":
      return HttpClientRequest.delete(url);
    case "PATCH":
      return HttpClientRequest.patch(url);
    case "POST":
      return HttpClientRequest.post(url);
    case "PUT":
      return HttpClientRequest.put(url);
    default:
      return HttpClientRequest.get(url);
  }
};

const fetchOperation = Effect.fn("HttpApiMcp.fetchOperation")(function* (
  method: string,
  url: URL,
  body: unknown,
  apiKey: string | undefined,
  config: Pick<HttpApiMcpConfig, "apiKeyHeader" | "serviceName">,
) {
  const http = yield* HttpClient.HttpClient;
  const apiKeyHeader = config.apiKeyHeader ?? "x-api-key";
  const serviceName = config.serviceName ?? "API";
  const hasBody = body !== undefined;

  let request = requestForMethod(method, url).pipe(
    HttpClientRequest.acceptJson,
    HttpClientRequest.setHeaders(apiKey ? { [apiKeyHeader]: apiKey } : {}),
  );

  if (hasBody) {
    request = yield* HttpClientRequest.bodyJson(request, body);
  }

  return yield* http.execute(request).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((response) => response.text),
    Effect.mapError((error) => toError(`Failed to call ${serviceName}`, error)),
  );
});

const parseResponseBody = Effect.fn("HttpApiMcp.parseResponseBody")(function* (
  text: string,
) {
  if (!text) return null;

  return yield* Schema.decodeUnknownEffect(JsonResponseFromString)(text).pipe(
    Effect.mapError((error) => toError("Failed to parse API response", error)),
  );
});

const executeOperation = Effect.fn("HttpApiMcp.executeOperation")(function* (
  method: string,
  path: string,
  operation: HttpApiOperation,
  input: unknown,
  config: HttpApiMcpConfig,
) {
  const payload = yield* decodeToolInput(input, operation);
  const apiKey = payload.apiKey ?? process.env[config.apiKeyEnv ?? ""];
  const url = yield* buildUrl(path, payload, config.baseUrl);
  const text = yield* fetchOperation(method, url, payload.body, apiKey, config);

  return yield* parseResponseBody(text);
});

const registerOperation = (
  method: string,
  path: string,
  operation: HttpApiOperation,
  config: HttpApiMcpConfig,
) =>
  Effect.gen(function* () {
    const server = yield* McpServer.McpServer;
    const name = operationName(method, path, operation);

    yield* server.addTool({
      tool: new McpSchema.Tool({
        name,
        title: operation.summary,
        description: operation.description ?? operation.summary,
        inputSchema: inputSchema(operation, config),
        annotations: {
          readOnlyHint: method.toUpperCase() === "GET",
          destructiveHint: method.toUpperCase() !== "GET",
          idempotentHint: method.toUpperCase() === "GET",
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
        executeOperation(method, path, operation, payload, config).pipe(
          Effect.provide(FetchHttpClient.layer),
          Effect.match({
            onFailure: toolError,
            onSuccess: toolResult,
          }),
        ),
    });
  });

const registerHttpApiTools = (config: HttpApiMcpConfig) =>
  Effect.gen(function* () {
    const spec = OpenApi.fromApi(config.api);

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const method of config.methods ?? ["get"]) {
        const operation = pathItem[method] as HttpApiOperation | undefined;
        if (!operation) continue;
        yield* registerOperation(method, path, operation, config);
      }
    }
  });

export const httpApiMcpToolsLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const mcp = yield* HttpApiMcp;
    yield* mcp.registerTools;
  }),
);
