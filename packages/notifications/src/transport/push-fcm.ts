import {
  Clock,
  Config,
  Context,
  Effect,
  Layer,
  Redacted,
  Ref,
  Schema,
  Semaphore,
} from "effect";
import { KeyFormat, SecureRandom, Signature } from "effect/crypto";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/http";
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

const OAuthToken = Schema.Struct({
  access_token: Schema.NonEmptyString,
  expires_in: Schema.Int.check(Schema.isGreaterThan(60)),
}).annotate({ identifier: "FcmOAuthToken" });
const FcmResponse = Schema.Struct({ name: Schema.NonEmptyString }).annotate({
  identifier: "FcmResponse",
});
const FcmError = Schema.Struct({
  error: Schema.Struct({
    status: Schema.optional(Schema.String),
    details: Schema.optional(
      Schema.Array(
        Schema.Struct({ errorCode: Schema.optional(Schema.String) }),
      ),
    ),
  }),
}).annotate({ identifier: "FcmError" });

export const classifyFcmFailure = (
  status: number,
  code: string,
  retryAfter?: Date,
): NotificationTransportFailure => {
  if (code === "UNREGISTERED")
    return new NotificationTransportPermanent({
      channel: "push",
      message: "FCM: UNREGISTERED",
      invalidRecipient: true,
    });
  if (status === 401 || status === 403)
    return new NotificationTransportUnavailable({
      channel: "push",
      message: `FCM: ${code}`,
    });
  if (status === 429 || status >= 500)
    return new NotificationTransportRetryable({
      channel: "push",
      message: `FCM: ${code}`,
      retryAfter,
    });
  return new NotificationTransportPermanent({
    channel: "push",
    message: `FCM: ${code}`,
  });
};

const make = Effect.gen(function* () {
  const signature = yield* Signature.Signature;
  const config = yield* Effect.gen(function* () {
    return {
      projectId: yield* Config.NonEmptyString("FCM_PROJECT_ID"),
      email: yield* Config.NonEmptyString("FCM_CLIENT_EMAIL"),
      key: yield* Config.Redacted("FCM_PRIVATE_KEY"),
    };
  }).pipe(
    Effect.mapError(
      () =>
        new NotificationTransportUnavailable({
          channel: "push",
          message: "FCM configuration is unavailable",
        }),
    ),
  );
  const key = yield* KeyFormat.decodePrivate(
    KeyFormat.pem(KeyFormat.pkcs8),
    Signature.rsaPkcs1v15Sha256,
    Redacted.value(config.key).replaceAll("\\n", "\n"),
  ).pipe(
    Effect.mapError(
      () =>
        new NotificationTransportUnavailable({
          channel: "push",
          message: "FCM signing key is invalid",
        }),
    ),
  );
  const client = yield* HttpClient.HttpClient;
  const cached = yield* Ref.make<{ token: string; expiresAt: number } | null>(
    null,
  );
  const refreshLock = yield* Semaphore.make(1);
  const accessToken = Effect.gen(function* () {
    const now = yield* Clock.currentTimeMillis;
    const current = yield* Ref.get(cached);
    if (current !== null && current.expiresAt > now) return current.token;
    const assertion = yield* signJwt(
      signature,
      key,
      { alg: "RS256", typ: "JWT" },
      {
        iss: config.email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: Math.floor(now / 1000),
        exp: Math.floor(now / 1000) + 3600,
      },
    );
    const response = yield* client.execute(
      HttpClientRequest.post("https://oauth2.googleapis.com/token").pipe(
        HttpClientRequest.bodyUrlParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion,
        }),
      ),
    );
    if (response.status !== 200)
      return yield* new NotificationTransportUnavailable({
        channel: "push",
        message: "FCM authentication was rejected",
      });
    const token =
      yield* HttpClientResponse.schemaBodyJson(OAuthToken)(response);
    yield* Ref.set(cached, {
      token: token.access_token,
      expiresAt: now + (token.expires_in - 60) * 1000,
    });
    return token.access_token;
  }).pipe(
    (effect) => refreshLock.withPermit(effect),
    Effect.timeout("15 seconds"),
    Effect.mapError(
      () =>
        new NotificationTransportUnavailable({
          channel: "push",
          message: "FCM authentication failed or timed out",
        }),
    ),
  );
  return {
    channel: "push",
    send: Effect.fn("FcmPushTransport.send")(function* (input) {
      const payload = yield* decodePushInput(input);
      if (payload.provider !== "fcm")
        return yield* new NotificationTransportPermanent({
          channel: "push",
          message: "FCM requires an FCM payload",
        });
      const token = yield* accessToken;
      return yield* Effect.gen(function* () {
        const request = yield* HttpClientRequest.post(
          `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/messages:send`,
        ).pipe(
          HttpClientRequest.bearerToken(token),
          HttpClientRequest.bodyJson({
            message: {
              token: input.recipientAddress,
              notification: { title: payload.title, body: payload.body },
              data: payload.data,
              android: {
                priority: "high",
                notification:
                  payload.androidChannelId === undefined
                    ? undefined
                    : { channel_id: payload.androidChannelId },
              },
            },
          }),
        );
        const result = yield* client.execute(request);
        if (result.status < 200 || result.status >= 300) {
          if (result.status === 401) yield* Ref.set(cached, null);
          const failure = yield* HttpClientResponse.schemaBodyJson(FcmError)(
            result,
          ).pipe(
            Effect.orElseSucceed(() => ({
              error: { status: "Rejected", details: undefined },
            })),
          );
          const code =
            failure.error.details?.find((detail) => detail.errorCode)
              ?.errorCode ??
            failure.error.status ??
            "Rejected";
          return yield* classifyFcmFailure(
            result.status,
            code,
            yield* pushRetryAfter(
              result.headers["retry-after"],
              result.status === 429 ? 60_000 : 0,
            ),
          );
        }
        const response =
          yield* HttpClientResponse.schemaBodyJson(FcmResponse)(result);
        return { provider: "fcm", providerMessageId: response.name };
      }).pipe(
        Effect.timeout("15 seconds"),
        Effect.mapError((error) =>
          error instanceof NotificationTransportPermanent ||
          error instanceof NotificationTransportUnavailable ||
          error instanceof NotificationTransportRetryable
            ? error
            : new NotificationTransportRetryable({
                channel: "push",
                message: "FCM request or response failed",
              }),
        ),
      );
    }),
  } satisfies NotificationTransport;
});

export class FcmPushTransport extends Context.Service<
  FcmPushTransport,
  NotificationTransport
>()("@krak-stack/notifications/transport/FcmPushTransport") {
  static readonly layerWithClient = Layer.effect(this, make).pipe(
    Layer.provide(
      Signature.layerWebCrypto.pipe(Layer.provide(SecureRandom.layerWebCrypto)),
    ),
  );
  static readonly layer = this.layerWithClient.pipe(
    Layer.provide(FetchHttpClient.layer),
  );
}
