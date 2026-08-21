import { OpenAiClient } from "@effect/ai-openai";
import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { HttpClientRequest } from "effect/unstable/http";

import { CloudflareAIGateway } from "./index";

const configLayer = ConfigProvider.layer(
  ConfigProvider.fromUnknown({
    AI_GATEWAY_BASE_URL:
      "https://api.cloudflare.com/client/v4/accounts/account/ai/v1",
    AI_GATEWAY_API_KEY: "gateway-key",
    AI_GATEWAY_ID: "gateway-id",
  }),
);

const requestWith = (layer: Layer.Layer<OpenAiClient.OpenAiClient, unknown>) =>
  Effect.gen(function* () {
    const client = yield* OpenAiClient.OpenAiClient;
    return yield* client.client.preprocess(
      HttpClientRequest.post("/responses"),
    );
  }).pipe(Effect.provide(layer.pipe(Layer.provide(configLayer))));

describe("CloudflareAIGateway", () => {
  it.effect("configures the Cloudflare endpoint and gateway", () =>
    Effect.gen(function* () {
      const request = yield* requestWith(CloudflareAIGateway.layer);

      expect(request.url).toBe(
        "https://api.cloudflare.com/client/v4/accounts/account/ai/v1/responses",
      );
      expect(request.headers.authorization).toBe("Bearer gateway-key");
      expect(request.headers["cf-aig-gateway-id"]).toBe("gateway-id");
      expect(request.headers["cf-aig-metadata"]).toBeUndefined();
    }),
  );

  it.effect("adds arbitrary metadata with layerWith", () =>
    Effect.gen(function* () {
      const request = yield* requestWith(
        CloudflareAIGateway.layerWith({
          userId: "user-id",
          organizationId: "organization-id",
          test: true,
        }),
      );

      expect(JSON.parse(request.headers["cf-aig-metadata"] ?? "")).toEqual({
        userId: "user-id",
        organizationId: "organization-id",
        test: true,
      });
    }),
  );
});
