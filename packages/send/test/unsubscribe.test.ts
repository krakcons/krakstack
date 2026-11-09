import { describe, expect, it } from "@effect/vitest";
import { DateTime, Effect, Layer, Redacted, Schema } from "effect";
import { Mac, SecureRandom } from "effect/crypto";
import { Base64Url } from "effect/encoding";
import * as TestClock from "effect/testing/TestClock";
import { SendUnsubscribe } from "../src/unsubscribe.js";
import { contactId, makeUnsubscribeFixture } from "./fixtures/unsubscribe.js";
import { unsubscribeOptions } from "./fixtures/send.js";

const tokenFromLink = (link: string) =>
  new URL(link).searchParams.get("token") ?? "";
const signClaims = Effect.fnUntraced(
  function* (claims: Schema.Json) {
    const body = Base64Url.encode(
      yield* Schema.encodeEffect(Schema.fromJsonString(Schema.Json))(claims),
    );
    const key = yield* Mac.key(
      Mac.hmacSha256,
      new TextEncoder().encode(Redacted.value(unsubscribeOptions.secret)),
    );
    const mac = yield* Mac.Mac;
    return `${body}.${Base64Url.encode(yield* mac.sign(key, new TextEncoder().encode(body)))}`;
  },
  Effect.provide(
    Mac.layerWebCrypto.pipe(Layer.provide(SecureRandom.layerWebCrypto)),
  ),
);

describe("contact unsubscribe capabilities", () => {
  it.effect(
    "validates without a write and targets only the signed contact",
    () => {
      const fixture = makeUnsubscribeFixture();
      return Effect.gen(function* () {
        const service = yield* SendUnsubscribe;
        const link = yield* service.createLink({ id: contactId });
        expect(link).not.toContain("private@example.com");
        const token = tokenFromLink(link);
        yield* service.validateToken({ token });
        expect(fixture.withdrawals).toEqual([]);
        yield* service.unsubscribe({ token });
        expect(fixture.withdrawals).toEqual([contactId]);
      }).pipe(
        Effect.provide(
          SendUnsubscribe.makeLayer(unsubscribeOptions).pipe(
            Layer.provide(fixture.layer),
          ),
        ),
      );
    },
  );

  it.effect(
    "rejects tampering, account tokens, wrong audience/version and malformed claims without writes",
    () => {
      const fixture = makeUnsubscribeFixture();
      return Effect.gen(function* () {
        const service = yield* SendUnsubscribe;
        const token = tokenFromLink(
          yield* service.createLink({ id: contactId }),
        );
        const [body, signature] = token.split(".");
        const claims = {
          version: 1,
          purpose: "kraksend-contact-email-unsubscribe",
          audience: unsubscribeOptions.audience,
          contactId,
          expiresAt: (yield* DateTime.nowAsDate).getTime() + 60_000,
        };
        for (const invalid of [
          "",
          "forged",
          "not.a.token",
          `${body}.${signature.startsWith("A") ? "B" : "A"}${signature.slice(1)}`,
          `${Base64Url.encode("{}")}.${signature}`,
          yield* signClaims({ ...claims, version: 2 }),
          yield* signClaims({ ...claims, audience: "other-installation" }),
          yield* signClaims({
            ...claims,
            purpose: "email-unsubscribe",
            recipientUserId: "account-1",
          }),
          yield* signClaims({ ...claims, contactId: "not-a-contact-id" }),
        ]) {
          const error = yield* service
            .unsubscribe({ token: invalid })
            .pipe(Effect.flip);
          expect(error._tag).toBe("SendUnsubscribeTokenError");
          expect(JSON.stringify(error)).not.toContain(signature);
        }
        expect(fixture.withdrawals).toEqual([]);
      }).pipe(
        Effect.provide(
          SendUnsubscribe.makeLayer(unsubscribeOptions).pipe(
            Layer.provide(fixture.layer),
          ),
        ),
      );
    },
  );

  it.effect(
    "expires at the boundary and rejects tokens under another installation key",
    () => {
      const fixture = makeUnsubscribeFixture();
      return Effect.gen(function* () {
        const token = tokenFromLink(
          yield* SendUnsubscribe.use((service) =>
            service.createLink({ id: contactId }),
          ).pipe(
            Effect.provide(
              SendUnsubscribe.makeLayer(unsubscribeOptions).pipe(
                Layer.provide(fixture.layer),
              ),
            ),
          ),
        );
        expect(
          (yield* SendUnsubscribe.use((service) =>
            service.unsubscribe({ token }),
          ).pipe(
            Effect.provide(
              SendUnsubscribe.makeLayer({
                ...unsubscribeOptions,
                secret: Redacted.make(
                  "another-installation-secret-at-least-32-characters",
                ),
              }).pipe(Layer.provide(fixture.layer)),
            ),
            Effect.flip,
          ))._tag,
        ).toBe("SendUnsubscribeTokenError");
        yield* TestClock.adjust(60_000);
        expect(
          (yield* SendUnsubscribe.use((service) =>
            service.unsubscribe({ token }),
          ).pipe(
            Effect.provide(
              SendUnsubscribe.makeLayer(unsubscribeOptions).pipe(
                Layer.provide(fixture.layer),
              ),
            ),
            Effect.flip,
          ))._tag,
        ).toBe("SendUnsubscribeTokenError");
        expect(fixture.withdrawals).toEqual([]);
      });
    },
  );

  it.effect("rejects weak keys and unsafe endpoints during acquisition", () => {
    const fixture = makeUnsubscribeFixture();
    return Effect.gen(function* () {
      for (const options of [
        { ...unsubscribeOptions, secret: Redacted.make("short") },
        {
          ...unsubscribeOptions,
          endpoint: "http://app.example.com/send/unsubscribe",
        },
        {
          ...unsubscribeOptions,
          endpoint: "https://user:pass@app.example.com/send/unsubscribe",
        },
        {
          ...unsubscribeOptions,
          endpoint: "https://app.example.com/send/unsubscribe#fragment",
        },
        { ...unsubscribeOptions, tokenTtlMillis: 0 },
      ]) {
        expect(
          (yield* SendUnsubscribe.use(() => Effect.void).pipe(
            Effect.provide(
              SendUnsubscribe.makeLayer(options).pipe(
                Layer.provide(fixture.layer),
              ),
            ),
            Effect.flip,
          ))._tag,
        ).toBe("SendUnsubscribeConfigurationError");
      }
    });
  });
});
