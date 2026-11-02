import { Schema } from "effect";

export const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
export const AudioMimeType = Schema.Literals([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/wav",
]).annotate({ identifier: "SpeechAudioMimeType" });
export const TranscribeAudio = Schema.Struct({
  audio: Schema.Uint8ArrayFromBase64.check(
    Schema.isMinLength(1),
    Schema.isMaxLength(MAX_AUDIO_BYTES),
  ),
  mimeType: AudioMimeType,
  language: Schema.optionalKey(
    Schema.String.check(Schema.isPattern(/^[a-z]{2,3}$/)),
  ),
}).annotate({ identifier: "TranscribeAudio" });
export const Transcription = Schema.Struct({
  text: Schema.String.check(Schema.isMaxLength(12000)),
}).annotate({ identifier: "SpeechTranscription" });
export const WhisperRequest = Schema.Struct({
  audio: TranscribeAudio.fields.audio,
  language: TranscribeAudio.fields.language,
  task: Schema.Literal("transcribe"),
  vad_filter: Schema.Boolean,
}).annotate({ identifier: "GatewayWhisperRequest" });
export const WhisperResponse = Schema.Struct({
  success: Schema.Literal(true),
  result: Transcription,
}).annotate({ identifier: "GatewayWhisperResponse" });
export class SpeechUnavailable extends Schema.TaggedError<
  SpeechUnavailable,
  { readonly brand: unique symbol }
>()("SpeechUnavailable", {}, { httpApiStatus: 503 }) {}
export type TranscribeAudio = typeof TranscribeAudio.Type;

export const SynthesizeSpeech = Schema.Struct({
  text: Schema.String.check(
    Schema.isMinLength(1),
    Schema.isMaxLength(4000),
    Schema.isPattern(/\S/),
  ),
  language: Schema.Literals(["en", "fr", "es", "zh", "ja", "ko"]),
}).annotate({ identifier: "SynthesizeSpeech" });
export type SynthesizeSpeech = typeof SynthesizeSpeech.Type;
export const MeloRequest = Schema.Struct({
  prompt: SynthesizeSpeech.fields.text,
  lang: SynthesizeSpeech.fields.language,
}).annotate({ identifier: "GatewayMeloRequest" });
export const MeloResponse = Schema.Struct({
  success: Schema.Literal(true),
  result: Schema.Struct({
    audio: Schema.Uint8ArrayFromBase64.check(Schema.isMinLength(1)),
  }),
}).annotate({ identifier: "GatewayMeloResponse" });
