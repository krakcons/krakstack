import { Context, Effect, Layer, Redacted, Schema } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/http";
import {
  SpeechUnavailable,
  TranscribeAudio,
  WhisperRequest,
  WhisperResponse,
} from "./schema";
import { SynthesizeSpeech, MeloRequest, MeloResponse } from "./schema";

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
            url.pathname = path.replace(
              /\/(v1|run)\/?$/,
              "/run/@cf/myshell-ai/melotts",
            );
            url.search = "";
            url.hash = "";
            const request = yield* HttpClientRequest.post(url.toString()).pipe(
              HttpClientRequest.bearerToken(options.apiKey),
              HttpClientRequest.setHeaders({
                "cf-aig-gateway-id": options.gatewayId,
                "cf-aig-skip-cache": "true",
                "cf-aig-collect-log": "false",
                accept: "audio/mpeg",
              }),
              HttpClientRequest.schemaBodyJson(MeloRequest)({
                prompt: payload.text,
                lang: payload.language,
              }),
            );
            const response = yield* http.execute(request);
            if (
              response.headers["content-type"]?.split(";")[0]?.trim() ===
              "audio/mpeg"
            ) {
              const bytes = new Uint8Array(yield* response.arrayBuffer);
              return yield* Schema.decodeEffect(
                Schema.Uint8Array.check(Schema.isMinLength(1)),
              )(bytes);
            }
            const body =
              yield* HttpClientResponse.schemaBodyJson(MeloResponse)(response);
            return body.result.audio;
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
