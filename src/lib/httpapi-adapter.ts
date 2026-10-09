/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unsafe-dictionary-type -- Runtime endpoint codecs validate heterogeneous values at this dynamic adapter boundary. */
import {
  Context,
  Effect,
  JsonSchema,
  Layer,
  Option,
  Schema,
  SchemaTransformation,
} from "effect";
import type { Json } from "effect/Schema";
import { HttpClient } from "effect/http";
import { HttpApi, HttpApiClient, HttpApiGroup, OpenApi } from "effect/http-api";

export type HttpApiMethod = "get" | "post" | "put" | "patch" | "delete";
const HttpApiMethods: ReadonlyArray<HttpApiMethod> = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
];

const HttpApiOperation = Schema.Struct({
  operationId: Schema.optional(Schema.String),
  summary: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  tags: Schema.optional(Schema.Array(Schema.String)),
  parameters: Schema.optional(
    Schema.Array(
      Schema.Struct({
        name: Schema.String,
        in: Schema.Literals(["path", "query", "header", "cookie"]),
        required: Schema.optional(Schema.Boolean),
        description: Schema.optional(Schema.String),
        schema: Schema.optional(Schema.Json),
      }),
    ),
  ),
  requestBody: Schema.optional(
    Schema.Struct({
      required: Schema.optional(Schema.Boolean),
      content: Schema.optional(
        Schema.Record(
          Schema.String,
          Schema.Struct({
            schema: Schema.optional(Schema.Json),
          }),
        ),
      ),
    }),
  ),
}).annotate({ identifier: "HttpApiOperation" });
export type HttpApiOperation = typeof HttpApiOperation.Type;

export type HttpApiOperationEntry = {
  readonly method: HttpApiMethod;
  readonly path: string;
  readonly operation: HttpApiOperation;
};
export type HttpApiOperationInputValues = Readonly<Record<string, unknown>>;
export type HttpApiOperationInput = {
  readonly body?: unknown;
  readonly headers: HttpApiOperationInputValues;
  readonly params: HttpApiOperationInputValues;
  readonly query: HttpApiOperationInputValues;
};
export type HttpApiOperationDefinition = HttpApiOperationEntry & {
  readonly name: string;
  readonly groupIdentifier: string;
  readonly endpointIdentifier: string;
  readonly topLevel: boolean;
  readonly inputSchema: Schema.Codec<Partial<HttpApiOperationInput>, Json>;
  readonly inputJsonSchema: JsonSchema.JsonSchema;
  readonly successSchema?: Schema.Codec<unknown, unknown>;
  readonly readOnly: boolean;
  readonly destructive: boolean;
  readonly idempotent: boolean;
};

export type HttpApiAdapterConfig<
  Id extends string,
  Groups extends HttpApiGroup.Constraint,
> = {
  readonly api: HttpApi.HttpApi<Id, Groups>;
  readonly baseUrl: string;
  readonly methods?: ReadonlyArray<HttpApiMethod>;
  readonly include?: (operation: HttpApiOperationEntry) => boolean;
  readonly encodeResult?: (
    result: unknown,
    operation: HttpApiOperationDefinition,
  ) => Effect.Effect<Json, Error>;
};
export type HttpApiAdapterExecuteOptions = {
  readonly operation: HttpApiOperationDefinition;
  readonly input: Partial<HttpApiOperationInput>;
};
export type HttpApiAdapterService = {
  readonly info: ReturnType<typeof OpenApi.fromApi>["info"];
  readonly operations: ReadonlyArray<HttpApiOperationDefinition>;
  readonly execute: (
    options: HttpApiAdapterExecuteOptions,
  ) => Effect.Effect<unknown, Error>;
  readonly encodeResult: (
    result: unknown,
    operation: HttpApiOperationDefinition,
  ) => Effect.Effect<Json, Error>;
};

type HttpApiOperationResultValue =
  | null
  | undefined
  | string
  | number
  | boolean
  | Date
  | Uint8Array
  | ReadonlyArray<HttpApiOperationResultValue>
  | { readonly [key: string]: HttpApiOperationResultValue };
const UndefinedFromNull = Schema.Null.pipe(
  Schema.decodeTo(
    Schema.Undefined,
    SchemaTransformation.transform({
      decode: () => undefined,
      encode: () => null,
    }),
  ),
);
const HttpApiOperationResultValue: Schema.Codec<
  HttpApiOperationResultValue,
  Json
