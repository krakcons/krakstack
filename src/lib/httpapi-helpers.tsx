import { Context, Effect, JsonSchema, Layer, Option, Schema } from "effect";
import type { Json } from "effect/Schema";
import { HttpApi, OpenApi } from "effect/http-api";

export const JsonObjectSchema = Schema.Record(
  Schema.String,
  Schema.Json,
).annotate({
  identifier: "HttpJsonObject",
  title: "HTTP JSON object",
  description: "A JSON object passed to an HTTP API operation.",
  examples: [{ id: "example-id" }],
});
const JsonObjectFromString = Schema.fromJsonString(JsonObjectSchema);
const JsonValueFromString = Schema.fromJsonString(Schema.Json);

export type JsonObject = typeof JsonObjectSchema.Type;
export type HttpApiDocument = ReturnType<typeof OpenApi.fromApi>;
export type HttpApiMethod = "get" | "post" | "put" | "patch" | "delete";
export const HttpApiMethods: ReadonlyArray<HttpApiMethod> = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
];
export type HttpApiParameter = {
  readonly name: string;
  readonly in: "path" | "query" | "header" | "cookie";
  readonly required?: boolean;
  readonly description?: string;
  readonly schema?: JsonSchema.JsonSchema;
};
export type HttpApiOperation = {
  readonly operationId?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly parameters?: ReadonlyArray<HttpApiParameter>;
  readonly requestBody?: {
    readonly required?: boolean;
    readonly content?: Record<
      string,
      { readonly schema?: JsonSchema.JsonSchema }
    >;
  };
  readonly tags?: ReadonlyArray<string>;
};
const HttpApiOperationSchema = Schema.declare(
  (value): value is HttpApiOperation => Schema.is(JsonObjectSchema)(value),
).annotate({ identifier: "HttpApiOperation" });
const decodeHttpApiOperation = Schema.decodeUnknownOption(
  HttpApiOperationSchema,
);

export type HttpApiOperationEntry = {
  readonly method: HttpApiMethod;
  readonly path: string;
  readonly operation: HttpApiOperation;
};
export type HttpApiOperationInputValue = ErrorOptions["cause"];
export type HttpApiOperationInputValues = Readonly<
  Record<string, HttpApiOperationInputValue>
>;
export type HttpApiOperationInput = {
  readonly body?: HttpApiOperationInputValue;
  readonly headers: HttpApiOperationInputValues;
  readonly params: HttpApiOperationInputValues;
  readonly query: HttpApiOperationInputValues;
};
export type HttpApiOperationDefinition = HttpApiOperationEntry & {
  readonly name: string;
  readonly inputSchema: Schema.Codec<Partial<HttpApiOperationInput>, Json>;
  readonly inputJsonSchema: JsonSchema.JsonSchema;
  readonly readOnly: boolean;
  readonly destructive: boolean;
  readonly idempotent: boolean;
};
export type HttpApiSpecConfig = {
  readonly api: HttpApi.Constraint;
  readonly methods?: ReadonlyArray<HttpApiMethod>;
  readonly include?: (operation: HttpApiOperationEntry) => boolean;
};

export const toHttpError = (message: string, error: ErrorOptions["cause"]) =>
  new Error(message, { cause: error });

export const sanitizeHttpName = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

export const httpApiToolName = (
  method: string,
  path: string,
  operation: HttpApiOperation,
) => {
  const fallback = `${method}_${path.replace(/^\/api\//, "").replace(/[/:{}]/g, "_")}`;
  return (operation.operationId || fallback)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 64);
};

export const httpApiOperations = ({
  spec,
  methods = HttpApiMethods,
}: {
  readonly spec: HttpApiDocument;
  readonly methods?: ReadonlyArray<HttpApiMethod>;
}): ReadonlyArray<HttpApiOperationEntry> => {
  const operations: Array<HttpApiOperationEntry> = [];
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of methods) {
      const operation = decodeHttpApiOperation(pathItem[method]);
      if (Option.isSome(operation))
        operations.push({ method, path, operation: operation.value });
    }
  }
  return operations;
};

const reflectedSchema = (schema: Schema.Top) =>
  Schema.make<Schema.Codec<unknown, unknown>>(schema.ast);

