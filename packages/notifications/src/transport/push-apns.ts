import {
  Clock,
  Config,
  Context,
  Effect,
  Layer,
  Redacted,
  Schema,
} from "effect";
import { KeyFormat, SecureRandom, Signature } from "effect/crypto";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http";
import {
  NotificationTransportPermanent,
  NotificationTransportRetryable,
  NotificationTransportUnavailable,
  type NotificationTransport,
  type NotificationTransportFailure,
} from "../transport.js";
import { decodePushInput } from "./push.js";
import { signJwt } from "./internal/push-jwt.js";
import { pushRetryAfter } from "./internal/push-retry.js";

const ApnsResponse = Schema.Struct({
  reason: Schema.optional(Schema.String),
}).annotate({ identifier: "ApnsResponse" });

export const classifyApnsFailure = (
  status: number,
  reason: string,
  retryAfter?: Date,
): NotificationTransportFailure => {
  if (["BadDeviceToken", "Unregistered"].includes(reason)) {
    return new NotificationTransportPermanent({
      channel: "push",
      message: `APNs: ${reason}`,
      invalidRecipient: true,
    });
  }
  if (status === 401 || status === 403 || reason === "DeviceTokenNotForTopic")
    return new NotificationTransportUnavailable({
      channel: "push",
      message: `APNs: ${reason}`,
    });
  if (status === 429 || status >= 500)
    return new NotificationTransportRetryable({
      channel: "push",
      message: `APNs: ${reason}`,
      retryAfter,
    });
  return new NotificationTransportPermanent({
    channel: "push",
    message: `APNs: ${reason}`,
  });
};

const make = Effect.gen(function* () {
  const signature = yield* Signature.Signature;
  const config = yield* Effect.gen(function* () {
    return {
      teamId: yield* Config.NonEmptyString("APNS_TEAM_ID"),
      keyId: yield* Config.NonEmptyString("APNS_KEY_ID"),
      topic: yield* Config.NonEmptyString("APNS_TOPIC"),
      key: yield* Config.Redacted("APNS_PRIVATE_KEY"),
      sandbox: yield* Config.Boolean("APNS_SANDBOX").pipe(
        Config.withDefault(false),
      ),
    };
  }).pipe(
    Effect.mapError(
      () =>
        new NotificationTransportUnavailable({
          channel: "push",
          message: "APNs configuration is unavailable",
        }),
    ),
  );
  const key = yield* KeyFormat.decodePrivate(
    KeyFormat.pem(KeyFormat.pkcs8),
    Signature.ecdsaP256,
    Redacted.value(config.key).replaceAll("\\n", "\n"),
  ).pipe(
    Effect.mapError(
      () =>
        new NotificationTransportUnavailable({
          channel: "push",
          message: "APNs signing key is invalid",
        }),
    ),
  );
  const client = yield* HttpClient.HttpClient;
  const jwt = yield* Effect.gen(function* () {
    const now = yield* Clock.currentTimeMillis;
    return yield* signJwt(
      signature,
      key,
      { alg: "ES256", kid: config.keyId },
      { iss: config.teamId, iat: Math.floor(now / 1000) },
    );
  }).pipe(
    Effect.mapError(
      () =>
        new NotificationTransportUnavailable({
          channel: "push",
          message: "APNs signing failed",
        }),
    ),
    Effect.cachedWithTTL("50 minutes"),
  );
  return {
    channel: "push",
    send: Effect.fn("ApnsPushTransport.send")(function* (input) {
      const payload = yield* decodePushInput(input);
      if (payload.provider !== "apns")
        return yield* new NotificationTransportPermanent({
          channel: "push",
          message: "APNs requires an APNs payload",
        });
      const token = yield* Schema.decodeEffect(
        Schema.String.check(Schema.isPattern(/^[a-fA-F0-9]{64,200}$/)),
      )(input.recipientAddress).pipe(
        Effect.mapError(
          () =>
            new NotificationTransportPermanent({
              channel: "push",
              message: "Invalid APNs token",
              invalidRecipient: true,
            }),
        ),
      );
      const body = yield* Schema.encodeEffect(
        Schema.fromJsonString(Schema.Json),
      )({
        ...payload.data,
        aps: {
          alert: { title: payload.title, body: payload.body },
          sound: "default",
        },
      }).pipe(
        Effect.mapError(
          () =>
            new NotificationTransportPermanent({
              channel: "push",
              message: "Invalid APNs payload",
            }),
        ),
      );
      if (new TextEncoder().encode(body).length > 4096)
        return yield* new NotificationTransportPermanent({
          channel: "push",
          message: "APNs payload exceeds 4096 bytes",
        });
      const authorization = yield* jwt;
      return yield* Effect.gen(function* () {
        const host = config.sandbox
          ? "https://api.sandbox.push.apple.com"
          : "https://api.push.apple.com";
        const result = yield* client.execute(
          HttpClientRequest.post(`${host}/3/device/${token}`).pipe(
            HttpClientRequest.bearerToken(authorization),
            HttpClientRequest.setHeaders({
              "apns-topic": config.topic,
              "apns-push-type": "alert",
              "apns-priority": "10",
            }),
            HttpClientRequest.bodyText(body, "application/json"),
          ),
        );
        if (result.status !== 200) {
          const failure = yield* HttpClientResponse.schemaBodyJson(
            ApnsResponse,
          )(result).pipe(Effect.orElseSucceed(() => ({ reason: "Rejected" })));
          return yield* classifyApnsFailure(
            result.status,
            failure.reason ?? "Rejected",
            yield* pushRetryAfter(result.headers["retry-after"]),
          );
        }
        return {
          provider: "apns",
          providerMessageId: result.headers["apns-id"] ?? null,
        };
      }).pipe(
        Effect.timeout("15 seconds"),
        Effect.mapError((error) =>
          error instanceof NotificationTransportPermanent ||
          error instanceof NotificationTransportUnavailable ||
          error instanceof NotificationTransportRetryable
            ? error
            : new NotificationTransportRetryable({
                channel: "push",
                message: "APNs request or response failed",
              }),
        ),
      );
    }),
  } satisfies NotificationTransport;
});

export class ApnsPushTransport extends Context.Service<
  ApnsPushTransport,
  NotificationTransport
>()("@krak-stack/notifications/transport/ApnsPushTransport") {
  static readonly layerWithClient = Layer.effect(this, make).pipe(
    Layer.provide(
      Signature.layerWebCrypto.pipe(Layer.provide(SecureRandom.layerWebCrypto)),
    ),
  );
  // APNs is HTTP/2-only. Effect owns the pooled dispatcher and scoped shutdown.
  static readonly layer = Layer.unwrap(
    Effect.tryPromise({
      try: () => import("@effect/platform-node/NodeHttpClient"),
      catch: () =>
        new NotificationTransportUnavailable({
          channel: "push",
          message:
            "Install @effect/platform-node for the default APNs client, or use layerWithClient with an HTTP/2 client",
        }),
    }).pipe(
      Effect.map((client) =>
        this.layerWithClient.pipe(
          Layer.provide(client.layerUndiciOptions({ allowH2: true })),
        ),
      ),
    ),
  );
}
