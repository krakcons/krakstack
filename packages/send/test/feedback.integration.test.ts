import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { NotificationService } from "@krak-stack/notifications";
import { NotificationRuntime } from "@krak-stack/notifications/runtime";
import { KrakSend } from "../src/index.js";
import { RecordFeedback } from "../src/schema.js";
import { withSend } from "./fixtures/send.js";

const scope = {
  recipientUserId: null,
  organizationId: null,
  workspaceId: null,
};
const accepted = Effect.fnUntraced(function* (
  fixture: {
    send: KrakSend["Service"];
    notifications: NotificationService["Service"];
    runtime: NotificationRuntime["Service"];
  },
  address = "person@example.com",
  requestId = "seed",
) {
  const contact = yield* fixture.send.createContact({ email: address });
  const request = {
    requestId,
    contactId: contact.id,
    purpose: "transactional",
    eventKey: "test",
    email: { subject: "Subject", text: "Body" },
  } satisfies Parameters<typeof fixture.send.queueEmail>[0];
  const queued = yield* fixture.send.queueEmail(request);
  yield* fixture.runtime.runDeliveryWorkerOnce;
  const detail = yield* fixture.notifications.getDelivery({
    scope,
    deliveryId: queued.deliveryId,
  });
  if (detail.delivery.providerMessageId === null)
    return yield* Effect.die(new Error("Expected provider acceptance"));
  return {
    contact,
    request,
    deliveryId: queued.deliveryId,
    event: {
      provider: "fake",
      eventId: "feedback-1",
      providerMessageId: detail.delivery.providerMessageId,
      recipientAddress: contact.email,
      kind: "hard_bounce",
      occurredAt: new Date("2026-11-06T00:00:00Z"),
    } satisfies RecordFeedback,
  };
});

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "delivery feedback persistence",
  () => {
    it.effect(
      "delivery confirmations and soft bounces alone do not suppress an endpoint",
      () =>
        withSend((fixture) =>
          Effect.gen(function* () {
            const first = yield* accepted(fixture);
            for (const kind of ["delivered", "soft_bounce"] as const) {
              yield* fixture.feedback.record({
                ...first.event,
                eventId: kind,
                kind,
              });
            }
            const next = yield* fixture.send.queueEmail({
              ...first.request,
              requestId: "allowed",
            });
            yield* fixture.runtime.runDeliveryWorkerOnce;
            expect(
              (yield* fixture.notifications.getDelivery({
                scope,
                deliveryId: next.deliveryId,
              })).delivery.status,
            ).toBe("sent");
          }),
        ),
    );

    it.effect(
      "correlates an accepted attempt even when the latest delivery snapshot has a different provider ID",
      () =>
        withSend((fixture) =>
          Effect.gen(function* () {
            const first = yield* accepted(fixture);
            yield* fixture.sql`UPDATE notification_deliveries SET provider_message_id = 'newer-provider-id' WHERE id = ${first.deliveryId}`;
            expect(
              (yield* fixture.feedback.record(first.event)).deliveryId,
            ).toBe(first.deliveryId);
          }),
        ),
    );

    it.effect(
      "keeps ambiguous provider IDs pending instead of suppressing a guessed delivery",
      () =>
        withSend((fixture) =>
          Effect.gen(function* () {
            const first = yield* accepted(fixture);
            const next = yield* fixture.send.queueEmail({
              ...first.request,
              requestId: "second",
            });
            yield* fixture.runtime.runDeliveryWorkerOnce;
            yield* fixture.sql`UPDATE notification_delivery_attempts SET provider_message_id = ${first.event.providerMessageId} WHERE delivery_id = ${next.deliveryId}`;
            expect((yield* fixture.feedback.record(first.event)).status).toBe(
              "pending",
            );
            expect(yield* fixture.feedback.reconcile({})).toEqual({
              checked: 1,
              applied: 0,
              pending: 1,
            });
            const allowed = yield* fixture.send.queueEmail({
              ...first.request,
              requestId: "still-allowed",
            });
            yield* fixture.runtime.runDeliveryWorkerOnce;
            expect(
              (yield* fixture.notifications.getDelivery({
                scope,
                deliveryId: allowed.deliveryId,
              })).delivery.status,
            ).toBe("sent");
          }),
        ),
    );

    it.effect(
      "does not apply feedback for an engine delivery outside KrakSend",
      () =>
        withSend((fixture) =>
          Effect.gen(function* () {
            const publication = yield* fixture.notifications.publish({
              idempotencyKey: "legacy",
              scope,
              eventKey: "legacy",
              eventVersion: 1,
              deliveries: [
                {
                  key: "email",
                  channel: "email",
                  purpose: "transactional",
                  template: null,
                  recipientAddress: "person@example.com",
                  recipientName: null,
                  payloadVersion: 1,
                  payload: { subject: "Subject", text: "Body" },
                },
              ],
            });
            yield* fixture.runtime.runDeliveryWorkerOnce;
            const detail = yield* fixture.notifications.getDelivery({
              scope,
              deliveryId: publication.deliveryIds[0],
            });
            if (detail.delivery.providerMessageId === null)
              return yield* Effect.die(
                new Error("Expected accepted legacy delivery"),
              );
            expect(
              (yield* fixture.feedback.record({
                provider: "fake",
                eventId: "legacy-event",
                providerMessageId: detail.delivery.providerMessageId,
                recipientAddress: "person@example.com",
                kind: "complaint",
                occurredAt: new Date(0),
              })).status,
            ).toBe("pending");
            expect(
              yield* fixture.sql`SELECT count(*)::int AS count FROM notification_suppressions`,
            ).toEqual([{ count: 0 }]);
          }),
        ),
    );

    for (const kind of ["hard_bounce", "complaint"] as const) {
      it.effect(
        `${kind} blocks queued and future email without changing consent or accepted delivery status`,
        () =>
          withSend((fixture) =>
            Effect.gen(function* () {
              const { send, feedback, runtime, notifications, transport } =
                fixture;
              const first = yield* accepted(fixture);
              yield* send.recordEmailConsent({
                contactId: first.contact.id,
                requestId: "grant",
                status: "subscribed",
                source: "test",
                actor: "host",
                noticeVersion: "v1",
              });
              const waiting = yield* send.queueEmail({
                ...first.request,
                requestId: "queued-before-feedback",
              });
              const result = yield* feedback.record({
                ...first.event,
                kind,
                recipientAddress: " Person@Example.com ",
              });
              expect(result).toEqual({
                status: "applied",
                deliveryId: first.deliveryId,
                idempotentReplay: false,
              });
              yield* runtime.runDeliveryWorkerOnce;
              expect(
                (yield* notifications.getDelivery({
                  scope,
                  deliveryId: waiting.deliveryId,
                })).delivery.status,
              ).toBe("suppressed");
              const next = yield* send.queueEmail({
                ...first.request,
                requestId: "after-feedback",
              });
              expect(
                (yield* notifications.getDelivery({
                  scope,
                  deliveryId: next.deliveryId,
                })).delivery.status,
              ).toBe("suppressed");
              expect(
                (yield* notifications.getDelivery({
                  scope,
                  deliveryId: first.deliveryId,
                })).delivery.status,
              ).toBe("sent");
              expect(
                (yield* send.getContact({ id: first.contact.id })).emailConsent,
              ).toBe("subscribed");
              expect(transport.sent).toHaveLength(1);
              const other = yield* accepted(
                fixture,
                "other@example.com",
                "other-email",
              );
              expect(
                (yield* notifications.getDelivery({
                  scope,
                  deliveryId: other.deliveryId,
                })).delivery.status,
              ).toBe("sent");
            }),
          ),
      );
    }

    it.effect(
      "replays concurrent events once and rejects conflicting reuse",
      () =>
        withSend((fixture) =>
          Effect.gen(function* () {
            const first = yield* accepted(fixture);
            const results = yield* Effect.all(
              [
                fixture.feedback.record(first.event),
                fixture.feedback.record(first.event),
              ],
              { concurrency: "unbounded" },
            );
            expect(
              results.filter((result) => result.idempotentReplay),
            ).toHaveLength(1);
            const count =
              yield* fixture.sql`SELECT count(*)::int AS count FROM kraksend_feedback_events`;
            expect(count).toEqual([{ count: 1 }]);
            expect(
              (yield* fixture.feedback
                .record({ ...first.event, kind: "delivered" })
                .pipe(Effect.flip))._tag,
            ).toBe("SendConflict");
            expect(
              (yield* fixture.feedback
                .record({ ...first.event, providerMessageId: "different" })
                .pipe(Effect.flip))._tag,
            ).toBe("SendConflict");
          }),
        ),
    );

    it.effect(
      "stores pre-acceptance events and reconciles them after provider acceptance",
      () =>
        withSend((fixture) =>
          Effect.gen(function* () {
            const { send, feedback, runtime, notifications } = fixture;
            const contact = yield* send.createContact({
              email: "person@example.com",
            });
            const publication = yield* send.queueEmail({
              contactId: contact.id,
              requestId: "early",
              purpose: "transactional",
              eventKey: "test",
              email: { subject: "Subject", text: "Body" },
            });
            const detail = yield* notifications.getDelivery({
              scope,
              deliveryId: publication.deliveryId,
            });
            // The fake provider's message ID is the dispatch/attempt ID, known here to
            // model a callback arriving before the engine commits provider acceptance.
            const event = {
              provider: "fake",
              eventId: "early-feedback",
              providerMessageId: detail.attempts[0].jobId,
              recipientAddress: contact.email,
              kind: "complaint",
              occurredAt: new Date(0),
            } satisfies RecordFeedback;
            expect((yield* feedback.record(event)).status).toBe("pending");
            yield* runtime.runDeliveryWorkerOnce;
            expect(yield* feedback.reconcile({})).toEqual({
              checked: 1,
              applied: 1,
              pending: 0,
            });
            expect((yield* feedback.record(event)).idempotentReplay).toBe(true);
            const next = yield* send.queueEmail({
              contactId: contact.id,
              requestId: "blocked",
              purpose: "transactional",
              eventKey: "test",
              email: { subject: "Subject", text: "Body" },
            });
            expect(
              (yield* notifications.getDelivery({
                scope,
                deliveryId: next.deliveryId,
              })).delivery.status,
            ).toBe("suppressed");
          }),
        ),
    );

    it.effect(
      "never correlates by recipient alone, crosses providers, or accepts another recipient",
      () =>
        withSend((fixture) =>
          Effect.gen(function* () {
            const first = yield* accepted(fixture);
            for (const event of [
              { ...first.event, eventId: "wrong-provider", provider: "ses" },
              {
                ...first.event,
                eventId: "wrong-message",
                providerMessageId: "unknown",
              },
              {
                ...first.event,
                eventId: "wrong-recipient",
                recipientAddress: "other@example.com",
              },
            ])
              expect((yield* fixture.feedback.record(event)).status).toBe(
                "pending",
              );
            const next = yield* fixture.send.queueEmail({
              ...first.request,
              requestId: "still-allowed",
            });
            yield* fixture.runtime.runDeliveryWorkerOnce;
            expect(
              (yield* fixture.notifications.getDelivery({
                scope,
                deliveryId: next.deliveryId,
              })).delivery.status,
            ).toBe("sent");
          }),
        ),
    );

    it.effect(
      "delivery and soft-bounce events never clear a complaint suppression",
      () =>
        withSend((fixture) =>
          Effect.gen(function* () {
            const first = yield* accepted(fixture);
            yield* fixture.feedback.record({
              ...first.event,
              kind: "complaint",
            });
            for (const kind of ["delivered", "soft_bounce"] as const)
              expect(
                (yield* fixture.feedback.record({
                  ...first.event,
                  eventId: kind,
                  kind,
                })).status,
              ).toBe("applied");
            const next = yield* fixture.send.queueEmail({
              ...first.request,
              requestId: "still-blocked",
            });
            const detail = yield* fixture.notifications.getDelivery({
              scope,
              deliveryId: next.deliveryId,
            });
            expect(detail.delivery.status).toBe("suppressed");
            expect(
              (yield* fixture.notifications.getDelivery({
                scope,
                deliveryId: first.deliveryId,
              })).delivery.status,
            ).toBe("sent");
          }),
        ),
    );

    it.effect(
      "rolls back event recording and suppression in the same SQL transaction",
      () =>
        withSend((fixture) =>
          Effect.gen(function* () {
            const first = yield* accepted(fixture);
            yield* fixture.sql
              .withTransaction(
                Effect.gen(function* () {
                  yield* fixture.feedback.record(first.event);
                  return yield* Effect.fail("rollback");
                }),
              )
              .pipe(Effect.flip);
            expect(
              yield* fixture.sql`SELECT count(*)::int AS count FROM kraksend_feedback_events`,
            ).toEqual([{ count: 0 }]);
            const next = yield* fixture.send.queueEmail({
              ...first.request,
              requestId: "not-suppressed",
            });
            yield* fixture.runtime.runDeliveryWorkerOnce;
            expect(
              (yield* fixture.notifications.getDelivery({
                scope,
                deliveryId: next.deliveryId,
              })).delivery.status,
            ).toBe("sent");
          }),
        ),
    );

    it.effect(
      "reconciliation rotates unmatched events so a bounded batch does not starve newer feedback",
      () =>
        withSend((fixture) =>
          Effect.gen(function* () {
            const first = yield* accepted(fixture);
            for (const eventId of ["missing-one", "missing-two"])
              yield* fixture.feedback.record({
                ...first.event,
                eventId,
                providerMessageId: "not-yet-known",
              });
            const before =
              yield* fixture.sql`SELECT event_id FROM kraksend_feedback_events ORDER BY checked_at, received_at LIMIT 1`;
            yield* fixture.feedback.reconcile({ limit: 1 });
            const after =
              yield* fixture.sql`SELECT event_id FROM kraksend_feedback_events ORDER BY checked_at, received_at LIMIT 1`;
            expect(after).not.toEqual(before);
            yield* fixture.feedback.reconcile({ limit: 1 });
            expect(
              yield* fixture.sql`SELECT event_id FROM kraksend_feedback_events ORDER BY checked_at, received_at LIMIT 1`,
            ).toEqual(before);
            expect(
              (yield* Schema.decodeUnknownEffect(RecordFeedback)({
                ...first.event,
                kind: "opened",
              }).pipe(Effect.exit))._tag,
            ).toBe("Failure");
            expect(
              (yield* fixture.feedback
                .reconcile({ limit: 101 })
                .pipe(Effect.flip))._tag,
            ).toBe("SendValidationError");
          }),
        ),
    );
  },
);
