import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Schema } from "effect";
import { KeyFormat, SecureRandom, Signature } from "effect/crypto";
import { HttpClient, HttpClientResponse } from "effect/http";
import * as TestClock from "effect/testing/TestClock";
import {
  NotificationTransportPermanent,
  NotificationTransportRetryable,
  NotificationTransportUnavailable,
  type NotificationTransportInput,
} from "../src/transport.js";
import { makePushTransport } from "../src/transport/push.js";
import {
  ApnsPushTransport,
  classifyApnsFailure,
} from "../src/transport/push-apns.js";
import {
  FcmPushTransport,
  classifyFcmFailure,
} from "../src/transport/push-fcm.js";

const apnsPayload = {
  provider: "apns",
  title: "Title",
  body: "Body",
  data: { url: "/news/1" },
};

const input: NotificationTransportInput = {
  dispatchId: "dispatch-1",
  deliveryId: null,
  attempt: 1,
  scope: { recipientUserId: null, organizationId: null, workspaceId: null },
  eventKey: "test.push",
  eventVersion: 1,
  channel: "push",
  template: null,
  recipientAddress: "token",
  recipientName: null,
  payloadVersion: 1,
  payload: apnsPayload,
};

describe("push transport", () => {
  it.effect(
    "sends APNs alert payloads with bearer authentication and provider acceptance IDs",
    () =>
      Effect.gen(function* () {
        const signatures = yield* Signature.Signature;
        const keys = yield* signatures.generateKeyPair(Signature.ecdsaP256);
        const pem = yield* KeyFormat.encode(
          KeyFormat.pem(KeyFormat.pkcs8),
          keys.privateKey,
        );
        let requests = 0;
        let status = 200;
        const client = HttpClient.make((request) =>
          Effect.gen(function* () {
            requests++;
            expect(request.url).toBe(
              `https://api.sandbox.push.apple.com/3/device/${"a".repeat(64)}`,
            );
            expect(request.headers.authorization).toMatch(
              /^Bearer [^.]+\.[^.]+\.[^.]+$/i,
            );
            expect(request.headers["apns-topic"]).toBe("ca.example.app");
            expect(request.headers["apns-push-type"]).toBe("alert");
            if (status !== 200)
              return HttpClientResponse.fromWeb(
                request,
                new Response("upstream error", {
                  status,
                  headers: { "retry-after": "120" },
                }),
              );
            expect(request.body._tag).toBe("Uint8Array");
            if (request.body._tag === "Uint8Array") {
              const body = yield* Schema.decodeEffect(
                Schema.fromJsonString(Schema.Json),
              )(new TextDecoder().decode(request.body.body)).pipe(Effect.orDie);
              expect(body).toMatchObject({
                aps: { alert: { title: "Title", body: "Body" } },
                url: "/news/1",
              });
            }
            return HttpClientResponse.fromWeb(
              request,
              new Response(null, {
                status: 200,
                headers: { "apns-id": "apple-1" },
              }),
            );
          }),
        );
        const result = yield* Effect.gen(function* () {
          const transport = yield* ApnsPushTransport;
          const dispatch = {
            ...input,
            recipientAddress: "a".repeat(64),
          };
          const result = yield* transport.send(dispatch);
          status = 503;
          const outage = yield* transport.send(dispatch).pipe(Effect.flip);
          expect(outage).toBeInstanceOf(NotificationTransportRetryable);
          expect(outage).toHaveProperty("retryAfter", new Date(120_000));
          status = 403;
          expect(
            yield* transport.send(dispatch).pipe(Effect.flip),
          ).toBeInstanceOf(NotificationTransportUnavailable);
          status = 413;
          expect(
            yield* transport.send(dispatch).pipe(Effect.flip),
          ).toBeInstanceOf(NotificationTransportPermanent);
          const oversized = yield* transport
            .send({
              ...dispatch,
              payload: {
                ...apnsPayload,
                body: "é".repeat(4096),
              },
            })
            .pipe(Effect.flip);
          expect(oversized).toBeInstanceOf(NotificationTransportPermanent);
          return result;
        }).pipe(
          Effect.provide(
            ApnsPushTransport.layerWithClient.pipe(
              Layer.provide(
                Layer.merge(
                  Layer.succeed(HttpClient.HttpClient, client),
                  ConfigProvider.layer(
                    ConfigProvider.fromUnknown({
                      APNS_TEAM_ID: "team",
                      APNS_KEY_ID: "key",
                      APNS_TOPIC: "ca.example.app",
                      APNS_PRIVATE_KEY: pem,
                      APNS_SANDBOX: "true",
                    }),
                  ),
                ),
              ),
            ),
          ),
        );
        expect(result).toEqual({
          provider: "apns",
          providerMessageId: "apple-1",
        });
        expect(requests).toBe(4);
      }).pipe(
        Effect.provide(
          Signature.layerWebCrypto.pipe(
            Layer.provide(SecureRandom.layerWebCrypto),
          ),
        ),
      ),
  );

  it.effect(
    "shares FCM OAuth refreshes, renews rejected credentials, and preserves provider backoff",
    () =>
      Effect.gen(function* () {
        const signatures = yield* Signature.Signature;
        const keys = yield* signatures.generateKeyPair(
          Signature.rsaPkcs1v15Sha256,
        );
        const pem = yield* KeyFormat.encode(
          KeyFormat.pem(KeyFormat.pkcs8),
          keys.privateKey,
        );
        let exchanges = 0;
        let sends = 0;
        let status = 200;
        const client = HttpClient.make((request) =>
          Effect.gen(function* () {
            if (request.url === "https://oauth2.googleapis.com/token") {
              exchanges++;
              return HttpClientResponse.fromWeb(
                request,
                Response.json({
                  access_token: "access-token",
                  expires_in: 3600,
                }),
              );
            }
            sends++;
            expect(request.url).toBe(
              "https://fcm.googleapis.com/v1/projects/project/messages:send",
            );
            expect(request.headers.authorization).toBe("Bearer access-token");
            if (status !== 200)
              return HttpClientResponse.fromWeb(
                request,
                new Response("upstream error", { status }),
              );
            if (request.body._tag === "Uint8Array") {
              const body = yield* Schema.decodeEffect(
                Schema.fromJsonString(Schema.Json),
              )(new TextDecoder().decode(request.body.body)).pipe(Effect.orDie);
              expect(body).toMatchObject({
                message: {
                  token: "token",
                  notification: { title: "Title", body: "Body" },
                  android: { notification: { channel_id: "updates" } },
                },
              });
            }
            return HttpClientResponse.fromWeb(
              request,
              Response.json({ name: "projects/project/messages/google-1" }),
            );
          }),
        );
        yield* Effect.gen(function* () {
          const transport = yield* FcmPushTransport;
          const payload = {
            ...apnsPayload,
            provider: "fcm",
            androidChannelId: "updates",
          };
          const first = yield* Effect.all(
            [
              transport.send({ ...input, payload }),
              transport.send({ ...input, payload }),
            ],
            { concurrency: "unbounded" },
          );
          expect(first[0].providerMessageId).toBe(
            "projects/project/messages/google-1",
          );
          expect(exchanges).toBe(1);
          yield* transport.send({ ...input, payload });
          status = 401;
          expect(
            yield* transport.send({ ...input, payload }).pipe(Effect.flip),
          ).toBeInstanceOf(NotificationTransportUnavailable);
          status = 200;
          yield* transport.send({ ...input, payload });
          expect(exchanges).toBe(2);
          status = 429;
          const quota = yield* transport
            .send({ ...input, payload })
            .pipe(Effect.flip);
          expect(quota).toBeInstanceOf(NotificationTransportRetryable);
          expect(quota).toHaveProperty("retryAfter", new Date(60_000));
          yield* TestClock.adjust("59 minutes");
          status = 200;
          yield* transport.send({ ...input, payload });
        }).pipe(
          Effect.provide(
            FcmPushTransport.layerWithClient.pipe(
              Layer.provide(
                Layer.merge(
                  Layer.succeed(HttpClient.HttpClient, client),
                  ConfigProvider.layer(
                    ConfigProvider.fromUnknown({
                      FCM_PROJECT_ID: "project",
                      FCM_CLIENT_EMAIL: "service@example.com",
                      FCM_PRIVATE_KEY: pem,
                    }),
                  ),
                ),
              ),
            ),
          ),
        );
        expect(exchanges).toBe(3);
        expect(sends).toBe(7);
      }).pipe(
        Effect.provide(
          Signature.layerWebCrypto.pipe(
            Layer.provide(SecureRandom.layerWebCrypto),
          ),
        ),
      ),
  );

  it.effect("routes a logical push channel to the selected provider", () =>
    Effect.gen(function* () {
      const transport = makePushTransport({
        apns: {
          channel: "push",
          send: () =>
            Effect.succeed({ provider: "apns", providerMessageId: "apple-1" }),
        },
        fcm: {
          channel: "push",
          send: () =>
            Effect.succeed({ provider: "fcm", providerMessageId: "google-1" }),
        },
      });
      expect((yield* transport.send(input)).provider).toBe("apns");
      expect(
        (yield* transport.send({
          ...input,
          payload: {
            ...apnsPayload,
            provider: "fcm",
          },
        })).provider,
      ).toBe("fcm");
      expect(
        yield* transport
          .send({ ...input, payloadVersion: 2 })
          .pipe(Effect.flip),
      ).toBeInstanceOf(NotificationTransportPermanent);
      expect(
        yield* transport
          .send({ ...input, payload: { provider: "expo" } })
          .pipe(Effect.flip),
      ).toBeInstanceOf(NotificationTransportPermanent);
    }),
  );

  it("marks only explicit invalid-recipient failures for token cleanup", () => {
    for (const failure of [
      classifyApnsFailure(410, "Unregistered"),
      classifyApnsFailure(400, "BadDeviceToken"),
      classifyFcmFailure(404, "UNREGISTERED"),
    ]) {
      expect(failure).toBeInstanceOf(NotificationTransportPermanent);
      expect(failure).toHaveProperty("invalidRecipient", true);
    }
    expect(classifyFcmFailure(400, "INVALID_ARGUMENT")).not.toHaveProperty(
      "invalidRecipient",
      true,
    );
    expect(classifyApnsFailure(400, "DeviceTokenNotForTopic")).toBeInstanceOf(
      NotificationTransportUnavailable,
    );
  });

  it("retries provider outages and distinguishes configuration failures", () => {
    expect(classifyApnsFailure(429, "TooManyRequests")).toBeInstanceOf(
      NotificationTransportRetryable,
    );
    expect(classifyFcmFailure(503, "UNAVAILABLE")).toBeInstanceOf(
      NotificationTransportRetryable,
    );
    expect(classifyApnsFailure(403, "InvalidProviderToken")).toBeInstanceOf(
      NotificationTransportUnavailable,
    );
    expect(classifyFcmFailure(403, "SENDER_ID_MISMATCH")).toBeInstanceOf(
      NotificationTransportUnavailable,
    );
  });
});