const reflectedOperationInputSchemas = (api: HttpApi.Top) => {
  const schemas = new Map<
    string,
    Schema.Codec<Partial<HttpApiOperationInput>, Json>
  >();
  HttpApi.reflect(api, {
    onGroup: () => undefined,
    onEndpoint: ({ endpoint, group }) => {
      const operationId = Context.getOrElse(
        endpoint.annotations,
        OpenApi.Identifier,
        () =>
          group.topLevel
            ? endpoint.identifier
            : `${group.identifier}.${endpoint.identifier}`,
      );
      const fields: Record<string, Schema.Codec<unknown, unknown>> = {};
      if (endpoint.params)
        fields.params = Schema.toType(reflectedSchema(endpoint.params));
      if (endpoint.query)
        fields.query = Schema.optionalKey(
          Schema.toType(reflectedSchema(endpoint.query)),
        );
      if (endpoint.headers)
        fields.headers = Schema.optionalKey(
          Schema.toType(reflectedSchema(endpoint.headers)),
        );
      const payloads = Array.from(endpoint.payload.values()).flatMap(
        ({ schemas }) => schemas.map(reflectedSchema),
      );
      if (payloads.length === 1 && payloads[0]) fields.body = payloads[0];
      else if (payloads.length > 1) fields.body = Schema.Union(payloads);
      const input =
        Object.keys(fields).length === 0
          ? Schema.Record(Schema.String, Schema.Never)
          : Schema.Struct(fields);
      schemas.set(
        operationId,
        Schema.make<Schema.Codec<Partial<HttpApiOperationInput>, Json>>(
          Schema.toCodecJson(input).ast,
        ).annotate({ identifier: `${sanitizeHttpName(operationId)}ToolInput` }),
      );
    },
  });
  return schemas;
};

export const parseJsonObject = Effect.fn("Http.parseJsonObject")(function* (
  value: string | undefined,
  label: string,
) {
  if (!value) return {};
  return yield* Schema.decodeUnknownEffect(JsonObjectFromString)(value).pipe(
    Effect.mapError(() => new Error(`${label} must be a JSON object`)),
  );
});

export const parseJsonValue = Effect.fn("Http.parseJsonValue")(function* (
  value: string | undefined,
  label: string,
) {
  if (!value) return undefined;
  return yield* Schema.decodeUnknownEffect(JsonValueFromString)(value).pipe(
    Effect.mapError(() => new Error(`${label} must be valid JSON`)),
  );
});

export class HttpApiSpec extends Context.Service<HttpApiSpec>()("HttpApiSpec", {
  make: (config: HttpApiSpecConfig) =>
    Effect.try({
      try: () => {
        const api = config.api;
        if (!HttpApi.isHttpApi(api))
          throw new Error("HttpApiSpec requires a valid HttpApi");
        const spec = OpenApi.fromApi(api);
        const schemas = reflectedOperationInputSchemas(api);
        const names = new Set<string>();
        const operations: ReadonlyArray<HttpApiOperationDefinition> =
          httpApiOperations({
            spec,
            methods: config.methods,
          })
            .filter((entry) => config.include?.(entry) ?? true)
            .map((entry) => {
              const name = httpApiToolName(
                entry.method,
                entry.path,
                entry.operation,
              );
              if (!name || names.has(name))
                throw new Error(
                  `Duplicate or empty HTTP API tool name: ${name}`,
                );
              names.add(name);
              const inputSchema = entry.operation.operationId
                ? schemas.get(entry.operation.operationId)
                : undefined;
              if (!inputSchema)
                throw new Error(
                  `Missing endpoint schema for ${entry.operation.operationId}`,
                );
              const document = Schema.toJsonSchemaDocument(
                inputSchema.annotate({ identifier: undefined }),
              );
              return {
                ...entry,
                name,
                inputSchema,
                inputJsonSchema: {
                  ...document.schema,
                  $defs: document.definitions,
                },
                readOnly: entry.method === "get",
                destructive: entry.method === "delete",
                idempotent:
                  entry.method === "get" ||
                  entry.method === "put" ||
                  entry.method === "delete",
              };
            });
        return { info: spec.info, operations };
      },
      catch: (error) => toHttpError("Failed to build HTTP API spec", error),
    }),
}) {
  static readonly layer = (config: HttpApiSpecConfig) =>
    Layer.effect(this, this.make(config));
}

export type HttpApiSpecService = typeof HttpApiSpec.Service;
