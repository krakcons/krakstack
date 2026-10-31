# Speech

Reusable Effect speech-to-text and text-to-speech service backed by Cloudflare AI Gateway. Transcription uses `@cf/openai/whisper-large-v3-turbo`; synthesis uses `@cf/myshell-ai/melotts`. No application, session, database, authentication, React, or environment-variable dependencies.

## Use the service

Configure it once and provide the layer to your application's Effect runtime:

```ts
import { Effect, Redacted } from "effect";
import { Speech } from "@krak-stack/registry/speech";

const SpeechLive = Speech.layer({
  baseUrl: "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1",
  apiKey: Redacted.make(serverOnlyApiKey),
  gatewayId: "my-gateway",
});

const program = Effect.gen(function* () {
  const speech = yield* Speech;
  return yield* speech.transcribe({
    audio: audioBytes, // Uint8Array
    mimeType: "audio/webm",
    language: "en", // Optional; omit for automatic language detection.
  });
});

const result = await Effect.runPromise(program.pipe(Effect.provide(SpeechLive)));
// { text: "Hello." }
```

On the same configured service, generate MP3 bytes:

```ts
const audio = yield * speech.synthesize({ text: "Bonjour.", language: "fr" });
// Uint8Array containing MP3 audio
```

The base URL accepts the account's `/ai/v1` or `/ai/run` endpoint. The credential needs Workers AI access. No direct OpenAI credential is used. Install `@krak-stack/registry` and its `effect` peer dependency to use the speech exports.

## Optional HTTP API

Import `SpeechApiGroup` from `@krak-stack/registry/speech/api` and add it to your Effect HttpApi. The host supplies the handler, authentication, authorization, and any `/api` prefix:

```ts
import { Effect } from "effect";
import { HttpApi, HttpApiBuilder } from "effect/http-api";
import { Speech } from "@krak-stack/registry/speech";
import { SpeechApiGroup } from "@krak-stack/registry/speech/api";

const Api = HttpApi.make("MyApi").add(SpeechApiGroup);
const SpeechHandlers = HttpApiBuilder.group(Api, "speech", (handlers) =>
  handlers
    .handle("transcribe", ({ payload }) =>
      Effect.flatMap(Speech, (speech) => speech.transcribe(payload)),
    )
    .handle("synthesize", ({ payload }) =>
      Effect.flatMap(Speech, (speech) => speech.synthesize(payload)),
    ),
);
```

**Secure the group with your application's auth middleware before exposing it.** The package does not grant access or implement quotas. Gateway credentials must stay on the server. Simulator's adapter demonstrates authenticated integration without requiring a practice session.

### `POST /speech/transcriptions`

JSON request:

```json
{
  "audio": "BASE64_ENCODED_AUDIO",
  "mimeType": "audio/webm",
  "language": "fr"
}
```

Response:

```json
{ "text": "Bonjour." }
```

- `audio`: nonempty base64 audio, decoded size at most 2 MiB. The Effect client accepts `Uint8Array` and handles base64 encoding.
- `mimeType`: `audio/webm`, `audio/ogg`, `audio/mp4`, or `audio/wav`.
- `language`: optional two- or three-letter lowercase language code; no English/French restriction.
- Invalid HTTP input is rejected by the schema. Provider, configuration, timeout, and response-validation failures use the typed `SpeechUnavailable` error (HTTP 503).
- Empty text means no speech was detected. The caller decides how to present it.

### `POST /speech/synthesis`

```json
{ "text": "Bonjour, comment allez-vous ?", "language": "fr" }
```

Returns raw MP3 bytes with `Content-Type: audio/mpeg`, not base64 JSON. The typed Effect client returns `Uint8Array`.

- `text`: 1–4,000 characters, containing non-whitespace text.
- `language`: required; `en`, `fr`, `es`, `zh`, `ja`, or `ko` (MeloTTS languages).
- No voice selection: the model does not expose a voice parameter.
- Invalid HTTP input is rejected by the schema. Provider, configuration, timeout, empty-audio, and malformed-response failures use `SpeechUnavailable` (HTTP 503).

Both operations have a 60-second request timeout and do not retry automatically or store recordings/generated audio. They skip Gateway caching and request disabled input/output logging; Cloudflare retention policies still apply. The browser UI owns microphone access, recording duration, cancellation, draft insertion, and playback.

## Checks

From the repository root:

```sh
bun run registry:package:build
bun lint src/services/speech
bun --bun vitest run src/services/speech
```

Tests use a mocked HTTP transport and make no paid inference calls.
