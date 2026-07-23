import {
  Context,
  Effect,
  JsonSchema,
  Layer,
  Option,
  Schema,
  SchemaRepresentation,
} from "effect";
import { HttpApi, OpenApi } from "effect/unstable/httpapi";

export const JsonObjectSchema = Schema.Record(
  Schema.String,
  Schema.Unknown,
).annotate({
  identifier: "HttpJsonObject",
  title: "HTTP JSON object",
  description: "A JSON object passed to an HTTP API operation.",
  examples: [{ id: "example-id" }],
});
const JsonObjectFromString = Schema.fromJsonString(JsonObjectSchema);
const JsonValueFromString = Schema.fromJsonString(Schema.Unknown);
const JsonSchemaAnnotations = Schema.Struct({
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  examples: Schema.optional(Schema.Array(Schema.Unknown)),
}).annotate({
  identifier: "HttpJsonSchemaAnnotations",
  title: "HTTP JSON Schema annotations",
  description: "JSON Schema annotations surfaced on generated tool inputs.",
});
const HttpApiToolInputSchema = Schema.Struct({
  body: Schema.optional(Schema.Unknown),
}).annotate({
  identifier: "HttpApiToolInput",
  title: "HTTP API tool input",
  description: "Input accepted by an HTTP API-backed tool.",
  examples: [{ body: { id: "example-id" } }],
});

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
export type HttpApiOperationEntry = {
  readonly method: HttpApiMethod;
  readonly path: string;
  readonly operation: HttpApiOperation;
};
export type HttpApiOperationInput = {
  readonly body?: unknown;
  readonly headers: JsonObject;
  readonly params: JsonObject;
  readonly query: JsonObject;
};
export type HttpApiSpecConfig = {
  readonly api: HttpApi.Constraint;
  readonly methods?: ReadonlyArray<HttpApiMethod>;
  readonly include?: (operation: HttpApiOperationEntry) => boolean;
};

export const toHttpError = (message: string, error: unknown) =>
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
      const operation = pathItem[method] as HttpApiOperation | undefined;
      if (operation) operations.push({ method, path, operation });
    }
  }

  return operations;
};

export const httpApiToolEntries = Effect.fn("Http.toolEntries")(function* (
  operations: ReadonlyArray<HttpApiOperationEntry>,
) {
  return yield* Effect.try({
    try: () => {
      const names = new Set<string>();

      return operations.map((entry) => {
        const name = httpApiToolName(entry.method, entry.path, entry.operation);
        if (!name || names.has(name)) {
          throw new Error(`Duplicate or empty HTTP API tool name: ${name}`);
        }
        names.add(name);

        return { ...entry, name };
      });
    },
    catch: (error) =>
      error instanceof Error ? error : new Error(String(error)),
  });
});

const decodeAnnotations = Schema.decodeUnknownOption(JsonSchemaAnnotations);

const schemaWithVisibleAnnotations = (
  schema: JsonSchema.JsonSchema,
): JsonSchema.JsonSchema => {
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

const operationParameters = (
  parameters: ReadonlyArray<HttpApiParameter>,
  location: HttpApiParameter["in"],
) => parameters.filter((parameter) => parameter.in === location);

export const httpApiOperationInputSchema = (
  operation: HttpApiOperation,
): JsonSchema.JsonSchema => {
  const parameters = operation.parameters ?? [];
  const pathParameters = operationParameters(parameters, "path");
  const queryParameters = operationParameters(parameters, "query");
  const headerParameters = operationParameters(parameters, "header");
  const properties: Record<string, unknown> = {};
  const required: Array<string> = [];
  const body = operation.requestBody?.content?.["application/json"]?.schema;

  for (const parameter of [
    ...pathParameters,
    ...queryParameters,
    ...headerParameters,
  ]) {
    properties[parameter.name] = {
      ...(parameter.schema
        ? schemaWithVisibleAnnotations(parameter.schema)
        : { type: "string" }),
      ...(parameter.description ? { description: parameter.description } : {}),
    };
    if (parameter.required) required.push(parameter.name);
  }
  if (body) {
    properties.body = body;
    if (operation.requestBody?.required) required.push("body");
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
};

const decodeJsonObject = Schema.decodeUnknownOption(JsonObjectSchema);

export const decodeHttpApiOperationInput = Effect.fn(
  "Http.decodeApiOperationInput",
)(function* (input: unknown, operation: HttpApiOperation) {
  const payload = yield* Schema.decodeUnknownEffect(JsonObjectSchema)(
    input ?? {},
  ).pipe(Effect.mapError(() => new Error("Tool input must be a JSON object")));
  const decoded = yield* Schema.decodeUnknownEffect(HttpApiToolInputSchema)(
    payload,
  ).pipe(Effect.mapError(() => new Error("Tool input must be a JSON object")));
  const parameters = operation.parameters ?? [];
  const pickParameters = (location: HttpApiParameter["in"]) => {
    const nestedKey = location === "path" ? "params" : location;
    const nested = decodeJsonObject(payload[nestedKey]).pipe(
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
    headers: pickParameters("header"),
    params: pickParameters("path"),
    query: pickParameters("query"),
  };
});

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
        if (!HttpApi.isHttpApi(config.api)) {
          throw new Error("HttpApiSpec requires a valid HttpApi");
        }

        const spec = OpenApi.fromApi(config.api);
        const operations = httpApiOperations({
          spec,
          methods: config.methods,
        }).filter((operation) => config.include?.(operation) ?? true);
        const operationJsonSchema = (operation: HttpApiOperation) => {
          const schema = httpApiOperationInputSchema(operation);
          const document = JsonSchema.fromSchemaOpenApi3_1({
            ...schema,
            $defs: spec.components?.schemas,
          });

          return {
            ...document.schema,
            $defs: document.definitions,
          } satisfies JsonSchema.JsonSchema;
        };

        return {
          info: spec.info,
          operations,
          decodeOperationInput: decodeHttpApiOperationInput,
          operationJsonSchema,
          operationSchema: (operation: HttpApiOperation) => {
            const document = JsonSchema.fromSchemaOpenApi3_1(
              operationJsonSchema(operation),
            );

            return SchemaRepresentation.toSchema(
              SchemaRepresentation.fromJsonSchemaDocument(document),
            );
          },
        };
      },
      catch: (error) => toHttpError("Failed to build HTTP API spec", error),
    }),
}) {
  static readonly layer = (config: HttpApiSpecConfig) =>
    Layer.effect(this, this.make(config));
}

export type HttpApiSpecService = typeof HttpApiSpec.Service;
