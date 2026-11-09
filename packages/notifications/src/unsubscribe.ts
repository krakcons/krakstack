import { Context, DateTime, Effect, Layer, Redacted, Schema } from "effect";
import { Mac, SecureRandom } from "effect/crypto";
import { Base64Url } from "effect/encoding";

import { NotificationService } from "./index.js";
import {
  EmailSubscriptionInput,
  EmailUnsubscribeConfigurationError,
  EmailUnsubscribeCryptoError,
  EmailUnsubscribeOptions,
  EmailUnsubscribeTokenClaims,
  EmailUnsubscribeTokenError,
  EmailUnsubscribeTokenInput,
  EmailUnsubscribeUrl,
  type EmailSubscriptionInput as EmailSubscriptionInputType,
  type EmailUnsubscribeOptions as EmailUnsubscribeOptionsType,
  type EmailUnsubscribeTokenInput as EmailUnsubscribeTokenInputType,
} from "./schema.js";
import { decodeInput } from "./internal/sql.js";

const ClaimsJson = Schema.fromJsonString(EmailUnsubscribeTokenClaims);
const invalidToken = () =>
  new EmailUnsubscribeTokenError({
    message: "Invalid or expired unsubscribe link",
  });
const cryptoError = () =>
  new EmailUnsubscribeCryptoError({
    message: "Unsubscribe token cryptography failed",
  });

const makeEmailUnsubscribe = Effect.fnUntraced(function* (
  rawOptions: EmailUnsubscribeOptionsType,
) {
  const options = yield* Schema.decodeEffect(EmailUnsubscribeOptions)(
    rawOptions,
  ).pipe(
    Effect.mapError(
      () =>
        new EmailUnsubscribeConfigurationError({
          message:
            "Unsubscribe requires an HTTPS endpoint, audience, and a secret of at least 32 characters",
        }),
    ),
  );
  const notifications = yield* NotificationService;
  const mac = yield* Mac.Mac;
  const key = yield* Mac.key(
    Mac.hmacSha256,
    new TextEncoder().encode(Redacted.value(options.secret)),
  ).pipe(Effect.mapError(cryptoError));

  const createLink = Effect.fn("EmailUnsubscribe.createLink")(function* (
    rawInput: EmailSubscriptionInputType,
  ) {
    const input = yield* decodeInput(
      "createUnsubscribeLink",
      EmailSubscriptionInput,
      rawInput,
    );
    const now = yield* DateTime.nowAsDate;
    const claims = yield* Schema.encodeEffect(ClaimsJson)({
      version: 1,
      purpose: "email-unsubscribe",
      audience: options.audience,
      recipientUserId: input.recipientUserId,
      expiresAt:
        now.getTime() + (options.tokenTtlMillis ?? 180 * 24 * 60 * 60 * 1000),
    }).pipe(Effect.mapError(cryptoError));
    const body = Base64Url.encode(claims);
    const signature = yield* mac
      .sign(key, new TextEncoder().encode(body))
      .pipe(Effect.mapError(cryptoError));
    const url = new URL(options.endpoint);
    url.searchParams.set("token", `${body}.${Base64Url.encode(signature)}`);
    return yield* Schema.decodeEffect(EmailUnsubscribeUrl)(url.toString()).pipe(
      Effect.mapError(
        () =>
          new EmailUnsubscribeConfigurationError({
            message: "Unsubscribe URL exceeds the supported length",
          }),
      ),
    );
  });

  const verify = Effect.fnUntraced(function* (
    rawInput: EmailUnsubscribeTokenInputType,
  ) {
    const input = yield* Schema.decodeEffect(EmailUnsubscribeTokenInput)(
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
    ) {
      return yield* invalidToken();
    }
    return { recipientUserId: claims.recipientUserId };
  });

  const validateToken = Effect.fn("EmailUnsubscribe.validateToken")(
    (input: EmailUnsubscribeTokenInputType) =>
      verify(input).pipe(Effect.asVoid),
  );
  const unsubscribe = Effect.fn("EmailUnsubscribe.unsubscribe")(function* (
    input: EmailUnsubscribeTokenInputType,
  ) {
    const recipient = yield* verify(input);
    yield* notifications.unsubscribeEmail(recipient);
  });

  return { createLink, validateToken, unsubscribe };
});

export class EmailUnsubscribe extends Context.Service<
  EmailUnsubscribe,
  Effect.Success<ReturnType<typeof makeEmailUnsubscribe>>
>()("@krak-stack/notifications/EmailUnsubscribe") {
  static readonly makeLayer = (options: EmailUnsubscribeOptionsType) =>
    Layer.effect(this, makeEmailUnsubscribe(options)).pipe(
      Layer.provide(
        Mac.layerWebCrypto.pipe(Layer.provide(SecureRandom.layerWebCrypto)),
      ),
    );
}

export {
  EmailUnsubscribeConfigurationError,
  EmailUnsubscribeCryptoError,
  EmailUnsubscribeOptions,
  EmailUnsubscribePost,
  EmailUnsubscribeTokenError,
  EmailUnsubscribeTokenInput,
} from "./schema.js";
