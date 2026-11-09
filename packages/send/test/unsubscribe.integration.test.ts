import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { withSend } from "./fixtures/send.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "public contact withdrawal persistence",
  () => {
    it.effect(
      "deduplicates concurrent withdrawals but an old link withdraws again after re-subscription",
      () =>
        withSend(({ send, unsubscribe }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "one@example.com",
            });
            const other = yield* send.createContact({
              email: "other@example.com",
            });
            const grant = (id: string, requestId: string) =>
              send.recordEmailConsent({
                contactId: id,
                requestId,
                status: "subscribed",
                source: "test",
                actor: "host",
                noticeVersion: "v1",
              });
            yield* grant(contact.id, "grant-one");
            yield* grant(other.id, "grant-other");
            const link = yield* unsubscribe.createLink({ id: contact.id });
            const input = {
              token: new URL(link).searchParams.get("token") ?? "",
            };
            yield* unsubscribe.validateToken(input);
            expect(
              (yield* send.getContact({ id: contact.id })).emailConsent,
            ).toBe("subscribed");
            yield* Effect.all(
              [unsubscribe.unsubscribe(input), unsubscribe.unsubscribe(input)],
              { concurrency: "unbounded" },
            );
            const history = yield* send.listEmailConsentEvents({
              contactId: contact.id,
              query: {},
            });
            expect(history.items).toHaveLength(2);
            expect(
              history.items.find((event) => event.status === "unsubscribed")
                ?.source,
            ).toBe("public-unsubscribe");
            expect(
              (yield* send.getContact({ id: other.id })).emailConsent,
            ).toBe("subscribed");
            yield* grant(contact.id, "resubscribe");
            yield* unsubscribe.unsubscribe(input);
            expect(
              (yield* send.getContact({ id: contact.id })).emailConsent,
            ).toBe("unsubscribed");
            expect(
              (yield* send.listEmailConsentEvents({
                contactId: contact.id,
                query: {},
              })).items,
            ).toHaveLength(4);
          }),
        ),
    );

    it.effect(
      "rolls back withdrawal atomically and records unknown-consent withdrawal",
      () =>
        withSend(({ send, unsubscribe, sql }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "one@example.com",
            });
            const input = {
              token:
                new URL(
                  yield* unsubscribe.createLink({ id: contact.id }),
                ).searchParams.get("token") ?? "",
            };
            yield* sql
              .withTransaction(
                Effect.gen(function* () {
                  yield* unsubscribe.unsubscribe(input);
                  return yield* Effect.fail("rollback");
                }),
              )
              .pipe(Effect.flip);
            expect(
              (yield* send.getContact({ id: contact.id })).emailConsent,
            ).toBe("unknown");
            expect(
              (yield* send.listEmailConsentEvents({
                contactId: contact.id,
                query: {},
              })).items,
            ).toHaveLength(0);
            yield* unsubscribe.unsubscribe(input);
            expect(
              (yield* send.getContact({ id: contact.id })).emailConsent,
            ).toBe("unsubscribed");
          }),
        ),
    );
  },
);
