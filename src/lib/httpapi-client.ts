import { Context, Effect, Layer, Schema } from "effect";
import { HttpClient } from "effect/unstable/http";
import {
  HttpApi,
  HttpApiClient as EffectHttpApiClient,
  HttpApiGroup,
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

export const HttpApiOperationResult = Schema.Union([
  Schema.Json,
  Schema.DateFromString,
  Schema.Uint8ArrayFromBase64,
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
        const client = yield* makeGeneratedClient(
          config.api,
          http,
          config.baseUrl,
        );

        return {
          encodeResult:
            config.encodeResult ??
            ((result) => encodeHttpApiOperationResult(result)),
          execute: Effect.fn("ApiClient.execute")(function* (
            options: ApiClientExecuteOptions,
          ) {
            return yield* executeGeneratedOperation(client, options);
          }),
        };
      }),
    );
}
