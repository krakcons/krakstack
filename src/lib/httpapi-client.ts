import { Context, Effect, Layer } from "effect";
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

export type ApiClientConfig<
  Id extends string,
  Groups extends HttpApiGroup.Constraint,
> = {
  readonly api: HttpApi.HttpApi<Id, Groups>;
  readonly baseUrl: string;
};

export type ApiClientExecuteOptions = {
  readonly operation: HttpApiOperationEntry;
  readonly input: HttpApiOperationInput;
};

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

const isClientEffect = (
  value: unknown,
): value is Effect.Effect<unknown, unknown> => Effect.isEffect(value);

const executeGeneratedOperation = Effect.fn(
  "HttpApiClient.executeGeneratedOperation",
)(function* (
  client: unknown,
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
  const group: unknown = groupName ? Reflect.get(target, groupName) : target;
  const endpointName = groupName
    ? operationId.slice(groupName.length + 1)
    : operationId;

  const endpoint: unknown = Reflect.get(Object(group), endpointName);
  if (typeof endpoint !== "function") {
    return yield* Effect.fail(
      new Error(`No generated API client operation for ${operationId}`),
    );
  }

  const result: unknown = endpoint({
    headers: input.headers,
    params: input.params,
    query: input.query,
    payload: input.body,
  });

  if (!isClientEffect(result)) {
    return yield* Effect.fail(
      new Error(`Generated API client operation ${operationId} is invalid`),
    );
  }

  return yield* result;
});

export type ApiClientService = {
  readonly execute: (
    options: ApiClientExecuteOptions,
  ) => Effect.Effect<unknown, unknown>;
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
          execute: Effect.fn("ApiClient.execute")(function* (
            options: ApiClientExecuteOptions,
          ) {
            return yield* executeGeneratedOperation(client, options);
          }),
        };
      }),
    );
}
