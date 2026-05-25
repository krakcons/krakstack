import { OpenAiClient, OpenAiEmbeddingModel } from "@effect/ai-openai-compat";
import { Config, Effect, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

export const EmbeddingLayer = Layer.unwrap(
  Effect.gen(function* () {
    const apiUrl = yield* Config.string("EMBEDDINGS_URL");
    const embeddingModel = yield* Config.string("EMBEDDINGS_MODEL");
    const embeddingDimensions = yield* Config.number("EMBEDDINGS_DIMENSIONS");

    const embeddingClientLayer = OpenAiClient.layer({
      apiKey: Redacted.make("embedding"),
      apiUrl,
    });

    return OpenAiEmbeddingModel.layer({
      model: embeddingModel,
      config: {
        dimensions: embeddingDimensions,
        encoding_format: "float",
      },
    }).pipe(
      Layer.provide(embeddingClientLayer),
      Layer.provide(FetchHttpClient.layer),
    );
  }),
);