> = Schema.suspend(() =>
  Schema.Union([
    Schema.Null,
    UndefinedFromNull,
    Schema.String,
    Schema.Number,
    Schema.Boolean,
    Schema.DateFromString,
    Schema.Uint8ArrayFromBase64,
    Schema.Array(HttpApiOperationResultValue),
    Schema.Record(Schema.String, HttpApiOperationResultValue),
  ]),
);
const HttpApiOperationResult = Schema.Union([
  HttpApiOperationResultValue,
  Schema.Undefined,
]).annotate({ identifier: "HttpApiOperationResult" });

export const encodeHttpApiOperationResult = Effect.fn(
  "HttpApiAdapter.encodeOperationResult",
)((result: unknown) =>
  Schema.encodeUnknownEffect(HttpApiOperationResult)(result).pipe(
    Effect.map((encoded) => encoded ?? null),
    Effect.mapError(
      (cause) => new Error("HTTP API result is not serializable", { cause }),
    ),
  ),
);

const encodeOperationResult = Effect.fn("HttpApiAdapter.encodeResult")(
  (result: unknown, operation: HttpApiOperationDefinition) =>
    operation.successSchema
      ? Schema.encodeUnknownEffect(operation.successSchema)(result).pipe(
          Effect.flatMap(encodeHttpApiOperationResult),
          Effect.mapError(
            (cause) =>
              new Error("HTTP API result does not match its success schema", {
                cause,
              }),
          ),
        )
      : encodeHttpApiOperationResult(result),
);

const reflectedSchema = (schema: Schema.Top) =>
  Schema.make<Schema.Codec<unknown, unknown>>(schema.ast);
const sanitizeHttpName = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
const httpApiToolName = (entry: HttpApiOperationEntry) =>
  (
    entry.operation.operationId ||
    `${entry.method}_${entry.path.replace(/^\/api\//, "").replace(/[/:{}]/g, "_")}`
  )
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 64);

type ReflectedOperation = Pick<
  HttpApiOperationDefinition,
  | "groupIdentifier"
  | "endpointIdentifier"
  | "topLevel"
  | "inputSchema"
  | "successSchema"
>;

const makeCatalogue = (
  api: HttpApi.Constraint,
  methods: ReadonlyArray<HttpApiMethod>,
  include?: (operation: HttpApiOperationEntry) => boolean,
) =>
  Effect.try({
    try: () => {
      if (!HttpApi.isHttpApi(api))
        throw new Error("HttpApiAdapter requires a valid HttpApi");
      const spec = OpenApi.fromApi(api);
      const reflected = new Map<string, ReflectedOperation>();
      HttpApi.reflect(api, {
        onGroup: () => undefined,
        onEndpoint: ({ endpoint, group, successes }) => {
          const operationId = Context.getOrElse(
            endpoint.annotations,
            OpenApi.Identifier,
            () =>
              group.topLevel
                ? endpoint.identifier
                : `${group.identifier}.${endpoint.identifier}`,
          );
          if (reflected.has(operationId))
            throw new Error(`Duplicate HTTP API operation ID: ${operationId}`);
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
          const inputSchema = Schema.make<
            Schema.Codec<Partial<HttpApiOperationInput>, Json>
          >(Schema.toCodecJson(input).ast).annotate({
            identifier: `${sanitizeHttpName(operationId)}ToolInput`,
          });
          const successSchemas = Array.from(successes.values())
            .flat()
            .map(reflectedSchema);
          reflected.set(operationId, {
            groupIdentifier: group.identifier,
            endpointIdentifier: endpoint.identifier,
            topLevel: group.topLevel,
            inputSchema,
            successSchema:
              successSchemas.length === 1
                ? successSchemas[0]
                : successSchemas.length > 1
                  ? Schema.Union(successSchemas)
                  : undefined,
          });
        },
      });
      const names = new Set<string>();
      const operations: Array<HttpApiOperationDefinition> = [];
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        for (const method of methods) {
          const decoded = Schema.decodeUnknownOption(HttpApiOperation)(
            pathItem[method],
          );
          if (Option.isNone(decoded)) continue;
          const entry = { method, path, operation: decoded.value };
          if (include && !include(entry)) continue;
          const metadata = entry.operation.operationId
            ? reflected.get(entry.operation.operationId)
            : undefined;
          if (!metadata)
            throw new Error(
              `Missing endpoint schema for ${entry.operation.operationId}`,
            );
          const name = httpApiToolName(entry);
          if (!name || names.has(name))
            throw new Error(`Duplicate or empty HTTP API tool name: ${name}`);
          names.add(name);
          const document = Schema.toJsonSchemaDocument(
            metadata.inputSchema.annotate({ identifier: undefined }),
          );
          operations.push({
            ...entry,
            ...metadata,
            name,
            inputJsonSchema: {
              ...document.schema,
              $defs: document.definitions,
            },
            readOnly: method === "get",
            destructive: method === "delete",
            idempotent:
              method === "get" || method === "put" || method === "delete",
          });
        }
      }
      return { info: spec.info, operations };
    },
    catch: (cause) =>
      new Error("Failed to build HTTP API adapter catalogue", { cause }),
  });

