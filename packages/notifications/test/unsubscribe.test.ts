import { describe, expect, it } from "@effect/vitest";
import { DateTime, Effect, Layer, Redacted, Schema } from "effect";
import { Mac, SecureRandom } from "effect/crypto";
import { Base64Url } from "effect/encoding";
import * as TestClock from "effect/testing/TestClock";

import {
  EmailUnsubscribe,
  type EmailUnsubscribeOptions,
} from "../src/unsubscribe.js";
import { makeUnsubscribeTestService } from "./fixtures/unsubscribe-service.js";

const secret = "a-test-secret-with-at-least-32-characters";
const options: EmailUnsubscribeOptions = {
  secret: Redacted.make(secret),
  audience: "test-app",
  endpoint: "https://app.example.com/notifications/unsubscribe?locale=fr",
  tokenTtlMillis: 60_000,
};

const tokenFromLink = (link: string) =>
  new URL(link).searchParams.get("token") ?? "";

const signClaims = Effect.fnUntraced(
  function* (claims: Schema.Json) {
    const body = Base64Url.encode(
      yield* Schema.encodeEffect(Schema.fromJsonString(Schema.Json))(claims),
    );
    const key = yield* Mac.key(
      Mac.hmacSha256,
      new TextEncoder().encode(secret),
    );
    const mac = yield* Mac.Mac;
    const signature = yield* mac.sign(key, new TextEncoder().encode(body));
    return `${body}.${Base64Url.encode(signature)}`;
  },
  Effect.provide(
    Mac.layerWebCrypto.pipe(Layer.provide(SecureRandom.layerWebCrypto)),
  ),
);

describe("email unsubscribe links", () => {
  it.effect(
    "validates without mutating and unsubscribes only the signed account",
    () => {
      const fixture = makeUnsubscribeTestService();
      return Effect.gen(function* () {
        const unsubscribe = yield* EmailUnsubscribe;
        const link = yield* unsubscribe.createLink({
          recipientUserId: "user-1",
        });
        expect(new URL(link).searchParams.get("locale")).toBe("fr");
        const token = tokenFromLink(link);
        yield* unsubscribe.validateToken({ token });
        expect(fixture.recipients).toEqual([]);
        yield* unsubscribe.unsubscribe({ token });
        yield* unsubscribe.unsubscribe({ token });
        expect(fixture.recipients).toEqual(["user-1", "user-1"]);
      }).pipe(
        Effect.provide(
          EmailUnsubscribe.makeLayer(options).pipe(
            Layer.provide(fixture.layer),
          ),
        ),
      );
    },
  );

  it.effect(
    "rejects malformed, tampered, wrong-purpose, wrong-version and cross-app tokens without writes",
    () => {
      const fixture = makeUnsubscribeTestService();
      return Effect.gen(function* () {
        const unsubscribe = yield* EmailUnsubscribe;
        const link = yield* unsubscribe.createLink({
          recipientUserId: "user-1",
        });
        const token = tokenFromLink(link);
        const [body, signature] = token.split(".");
        const claims = {
          version: 1,
          purpose: "email-unsubscribe",
          audience: "test-app",
          recipientUserId: "user-1",
          expiresAt: (yield* DateTime.nowAsDate).getTime() + 60_000,
        };
        const wrongUserBody = Base64Url.encode(
          yield* Schema.encodeEffect(Schema.fromJsonString(Schema.Json))({
            ...claims,
            recipientUserId: "victim",
          }),
        );
        for (const invalid of [
          "",
          "not.a.token",
          `${body}.${signature.startsWith("A") ? "B" : "A"}${signature.slice(1)}`,
          `${wrongUserBody}.${signature}`,
          yield* signClaims({ ...claims, version: 2 }),
          yield* signClaims({ ...claims, purpose: "password-reset" }),
          yield* signClaims({ ...claims, audience: "other-app" }),
        ]) {
          const result = yield* unsubscribe
            .unsubscribe({ token: invalid })
            .pipe(Effect.flip);
          expect(result._tag).toBe("EmailUnsubscribeTokenError");
          expect(JSON.stringify(result)).not.toContain(
            invalid || "not.a.token",
          );
        }
        expect(fixture.recipients).toEqual([]);
      }).pipe(
        Effect.provide(
          EmailUnsubscribe.makeLayer(options).pipe(
            Layer.provide(fixture.layer),
          ),
        ),
      );
    },
  );

  it.effect("rejects expired tokens at the expiry instant", () => {
    const fixture = makeUnsubscribeTestService();
    return Effect.gen(function* () {
      const unsubscribe = yield* EmailUnsubscribe;
      const token = tokenFromLink(
        yield* unsubscribe.createLink({ recipientUserId: "user-1" }),
      );
      yield* TestClock.adjust(60_000);
      const error = yield* unsubscribe.unsubscribe({ token }).pipe(Effect.flip);
      expect(error._tag).toBe("EmailUnsubscribeTokenError");
      expect(fixture.recipients).toEqual([]);
    }).pipe(
      Effect.provide(
        EmailUnsubscribe.makeLayer(options).pipe(Layer.provide(fixture.layer)),
      ),
    );
  });

  it.effect("rejects a token signed by a different key", () => {
    const fixture = makeUnsubscribeTestService();
    const layerFor = (configuration: EmailUnsubscribeOptions) =>
      EmailUnsubscribe.makeLayer(configuration).pipe(
        Layer.provide(fixture.layer),
      );
    return Effect.gen(function* () {
      const link = yield* EmailUnsubscribe.use((module) =>
        module.createLink({ recipientUserId: "user-1" }),
      ).pipe(Effect.provide(layerFor(options)));
      const error = yield* EmailUnsubscribe.use((module) =>
        module.unsubscribe({ token: tokenFromLink(link) }),
      ).pipe(
        Effect.provide(
          layerFor({
            ...options,
            secret: Redacted.make(
              "a-different-secret-with-at-least-32-characters",
            ),
          }),
        ),
        Effect.flip,
      );
      expect(error._tag).toBe("EmailUnsubscribeTokenError");
      expect(fixture.recipients).toEqual([]);
    });
  });

  it.effect(
    "fails layer acquisition for unsafe endpoints and weak secrets",
    () => {
      const fixture = makeUnsubscribeTestService();
      return Effect.gen(function* () {
        for (const configuration of [
          { ...options, endpoint: "http://app.example.com/unsubscribe" },
          {
            ...options,
            endpoint: "https://user:password@app.example.com/unsubscribe",
          },
          {
            ...options,
            endpoint: "https://app.example.com/unsubscribe#fragment",
          },
          { ...options, secret: Redacted.make("short") },
          { ...options, tokenTtlMillis: 0 },
        ]) {
          const error = yield* EmailUnsubscribe.use(() => Effect.void).pipe(
            Effect.provide(
              EmailUnsubscribe.makeLayer(configuration).pipe(
                Layer.provide(fixture.layer),
              ),
            ),
            Effect.flip,
          );
          expect(error._tag).toBe("EmailUnsubscribeConfigurationError");
        }
      });
    },
  );
});
