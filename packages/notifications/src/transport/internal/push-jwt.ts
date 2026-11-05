import { Effect, Schema } from "effect";
import { Signature } from "effect/crypto";
import { Base64Url } from "effect/encoding";

const encodeJson = Schema.encodeEffect(Schema.fromJsonString(Schema.Json));

export const signJwt = Effect.fnUntraced(function* (
  signature: Signature.Signature["Service"],
  key: Signature.PrivateKey,
  header: Schema.Json,
  claims: Schema.Json,
) {
  const unsigned = `${Base64Url.encode(yield* encodeJson(header))}.${Base64Url.encode(yield* encodeJson(claims))}`;
  const signed = yield* signature.sign(key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${Base64Url.encode(signed)}`;
});
