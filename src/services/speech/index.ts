import { Context, Effect, Layer, Redacted, Schema } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/http";
import {
  ElevenLabsSpeechRequest,
  GatewaySpeechResponse,
  SpeechUnavailable,
  SynthesizeSpeech,
  TranscribeAudio,
  WhisperRequest,
  WhisperResponse,
} from "./schema";

export interface SpeechOptions {
  readonly baseUrl: string;
  readonly apiKey: Redacted.Redacted<string>;
  readonly gatewayId: string;
}

export class Speech extends Context.Service<Speech>()(
  "@krak-stack/registry/speech/Speech",
  {
    make: (options: SpeechOptions) =>
      Effect.gen(function* () {
        const http = (yield* HttpClient.HttpClient).pipe(
          HttpClient.filterStatusOk,
        );
        const transcribe = Effect.fn("Speech.transcribe")(
          function* (input: TranscribeAudio) {
            const url = yield* Schema.decodeEffect(Schema.URLFromString)(
              options.baseUrl,
            );
            const path = yield* Schema.decodeEffect(
              Schema.String.check(
                Schema.isPattern(/^\/.*accounts\/[^/]+\/ai\/(v1|run)\/?$/),
              ),
            )(url.pathname);
            url.pathname = path.replace(
              /\/(v1|run)\/?$/,
              "/run/@cf/openai/whisper-large-v3-turbo",
            );
            url.search = "";
            url.hash = "";
            let payload: typeof WhisperRequest.Type = {
              audio: input.audio,
              task: "transcribe",
              vad_filter: true,
            };
            if (input.language)
              payload = { ...payload, language: input.language };
            const request = yield* HttpClientRequest.post(url.toString()).pipe(
              HttpClientRequest.bearerToken(options.apiKey),
              HttpClientRequest.setHeaders({
                "cf-aig-gateway-id": options.gatewayId,
                "cf-aig-skip-cache": "true",
                "cf-aig-collect-log": "false",
              }),
              HttpClientRequest.schemaBodyJson(WhisperRequest)(payload),
            );
            const response = yield* http.execute(request);
            const body =
              yield* HttpClientResponse.schemaBodyJson(WhisperResponse)(
                response,
              );
            return { text: body.result.text.trim() };
          },
          Effect.timeout("60 seconds"),
          Effect.mapError(() => new SpeechUnavailable({})),
        );
        const synthesize = Effect.fn("Speech.synthesize")(
          function* (input: SynthesizeSpeech) {
            const payload = yield* Schema.decodeEffect(SynthesizeSpeech)(input);
            const url = yield* Schema.decodeEffect(Schema.URLFromString)(
              options.baseUrl,
            );
            const path = yield* Schema.decodeEffect(
              Schema.String.check(
                Schema.isPattern(/^\/.*accounts\/[^/]+\/ai\/(v1|run)\/?$/),
              ),
            )(url.pathname);
            url.pathname = path.replace(/\/(v1|run)\/?$/, "/run");
            url.search = "";
            url.hash = "";
            const request = yield* HttpClientRequest.post(url.toString()).pipe(
              HttpClientRequest.bearerToken(options.apiKey),
              HttpClientRequest.setHeaders({
                "cf-aig-gateway-id": options.gatewayId,
                "cf-aig-skip-cache": "true",
                "cf-aig-collect-log": "false",
              }),
              HttpClientRequest.schemaBodyJson(ElevenLabsSpeechRequest)({
                model: "elevenlabs/eleven-flash-v2-5",
                input: {
                  text: payload.text,
                  language_code: payload.language,
                  voice_id: "JBFqnCBsd6RMkjVDRZzb",
                  output_format: "mp3_44100_128",
                },
              }),
            );
            const response = yield* http.execute(request);
            const body = yield* HttpClientResponse.schemaBodyJson(
              GatewaySpeechResponse,
            )(response);
            const { result } = "success" in body ? body.result : body;
            // The presigned URL needs no Gateway credentials. Do not follow redirects.
            const audio = yield* http.get(result.audio).pipe(
              Effect.provideService(FetchHttpClient.RequestInit, {
                credentials: "omit",
                redirect: "error",
              }),
              Effect.provideService(HttpClient.TracerDisabledWhen, () => true),
            );
            if (
              audio.headers["content-type"]?.split(";")[0]?.trim() !==
              "audio/mpeg"
            ) {
              return yield* new SpeechUnavailable({});
            }
            return yield* Schema.decodeEffect(
              Schema.Uint8Array.check(Schema.isMinLength(1)),
            )(new Uint8Array(yield* audio.arrayBuffer));
          },
          Effect.timeout("60 seconds"),
          Effect.mapError(() => new SpeechUnavailable({})),
        );
        return { transcribe, synthesize };
      }),
  },
) {
  static readonly layer = (options: SpeechOptions) =>
    Layer.effect(this, this.make(options)).pipe(
      Layer.provide(FetchHttpClient.layer),
    );
}
