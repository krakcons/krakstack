import { OpenAiClient } from "@effect/ai-openai";
import { Config, Context, Effect, Layer } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
} from "effect/unstable/http";

export type CloudflareAIGatewayMetadata = Readonly<
  Record<string, string | number | boolean>
>;

export class CloudflareAIGateway extends Context.Service<CloudflareAIGateway>()(
  "CloudflareAIGateway",
  {
    make: Effect.gen(function* () {
      const apiUrl = yield* Config.string("AI_GATEWAY_BASE_URL");
      const apiKey = yield* Config.redacted("AI_GATEWAY_API_KEY");
      const gatewayId = yield* Config.string("AI_GATEWAY_ID");
      return { apiUrl, apiKey, gatewayId };
    }),
  },
) {
  static readonly baseLayer = Layer.effect(this, this.make);

  private static readonly clientLayer = (
    metadata?: CloudflareAIGatewayMetadata,
  ) =>
    Layer.unwrap(
      Effect.map(this, ({ apiKey, apiUrl, gatewayId }) =>
        OpenAiClient.layer({
          apiKey,
          apiUrl,
          transformClient: (client) =>
            HttpClient.mapRequest(client, (request) => {
              const gatewayRequest = HttpClientRequest.setHeader(
                request,
                "cf-aig-gateway-id",
                gatewayId,
              );
              return metadata
                ? HttpClientRequest.setHeader(
                    gatewayRequest,
                    "cf-aig-metadata",
                    JSON.stringify(metadata),
                  )
                : gatewayRequest;
            }),
        }),
      ),
    ).pipe(Layer.provide(FetchHttpClient.layer), Layer.provide(this.baseLayer));

  static readonly layer = this.clientLayer();
  static readonly layerWith = (metadata: CloudflareAIGatewayMetadata) =>
    this.clientLayer(metadata);
}
