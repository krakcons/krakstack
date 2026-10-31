import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";
import { Schema } from "effect";
import { SynthesizeSpeech } from "./schema";
import { SpeechUnavailable, TranscribeAudio, Transcription } from "./schema";

// The host application owns authentication, authorization, and any URL prefix.
export const SpeechApiGroup = HttpApiGroup.make("speech").add(
  HttpApiEndpoint.post("transcribe", "/speech/transcriptions", {
    payload: TranscribeAudio,
    success: Transcription,
    error: [SpeechUnavailable],
  }),
  HttpApiEndpoint.post("synthesize", "/speech/synthesis", {
    payload: SynthesizeSpeech,
    success: Schema.Uint8Array.pipe(HttpApiSchema.asUint8Array({ contentType: "audio/mpeg" })),
    error: [SpeechUnavailable],
  }),
);
