import { Effect, Layer } from "effect";
import { HttpClient } from "effect/http";
import type { HttpApi, HttpApiGroup } from "effect/http-api";
import {
  HttpApiAdapter,
  encodeHttpApiOperationResult,
  type HttpApiAdapterService,
} from "./httpapi-adapter";

export const httpApiAdapterTestLayer = <
  Id extends string,
  Groups extends HttpApiGroup.Constraint,
>(
  api: HttpApi.HttpApi<Id, Groups>,
  overrides: Partial<
    Pick<HttpApiAdapterService, "execute" | "encodeResult">
  > = {},
) =>
  Layer.effect(
    HttpApiAdapter,
    HttpApiAdapter.make({ api, baseUrl: "http://localhost" }).pipe(
      Effect.map((adapter) => ({
        ...adapter,
        execute: () => Effect.die("HTTP execution is not used in this test"),
        encodeResult: encodeHttpApiOperationResult,
        ...overrides,
      })),
      Effect.provide(
        Layer.succeed(
          HttpClient.HttpClient,
          HttpClient.make(() =>
            Effect.die("HTTP transport is not used in this test"),
          ),
        ),
      ),
    ),
  );
