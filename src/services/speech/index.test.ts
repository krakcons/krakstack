import { describe, expect, it } from "@effect/vitest";
import { Effect, Redacted, Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { Speech } from "./index";
import {
  MAX_AUDIO_BYTES,
  TranscribeAudio,
  WhisperRequest,
  ElevenLabsSpeechRequest,
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
const audioUrl =
  "https://test-account.r2.cloudflarestorage.com/audio/speech.mp3?X-Amz-Signature=test";
const completed = (audio = audioUrl) =>
  Response.json({ state: "Completed", result: { audio } });

describe("speech synthesis", () => {
  it.effect(
    "routes French synthesis through the Gateway and returns MP3 bytes",
    () => {
      const requests: Request[] = [];
      let downloadCredentials: RequestCredentials | undefined;
      const bytes = new Uint8Array([73, 68, 51, 1]);
      return Effect.gen(function* () {
        const speech = yield* Speech;
        expect(
          yield* speech.synthesize({ text: "Bonjour Alex.", language: "fr" }),
        ).toEqual(bytes);
        const request = requests[0]!;
        expect(request.url).toBe(
          "https://api.example.test/client/v4/accounts/test-account/ai/run",
        );
        expect(request.headers.get("authorization")).toBe("Bearer gateway-key");
        expect(request.headers.get("cf-aig-gateway-id")).toBe("example");
        expect(request.headers.get("cf-aig-skip-cache")).toBe("true");
        expect(request.headers.get("cf-aig-collect-log")).toBe("false");
        expect(
          yield* Schema.decodeEffect(
            Schema.fromJsonString(ElevenLabsSpeechRequest),
          )(yield* Effect.promise(() => request.text())),
        ).toEqual({
          model: "elevenlabs/eleven-flash-v2-5",
          input: {
            text: "Bonjour Alex.",
            language_code: "fr",
            voice_id: "JBFqnCBsd6RMkjVDRZzb",
            output_format: "mp3_44100_128",
          },
        });
        expect(requests).toHaveLength(2);
        const download = requests[1]!;
        expect(download.url).toBe(audioUrl);
        expect(download.method).toBe("GET");
        expect(download.redirect).toBe("error");
        expect(downloadCredentials).toBe("omit");
        expect(download.headers.has("authorization")).toBe(false);
        expect(download.headers.has("cf-aig-gateway-id")).toBe(false);
      }).pipe(
        Effect.provide(speechLayer),
        Effect.provideService(
          FetchHttpClient.Fetch,
          Object.assign(
            async (input: string | URL | Request, init?: RequestInit) => {
              const request = new Request(input, init);
              requests.push(request);
              if (request.method === "POST") {
                return Response.json({
                  success: true,
                  result: { state: "Completed", result: { audio: audioUrl } },
                  errors: [],
                  messages: [],
                });
              }
              downloadCredentials = init?.credentials;
              return new Response(bytes, {
                headers: { "content-type": "audio/mpeg" },
              });
            },
            { preconnect: () => {} },
          ),
        ),
      );
    },
  );
  it.effect("passes Spanish through as an ISO 639-1 language code", () =>
    Effect.gen(function* () {
      const speech = yield* Speech;
      expect(
        yield* speech.synthesize({ text: "Hola.", language: "es" }),
      ).toEqual(new Uint8Array([73, 68, 51]));
    }).pipe(
      Effect.provide(speechLayer),
      Effect.provideService(
        FetchHttpClient.Fetch,
        Object.assign(
          async (input: string | URL | Request, init?: RequestInit) => {
            const request = new Request(input, init);
            if (request.method === "POST") {
              expect(await request.json()).toEqual({
                model: "elevenlabs/eleven-flash-v2-5",
                input: {
                  text: "Hola.",
                  language_code: "es",
                  voice_id: "JBFqnCBsd6RMkjVDRZzb",
                  output_format: "mp3_44100_128",
                },
              });
              return completed();
            }
            return new Response(new Uint8Array([73, 68, 51]), {
              headers: { "content-type": "audio/mpeg; charset=binary" },
            });
          },
          { preconnect: () => {} },
        ),
      ),
    ),
  );
  it.effect(
    "maps provider, malformed, empty, and unexpected responses to a typed error",
    () =>
      Effect.gen(function* () {
        const providerFailures = [
          new Response("unavailable", { status: 503 }),
          Response.json({ state: "Failed", result: { audio: audioUrl } }),
          Response.json({
            success: false,
            result: { state: "Completed", result: { audio: audioUrl } },
          }),
          completed("not-a-url"),
          completed("https://untrusted.example/audio.mp3"),
        ];
        const downloadFailures = [
          new Response("expired", { status: 403 }),
          new Response(new Uint8Array(), {
            headers: { "content-type": "audio/mpeg" },
          }),
          new Response("<html>error</html>", {
            headers: { "content-type": "text/html" },
          }),
        ];
        for (const [response, download] of [
          ...providerFailures.map((response) => [response, undefined] as const),
          ...downloadFailures.map(
            (download) => [completed(), download] as const,
          ),
        ]) {
          let calls = 0;
          const error = yield* Effect.gen(function* () {
            return yield* (yield* Speech).synthesize({
              text: "Hello.",
              language: "en",
            });
          }).pipe(
            Effect.provide(speechLayer),
            Effect.provideService(
              FetchHttpClient.Fetch,
              Object.assign(
                async () => {
                  calls++;
                  return calls === 1
                    ? response
                    : (download ?? Response.error());
                },
                { preconnect: () => {} },
              ),
            ),
            Effect.flip,
          );
          expect(error._tag).toBe("SpeechUnavailable");
          expect(calls).toBe(download ? 2 : 1);
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
        expect(yield* speech.transcribe(input)).toEqual({
          text: "Bonjour Alex.",
        });
        const request = requests[0]!;
        expect(request.url).toBe(
          "https://api.example.test/client/v4/accounts/test-account/ai/run/@cf/openai/whisper-large-v3-turbo",
        );
        expect(request.headers.get("authorization")).toBe("Bearer gateway-key");
        expect(request.headers.get("cf-aig-gateway-id")).toBe("example");
        expect(request.headers.get("cf-aig-skip-cache")).toBe("true");
        expect(request.headers.get("cf-aig-collect-log")).toBe("false");
        const payload = yield* Schema.decodeEffect(
          Schema.fromJsonString(WhisperRequest),
        )(yield* Effect.promise(() => request.text()));
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
              return Response.json({
                success: true,
                result: { text: "  Bonjour Alex.  " },
              });
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
          Response.json({
            success: false,
            errors: [{ message: "provider secret" }],
          }),
          Response.json({ success: true, result: { text: 42 } }),
        ],
        (response) =>
          Effect.gen(function* () {
            const result = yield* Effect.result(
              (yield* Speech).transcribe(input),
            );
            expect(result._tag).toBe("Failure");
            if (result._tag === "Failure")
              expect(result.failure._tag).toBe("SpeechUnavailable");
          }).pipe(
            Effect.provide(speechLayer),
            Effect.provideService(
              FetchHttpClient.Fetch,
              Object.assign(async () => response, { preconnect: () => {} }),
            ),
          ),
      ),
  );
  it.effect(
    "rejects an invalid gateway configuration before an outbound request",
    () => {
      let calls = 0;
      return Effect.gen(function* () {
        const speech = yield* Speech;
        expect((yield* Effect.result(speech.transcribe(input)))._tag).toBe(
          "Failure",
        );
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
    },
  );
  it("validates binary/base64 size, recording format, and language at the boundary", () => {
    const valid = Schema.is(TranscribeAudio);
    expect(valid(input)).toBe(true);
    expect(valid({ ...input, audio: new Uint8Array() })).toBe(false);
    expect(
      valid({ ...input, audio: new Uint8Array(MAX_AUDIO_BYTES + 1) }),
    ).toBe(false);
    expect(valid({ ...input, mimeType: "text/plain" })).toBe(false);
    expect(valid({ ...input, language: "not-a-language" })).toBe(false);
    expect(valid({ ...input, language: "de" })).toBe(true);
    const encode = Schema.encodeSync(TranscribeAudio);
    const decode = Schema.decodeUnknownSync(TranscribeAudio);
    expect(decode(encode(input))).toEqual(input);
    expect(Schema.is(TranscribeAudio)(input)).toBe(true);
  });
});
