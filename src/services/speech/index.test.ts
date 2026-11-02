import { describe, expect, it } from "@effect/vitest";
import { Effect, Redacted, Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { Speech } from "./index";
import {
  MAX_AUDIO_BYTES,
  TranscribeAudio,
  WhisperRequest,
  MeloRequest,
  SynthesizeSpeech,
} from "./schema";

const options = {
  baseUrl: "https://api.example.test/client/v4/accounts/test-account/ai/v1",
  apiKey: Redacted.make("gateway-key"),
  gatewayId: "example",
};
const input: TranscribeAudio = {
  audio: new Uint8Array([1, 2, 3]),
  mimeType: "audio/webm",
  language: "fr",
};
const speechLayer = Speech.layer(options);

describe("speech synthesis", () => {
  it.effect("routes French synthesis through the Gateway and returns MP3 bytes", () => {
    const requests: Request[] = [];
    const bytes = new Uint8Array([73, 68, 51, 1]);
    return Effect.gen(function* () {
      const speech = yield* Speech;
      expect(yield* speech.synthesize({ text: "Bonjour Alex.", language: "fr" })).toEqual(bytes);
      const request = requests[0]!;
      expect(request.url).toBe(
        "https://api.example.test/client/v4/accounts/test-account/ai/run/@cf/myshell-ai/melotts",
      );
      expect(request.headers.get("authorization")).toBe("Bearer gateway-key");
      expect(request.headers.get("cf-aig-gateway-id")).toBe("example");
      expect(request.headers.get("cf-aig-skip-cache")).toBe("true");
      expect(request.headers.get("cf-aig-collect-log")).toBe("false");
      expect(
        yield* Schema.decodeUnknownEffect(Schema.fromJsonString(MeloRequest))(
          yield* Effect.promise(() => request.text()),
        ),
      ).toEqual({ prompt: "Bonjour Alex.", lang: "fr" });
    }).pipe(
      Effect.provide(speechLayer),
      Effect.provideService(FetchHttpClient.Fetch, Object.assign(
        async (input: string | URL | Request, init?: RequestInit) => {
          requests.push(new Request(input, init));
          return new Response(bytes, { headers: { "content-type": "audio/mpeg" } });
        },
        { preconnect: () => {} },
      )),
    );
  });
  it.effect("decodes the Gateway JSON audio response", () =>
    Effect.gen(function* () {
      const speech = yield* Speech;
      expect(yield* speech.synthesize({ text: "Hello.", language: "en" })).toEqual(
        new Uint8Array([73, 68, 51]),
      );
    }).pipe(
      Effect.provide(speechLayer),
      Effect.provideService(FetchHttpClient.Fetch, Object.assign(async () =>
        Response.json({ success: true, result: { audio: "SUQz" } }),
        { preconnect: () => {} },
      )),
    ),
  );
  it.effect("maps provider, malformed, empty, and unexpected responses to a typed error", () =>
    Effect.gen(function* () {
      for (const response of [
        new Response("unavailable", { status: 503 }),
        Response.json({ success: true, result: { audio: "invalid%%%" } }),
        new Response(new Uint8Array(), { headers: { "content-type": "audio/mpeg" } }),
        new Response("<html>error</html>", { headers: { "content-type": "text/html" } }),
      ]) {
        const error = yield* Effect.gen(function* () {
          return yield* (yield* Speech).synthesize({ text: "Hello.", language: "en" });
        }).pipe(
          Effect.provide(speechLayer),
          Effect.provideService(FetchHttpClient.Fetch, Object.assign(async () => response, { preconnect: () => {} })),
          Effect.flip,
        );
        expect(error._tag).toBe("SpeechUnavailable");
      }
    }),
  );
  it("rejects empty, oversized, and unsupported-language synthesis input", () => {
    const valid = Schema.is(SynthesizeSpeech);
    expect(valid({ text: "Bonjour.", language: "fr" })).toBe(true);
    for (const text of ["", "   ", "a".repeat(4001)]) {
      expect(valid({ text, language: "en" })).toBe(false);
    }
    expect(valid({ text: "Hello.", language: "invalid" })).toBe(false);
  });
});

describe("speech transcription", () => {
  it.effect(
    "routes Whisper through AI Gateway with the current language and returns only text",
    () => {
      const requests: Request[] = [];
      return Effect.gen(function* () {
        const speech = yield* Speech;
        expect(yield* speech.transcribe(input)).toEqual({ text: "Bonjour Alex." });
        const request = requests[0]!;
        expect(request.url).toBe(
          "https://api.example.test/client/v4/accounts/test-account/ai/run/@cf/openai/whisper-large-v3-turbo",
        );
        expect(request.headers.get("authorization")).toBe("Bearer gateway-key");
        expect(request.headers.get("cf-aig-gateway-id")).toBe("example");
        expect(request.headers.get("cf-aig-skip-cache")).toBe("true");
        expect(request.headers.get("cf-aig-collect-log")).toBe("false");
        const payload = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(WhisperRequest))(
          yield* Effect.promise(() => request.text()),
        );
        expect(payload).toEqual({
          audio: input.audio,
          language: "fr",
          task: "transcribe",
          vad_filter: true,
        });
      }).pipe(
        Effect.provide(speechLayer),
        Effect.provideService(
          FetchHttpClient.Fetch,
          Object.assign(
            async (url: string | URL | Request, options?: RequestInit) => {
              requests.push(new Request(url, options));
              return Response.json({ success: true, result: { text: "  Bonjour Alex.  " } });
            },
            { preconnect: () => {} },
          ),
        ),
      );
    },
  );
  it.effect(
    "rejects provider failures and malformed responses without leaking upstream details",
    () =>
      Effect.forEach(
        [
          new Response("provider secret", { status: 503 }),
          Response.json({ success: false, errors: [{ message: "provider secret" }] }),
          Response.json({ success: true, result: { text: 42 } }),
        ],
        (response) =>
          Effect.gen(function* () {
            const result = yield* Effect.result((yield* Speech).transcribe(input));
            expect(result._tag).toBe("Failure");
            if (result._tag === "Failure") expect(result.failure._tag).toBe("SpeechUnavailable");
          }).pipe(
            Effect.provide(speechLayer),
            Effect.provideService(
              FetchHttpClient.Fetch,
              Object.assign(async () => response, { preconnect: () => {} }),
            ),
          ),
      ),
  );
  it.effect("rejects an invalid gateway configuration before an outbound request", () => {
    let calls = 0;
    return Effect.gen(function* () {
      const speech = yield* Speech;
      expect((yield* Effect.result(speech.transcribe(input)))._tag).toBe("Failure");
      expect(calls).toBe(0);
    }).pipe(
      Effect.provide(Speech.layer({ ...options, baseUrl: "not-a-url" })),
      Effect.provideService(
        FetchHttpClient.Fetch,
        Object.assign(
          async () => {
            calls++;
            return Response.json({});
          },
          { preconnect: () => {} },
        ),
      ),
    );
  });
  it("validates binary/base64 size, recording format, and language at the boundary", () => {
    const valid = Schema.is(TranscribeAudio);
    expect(valid(input)).toBe(true);
    expect(valid({ ...input, audio: new Uint8Array() })).toBe(false);
    expect(valid({ ...input, audio: new Uint8Array(MAX_AUDIO_BYTES + 1) })).toBe(false);
    expect(valid({ ...input, mimeType: "text/plain" })).toBe(false);
    expect(valid({ ...input, language: "not-a-language" })).toBe(false);
    expect(valid({ ...input, language: "de" })).toBe(true);
    const encode = Schema.encodeSync(TranscribeAudio);
    const decode = Schema.decodeUnknownSync(TranscribeAudio);
    expect(decode(encode(input))).toEqual(input);
    expect(Schema.is(TranscribeAudio)(input)).toBe(true);
  });
});
