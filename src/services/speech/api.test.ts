import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { HttpServer } from "effect/http";
import { HttpApi, HttpApiBuilder, HttpApiTest } from "effect/http-api";
import { SpeechApiGroup } from "./api";
import { Speech } from "./index";
import type { TranscribeAudio } from "./schema";

describe("reusable speech API", () => {
  it.effect(
    "works in another host API without sessions, database access, or app-specific configuration",
    () => {
      const api = HttpApi.make("AnotherProjectApi").add(SpeechApiGroup);
      const received: TranscribeAudio[] = [];
      const handlers = HttpApiBuilder.group(api, "speech", (handlers) =>
        Effect.gen(function* () {
          const speech = yield* Speech;
          return handlers
            .handle("transcribe", ({ payload }) => speech.transcribe(payload))
            .handle("synthesize", ({ payload }) => speech.synthesize(payload));
        }),
      ).pipe(
        Layer.provide(
          Layer.succeed(Speech, {
            synthesize: () => Effect.succeed(new Uint8Array([73, 68, 51])),
            transcribe: (input) =>
              Effect.sync(() => {
                received.push(input);
                return { text: "Hallo." };
              }),
          }),
        ),
      );
      return Effect.gen(function* () {
        const client = yield* HttpApiTest.groups(api, ["speech"]);
        const audio = new Uint8Array([1, 2, 3]);
        expect(
          yield* client.speech.transcribe({
            payload: { audio, mimeType: "audio/webm", language: "de" },
          }),
        ).toEqual({ text: "Hallo." });
        expect(received[0]).toEqual({ audio, mimeType: "audio/webm", language: "de" });
        yield* client.speech.transcribe({ payload: { audio, mimeType: "audio/ogg" } });
        expect(received[1]?.language).toBeUndefined();
        expect(
          yield* client.speech.synthesize({ payload: { text: "Bonjour.", language: "fr" } }),
        ).toEqual(new Uint8Array([73, 68, 51]));
      }).pipe(Effect.provide(Layer.mergeAll(handlers, HttpServer.layerServices)), Effect.scoped);
    },
  );
});