type GeneratedOperation = (input: {
  readonly headers: HttpApiOperationInput["headers"];
  readonly params: HttpApiOperationInput["params"];
  readonly payload: HttpApiOperationInput["body"];
  readonly query: HttpApiOperationInput["query"];
}) => Effect.Effect<unknown, Error>;
const GeneratedOperation = Schema.declare(
  (value): value is GeneratedOperation => value instanceof Function,
).annotate({ identifier: "GeneratedOperation" });
const GeneratedOperationEffect = Schema.declare(
  (value): value is Effect.Effect<unknown, Error> => Effect.isEffect(value),
).annotate({ identifier: "GeneratedOperationEffect" });

const executeGeneratedOperation = Effect.fn(
  "HttpApiAdapter.executeGeneratedOperation",
)(function* <Client>(
  client: Client,
  { operation, input }: HttpApiAdapterExecuteOptions,
) {
  const group = operation.topLevel
    ? client
    : Object.entries(Object(client)).find(
        ([name]) => name === operation.groupIdentifier,
      )?.[1];
  const candidate = Object.entries(Object(group)).find(
    ([name]) => name === operation.endpointIdentifier,
  )?.[1];
  const endpoint = Schema.decodeUnknownOption(GeneratedOperation)(candidate);
  if (Option.isNone(endpoint))
    return yield* Effect.fail(
      new Error(
        `No generated API client operation for ${operation.operation.operationId}`,
      ),
    );
  const result = Schema.decodeUnknownOption(GeneratedOperationEffect)(
    endpoint.value({
      headers: input.headers ?? {},
      params: input.params ?? {},
      query: input.query ?? {},
      payload: input.body,
    }),
  );
  if (Option.isNone(result))
    return yield* Effect.fail(
      new Error(
        `Generated API client operation ${operation.operation.operationId} is invalid`,
      ),
    );
  return yield* result.value;
});

export class HttpApiAdapter extends Context.Service<
  HttpApiAdapter,
  HttpApiAdapterService
>()("@krak-stack/registry/HttpApiAdapter") {
  static readonly make = Effect.fn("HttpApiAdapter.make")(function* <
    Id extends string,
    Groups extends HttpApiGroup.Constraint,
  >(config: HttpApiAdapterConfig<Id, Groups>) {
    const catalogue = yield* makeCatalogue(
      config.api,
      config.methods ?? HttpApiMethods,
      config.include,
    );
    const httpClient = yield* HttpClient.HttpClient;
    const client = yield* HttpApiClient.makeWith(config.api, {
      baseUrl: config.baseUrl,
      httpClient,
    });
    return HttpApiAdapter.of({
      ...catalogue,
      encodeResult: config.encodeResult ?? encodeOperationResult,
      execute: Effect.fn("HttpApiAdapter.execute")(function* (
        options: HttpApiAdapterExecuteOptions,
      ) {
        const operation = catalogue.operations.find(
          (entry) =>
            entry.method === options.operation.method &&
            entry.path === options.operation.path &&
            entry.operation.operationId ===
              options.operation.operation.operationId,
        );
        if (!operation) {
          return yield* Effect.fail(
            new Error("Operation is not in this HTTP API adapter catalogue"),
          );
        }
        return yield* executeGeneratedOperation(client, {
          operation,
          input: options.input,
        });
      }),
    });
  });

  static readonly layer = <
    Id extends string,
    Groups extends HttpApiGroup.Constraint,
  >(
    config: HttpApiAdapterConfig<Id, Groups>,
  ) => Layer.effect(this, this.make(config));
}
