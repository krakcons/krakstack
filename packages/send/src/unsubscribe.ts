import { Context, DateTime, Effect, Layer, Redacted, Schema } from "effect";
import { Mac, SecureRandom } from "effect/crypto";
import { Base64Url } from "effect/encoding";
import { EmailUnsubscribeUrl } from "@krak-stack/notifications/schema";

import { KrakSend } from "./index.js";
import {
  ContactParams,
  SendUnsubscribeClaims,
  SendUnsubscribeOptions,
  SendUnsubscribeTokenInput,
  SendUnsubscribeTokenError,
  SendUnsubscribeConfigurationError,
  SendUnsubscribeCryptoError,
} from "./schema.js";

const ClaimsJson = Schema.fromJsonString(SendUnsubscribeClaims);
const invalidToken = () =>
  new SendUnsubscribeTokenError({
    message: "Invalid or expired unsubscribe link",
  });
const cryptoError = () =>
  new SendUnsubscribeCryptoError({
    message: "Unsubscribe token cryptography failed",
  });

const makeUnsubscribe = Effect.fnUntraced(function* (
  raw: SendUnsubscribeOptions,
) {
  const options = yield* Schema.decodeEffect(SendUnsubscribeOptions)(raw).pipe(
    Effect.mapError(
      () =>
        new SendUnsubscribeConfigurationError({
          message:
            "Unsubscribe requires an HTTPS endpoint, installation audience, and a secret of at least 32 characters",
        }),
    ),
  );
  const send = yield* KrakSend;
  const mac = yield* Mac.Mac;
  const key = yield* Mac.key(
    Mac.hmacSha256,
    new TextEncoder().encode(Redacted.value(options.secret)),
  ).pipe(Effect.mapError(cryptoError));

  const createLink = Effect.fn("SendUnsubscribe.createLink")(function* (
    input: typeof ContactParams.Type,
  ) {
    const contact = yield* send.getContact(input);
    const now = yield* DateTime.nowAsDate;
    const json = yield* Schema.encodeEffect(ClaimsJson)({
      version: 1,
      purpose: "kraksend-contact-email-unsubscribe",
      audience: options.audience,
      contactId: contact.id,
      expiresAt:
        now.getTime() + (options.tokenTtlMillis ?? 180 * 24 * 60 * 60 * 1000),
    }).pipe(Effect.mapError(cryptoError));
    const body = Base64Url.encode(json);
    const signature = yield* mac
      .sign(key, new TextEncoder().encode(body))
      .pipe(Effect.mapError(cryptoError));
    const url = new URL(options.endpoint);
    url.searchParams.set("token", `${body}.${Base64Url.encode(signature)}`);
    return yield* Schema.decodeEffect(EmailUnsubscribeUrl)(url.toString()).pipe(
      Effect.mapError(
        () =>
          new SendUnsubscribeConfigurationError({
            message: "Unsubscribe URL exceeds the supported length",
          }),
      ),
    );
  });

  const verify = Effect.fnUntraced(function* (
    rawInput: SendUnsubscribeTokenInput,
  ) {
    const input = yield* Schema.decodeEffect(SendUnsubscribeTokenInput)(
      rawInput,
    ).pipe(Effect.mapError(invalidToken));
    const [body, encodedSignature] = input.token.split(".");
    const signature = yield* Effect.fromResult(
      Base64Url.decode(encodedSignature),
    ).pipe(Effect.mapError(invalidToken));
    const valid = yield* mac
      .verify(key, signature, new TextEncoder().encode(body))
      .pipe(Effect.mapError(cryptoError));
    if (!valid) return yield* invalidToken();
    const json = yield* Effect.fromResult(Base64Url.decodeString(body)).pipe(
      Effect.mapError(invalidToken),
    );
    const claims = yield* Schema.decodeEffect(ClaimsJson)(json).pipe(
      Effect.mapError(invalidToken),
    );
    const now = yield* DateTime.nowAsDate;
    if (
      claims.audience !== options.audience ||
      claims.expiresAt <= now.getTime()
    )
      return yield* invalidToken();
    return { id: claims.contactId };
  });
  const validateToken = Effect.fn("SendUnsubscribe.validateToken")(
    (input: SendUnsubscribeTokenInput) => verify(input).pipe(Effect.asVoid),
  );
  const unsubscribe = Effect.fn("SendUnsubscribe.unsubscribe")(function* (
    input: SendUnsubscribeTokenInput,
  ) {
    const contact = yield* verify(input);
    yield* send
      .withdrawEmailConsent(contact)
      .pipe(Effect.catchTag("SendNotFound", invalidToken));
  });
  return { createLink, validateToken, unsubscribe };
});

export class SendUnsubscribe extends Context.Service<
  SendUnsubscribe,
  Effect.Success<ReturnType<typeof makeUnsubscribe>>
>()("@krak-stack/send/SendUnsubscribe") {
  static readonly makeLayer = (options: SendUnsubscribeOptions) =>
    Layer.effect(this, makeUnsubscribe(options)).pipe(
      Layer.provide(
        Mac.layerWebCrypto.pipe(Layer.provide(SecureRandom.layerWebCrypto)),
      ),
    );
}
