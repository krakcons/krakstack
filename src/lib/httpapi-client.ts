import { Context, Effect, Layer, Schema, SchemaTransformation } from "effect";
import { HttpClient } from "effect/unstable/http";
import {
  HttpApi,
  HttpApiClient as EffectHttpApiClient,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";
import type {
  HttpApiOperationEntry,
  HttpApiOperationInput,
} from "@/lib/httpapi-helpers";
import type { Json } from "effect/Schema";

export type ApiClientConfig<
  Id extends string,
  Groups extends HttpApiGroup.Constraint,
> = {
  readonly api: HttpApi.HttpApi<Id, Groups>;
  readonly baseUrl: string;
  readonly encodeResult?: (
    result: ErrorOptions["cause"],
    operation: HttpApiOperationEntry,
  ) => Effect.Effect<Json, Error>;
};

export type ApiClientExecuteOptions = {
  readonly operation: HttpApiOperationEntry;
  readonly input: HttpApiOperationInput;
};

export type HttpApiOperationResultValue =
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

export const HttpApiOperationResult = Schema.Union([
  HttpApiOperationResultValue,
  Schema.Undefined,
]).annotate({ identifier: "HttpApiOperationResult" });
export type HttpApiOperationResult = typeof HttpApiOperationResult.Type;

export const encodeHttpApiOperationResult = Effect.fn(
  "HttpApiClient.encodeOperationResult",
)((result: ErrorOptions["cause"]) =>
  Schema.encodeUnknownEffect(HttpApiOperationResult)(result).pipe(
    Effect.map((encoded) => encoded ?? null),
    Effect.mapError(
      (cause) => new Error("HTTP API result is not serializable", { cause }),
    ),
  ),
);

const reflectedSchema = (schema: Schema.Top) =>
  Schema.make<Schema.Codec<unknown, unknown>>(schema.ast);

const operationResultSchemas = <
  Id extends string,
  Groups extends HttpApiGroup.Constraint,
>(
  api: HttpApi.HttpApi<Id, Groups>,
) => {
  const schemas = new Map<string, Schema.Codec<unknown, unknown>>();

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
      const operationSchemas = Array.from(successes.values())
        .flat()
        .map(reflectedSchema);
      if (operationSchemas.length === 1 && operationSchemas[0]) {
        schemas.set(operationId, operationSchemas[0]);
      } else if (operationSchemas.length > 1) {
        schemas.set(operationId, Schema.Union(operationSchemas));
      }
    },
  });

  return schemas;
};

export const makeHttpApiOperationResultEncoder = <
  Id extends string,
  Groups extends HttpApiGroup.Constraint,
>(
  api: HttpApi.HttpApi<Id, Groups>,
) => {
  const schemas = operationResultSchemas(api);

  return Effect.fn("HttpApiClient.encodeOperationResultWithSchema")(
    (result: ErrorOptions["cause"], operation: HttpApiOperationEntry) => {
      const operationId = operation.operation.operationId;
      const schema = operationId ? schemas.get(operationId) : undefined;
      if (!schema) return encodeHttpApiOperationResult(result);

      return Schema.encodeUnknownEffect(schema)(result).pipe(
        Effect.flatMap(encodeHttpApiOperationResult),
        Effect.mapError(
          (cause) =>
            new Error("HTTP API result does not match its success schema", {
              cause,
            }),
        ),
      );
    },
  );
};

type GeneratedOperation = (input: {
  readonly headers: HttpApiOperationInput["headers"];
  readonly params: HttpApiOperationInput["params"];
  readonly payload: HttpApiOperationInput["body"];
  readonly query: HttpApiOperationInput["query"];
}) => Effect.Effect<ErrorOptions["cause"], Error>;

const GeneratedOperation = Schema.declare(
  (value): value is GeneratedOperation => value instanceof Function,
).annotate({ identifier: "GeneratedOperation" });

const GeneratedOperationEffect = Schema.declare(
  (value): value is Effect.Effect<ErrorOptions["cause"], Error> =>
    Effect.isEffect(value),
).annotate({ identifier: "GeneratedOperationEffect" });

const makeGeneratedClient = <
  Id extends string,
  Groups extends HttpApiGroup.Constraint,
>(
  api: HttpApi.HttpApi<Id, Groups>,
  http: HttpClient.HttpClient,
  baseUrl: string,
) =>
  EffectHttpApiClient.makeWith(api, {
    baseUrl,
    httpClient: http,
  });

const executeGeneratedOperation = Effect.fn(
  "HttpApiClient.executeGeneratedOperation",
)(function* <Client>(
  client: Client,
  { input, operation: entry }: ApiClientExecuteOptions,
) {
  const operationId = entry.operation.operationId;
  if (!operationId) {
    return yield* Effect.fail(
      new Error(
        `No generated API client operation for ${entry.method} ${entry.path}`,
      ),
    );
  }

  const target = Object(client);
  const groupName = Object.keys(target)
    .filter((name) => operationId.startsWith(`${name}.`))
    .sort((a, b) => b.length - a.length)[0];
  const group = groupName
    ? Object.entries(target).find(([name]) => name === groupName)?.[1]
    : target;
  const endpointName = groupName
    ? operationId.slice(groupName.length + 1)
    : operationId;

  const endpointCandidate =
    group instanceof Function
      ? undefined
      : Object.entries(Object(group)).find(
          ([name]) => name === endpointName,
        )?.[1];
  const endpoint =
    Schema.decodeUnknownOption(GeneratedOperation)(endpointCandidate);
  if (endpoint._tag === "None") {
    return yield* Effect.fail(
      new Error(`No generated API client operation for ${operationId}`),
    );
  }

  const result = Schema.decodeUnknownOption(GeneratedOperationEffect)(
    endpoint.value({
      headers: input.headers,
      params: input.params,
      query: input.query,
      payload: input.body,
    }),
  );
  if (result._tag === "None") {
    return yield* Effect.fail(
      new Error(`Generated API client operation ${operationId} is invalid`),
    );
  }

  return yield* result.value;
});

export type ApiClientService = {
  readonly encodeResult: (
    result: ErrorOptions["cause"],
    operation: HttpApiOperationEntry,
  ) => Effect.Effect<Json, Error>;
  readonly execute: (
    options: ApiClientExecuteOptions,
  ) => Effect.Effect<ErrorOptions["cause"], Error>;
};

export class ApiClient extends Context.Service<ApiClient, ApiClientService>()(
  "ApiClient",
) {
  static readonly layer = <
    Id extends string,
    Groups extends HttpApiGroup.Constraint,
  >(
    config: ApiClientConfig<Id, Groups>,
  ) =>
    Layer.effect(
      this,
      Effect.gen(function* () {
        const http = yield* HttpClient.HttpClient;
        const encodeResult = makeHttpApiOperationResultEncoder(config.api);
        const client = yield* makeGeneratedClient(
          config.api,
          http,
          config.baseUrl,
        );

        return {
          encodeResult:
            config.encodeResult ??
            ((result, operation) => encodeResult(result, operation)),
          execute: Effect.fn("ApiClient.execute")(function* (
            options: ApiClientExecuteOptions,
          ) {
            return yield* executeGeneratedOperation(client, options);
          }),
        };
      }),
    );
}
