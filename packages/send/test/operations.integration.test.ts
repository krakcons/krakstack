import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { withSend } from "./fixtures/send.js";

const scope = {
  recipientUserId: null,
  organizationId: null,
  workspaceId: null,
};
const actor = "host:operator";
const seed = (
  f: Parameters<Parameters<typeof withSend>[0]>[0],
  email = "person@example.com",
  requestId = "message",
) =>
  Effect.gen(function* () {
    const contact = yield* f.send.createContact({ email });
    const queued = yield* f.send.queueEmail({
      requestId,
      contactId: contact.id,
      purpose: "transactional",
      eventKey: "ops-test",
      email: {
        subject: "Operational news",
        text: "Private body https://example.com/?token=secret",
      },
    });
    return { contact, queued };
  });

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "sending operations visibility and management",
  () => {
    it.effect(
      "shows expired and purpose-specific suppressions without treating them as active all-purpose blocks",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            yield* f.notifications.setSuppression({
              scope,
              channel: "email",
              purpose: null,
              recipientAddress: "expired@example.com",
              reason: "Old block",
              expiresAt: new Date(0),
            });
            yield* f.notifications.setSuppression({
              scope,
              channel: "email",
              purpose: "notification",
              recipientAddress: "person@example.com",
              reason: "Optional mail only",
              expiresAt: null,
            });
            expect(
              (yield* f.operations.suppressions({ state: "active" })).items.map(
                (row) => row.email,
              ),
            ).toEqual(["person@example.com"]);
            expect(
              (yield* f.operations.suppressions({
                state: "expired",
              })).items.map((row) => row.email),
            ).toEqual(["expired@example.com"]);
            const first = yield* f.operations.suppressions({
              state: "all",
              limit: 1,
            });
            expect(first.nextCursor).not.toBeNull();
            expect(
              (yield* f.operations.suppressions({
                state: "all",
                before: first.nextCursor ?? undefined,
                limit: 1,
              })).items[0].email,
            ).toBe("expired@example.com");
            expect((yield* f.operations.overview({})).activeSuppressions).toBe(
              1,
            );
          }),
        ),
    );
    it.effect(
      "counts distinct deliveries, not duplicate feedback, and never exposes message bodies or unrelated deliveries",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            const { contact, queued } = yield* seed(f);
            yield* f.runtime.runDeliveryWorkerOnce;
            const detail = yield* f.notifications.getDelivery({
              scope,
              deliveryId: queued.deliveryId,
            });
            if (!detail.delivery.providerMessageId)
              return yield* Effect.die(new Error("Missing provider ID"));
            for (const eventId of ["one", "two"])
              yield* f.feedback.record({
                provider: "fake",
                eventId,
                providerMessageId: detail.delivery.providerMessageId,
                recipientAddress: contact.email,
                kind: "delivered",
                occurredAt: new Date(),
              });
            // A legacy delivery in the same engine scope is not a KrakSend publication.
            yield* f.notifications.publish({
              idempotencyKey: "legacy",
              scope,
              eventKey: "legacy",
              eventVersion: 1,
              inbox: null,
              deliveries: [
                {
                  key: "legacy",
                  channel: "email",
                  purpose: "transactional",
                  template: null,
                  recipientAddress: "legacy@example.com",
                  recipientName: null,
                  payloadVersion: 1,
                  payload: { subject: "Legacy", text: "Body" },
                },
              ],
            });
            expect(yield* f.operations.overview({})).toMatchObject({
              total: 1,
              accepted: 1,
              confirmed: 1,
              hardBounced: 0,
            });
            expect((yield* f.operations.activity({})).items).toHaveLength(1);
            const inspection = yield* f.operations.inspect({
              id: queued.deliveryId,
            });
            expect(inspection.attempts).toHaveLength(1);
            expect(JSON.stringify(inspection)).not.toMatch(
              /Private body|token=secret|unsubscribeUrl/,
            );
            const legacy = yield* f.notifications.listDeliveries({
              scope,
              channel: "email",
              statuses: [],
              pagination: { limit: 25, cursor: null },
            });
            const other = legacy.items.find((d) => d.eventKey === "legacy");
            if (!other)
              return yield* Effect.die(new Error("Missing legacy delivery"));
            expect(
              (yield* f.operations.inspect({ id: other.id }).pipe(Effect.flip))
                ._tag,
            ).toBe("SendNotFound");
          }),
        ),
    );
    it.effect(
      "lists hard/soft bounces, complaints and pending events with stable pagination and correlation state",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            for (const [eventId, kind] of [
              ["hard", "hard_bounce"],
              ["soft", "soft_bounce"],
              ["complaint", "complaint"],
            ] as const)
              yield* f.feedback.record({
                provider: "fake",
                eventId,
                providerMessageId: "unknown",
                recipientAddress: "person@example.com",
                kind,
                occurredAt: new Date(),
              });
            const first = yield* f.operations.feedback({
              kind: "bounces",
              correlation: "pending",
              limit: 1,
            });
            expect(first.items[0].kind).toBe("soft_bounce");
            expect(first.items[0].appliedAt).toBeNull();
            const second = yield* f.operations.feedback({
              kind: "bounces",
              before: first.nextCursor ?? undefined,
              limit: 1,
            });
            expect(second.items[0].kind).toBe("hard_bounce");
            expect(second.nextCursor).toBeNull();
            expect(
              (yield* f.operations.feedback({ kind: "complaint" })).items,
            ).toHaveLength(1);
            expect((yield* f.operations.overview({})).pendingFeedback).toBe(3);
          }),
        ),
    );
    it.effect(
      "supports literal search, bounded validated queries and half-open date windows",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            yield* seed(f);
            yield* seed(f, "other@example.com", "other");
            expect(
              (yield* f.operations.activity({ search: "%" })).items,
            ).toHaveLength(0);
            expect(
              (yield* f.operations.activity({ search: "PERSON@", limit: 1 }))
                .items,
            ).toHaveLength(1);
            const first = yield* f.operations.activity({ limit: 1 });
            expect(
              (yield* f.operations.activity({
                before: first.nextCursor ?? undefined,
                limit: 1,
              })).items[0].id,
            ).not.toBe(first.items[0].id);
            for (const request of [
              Effect.asVoid(f.operations.activity({ before: "invalid" })),
              Effect.asVoid(f.operations.feedback({ before: "-1" })),
              Effect.asVoid(
                f.operations.overview({
                  since: new Date(100),
                  until: new Date(0),
                }),
              ),
              Effect.asVoid(f.operations.activity({ limit: 101 })),
            ])
              expect((yield* request.pipe(Effect.flip))._tag).toBe(
                "SendValidationError",
              );
            expect(
              (yield* f.operations.overview({ until: new Date(0) })).total,
            ).toBe(0);
          }),
        ),
    );
    it.effect(
      "audits idempotent manual suppression changes and does not resurrect a removed block on replay",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            const add = {
              payload: {
                requestId: "add",
                email: "person@example.com",
                reason: "Operator review",
              },
              actor,
            };
            const [a, b] = yield* Effect.all(
              [
                f.operations.addSuppression(add),
                f.operations.addSuppression(add),
              ],
              { concurrency: "unbounded" },
            );
            expect(a).toEqual(b);
            const suppression = (yield* f.operations.suppressions({})).items[0];
            const remove = {
              id: suppression.id,
              payload: {
                requestId: "remove",
                version: suppression.version,
                reason: "Reviewed evidence",
              },
              actor,
            };
            yield* f.operations.removeSuppression(remove);
            yield* f.operations.removeSuppression(remove);
            yield* f.operations.addSuppression(add);
            expect((yield* f.operations.suppressions({})).items).toHaveLength(
              0,
            );
            const audit = yield* f.operations.audit({});
            expect(audit.items.map((e) => e.action)).toEqual(["remove", "add"]);
            expect(audit.items[0]).toMatchObject({
              actor,
              previousReason: "Operator review",
            });
            yield* f.notifications.setSuppression({
              scope,
              channel: "email",
              purpose: null,
              recipientAddress: "person@example.com",
              reason: "provider_complaint",
              expiresAt: null,
            });
            yield* f.operations.removeSuppression(remove);
            expect((yield* f.operations.suppressions({})).items[0].reason).toBe(
              "provider_complaint",
            );
            expect((yield* f.operations.audit({})).items).toHaveLength(2);
            expect(
              (yield* f.operations
                .addSuppression({
                  ...add,
                  payload: { ...add.payload, reason: "different" },
                })
                .pipe(Effect.flip))._tag,
            ).toBe("SendConflict");
          }),
        ),
    );
    it.effect(
      "rejects stale removal after a new provider suppression, even when its reason is unchanged",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            yield* f.notifications.setSuppression({
              scope,
              channel: "email",
              purpose: null,
              recipientAddress: "person@example.com",
              reason: "provider_hard_bounce",
              expiresAt: null,
            });
            const old = (yield* f.operations.suppressions({})).items[0];
            yield* f.notifications.setSuppression({
              scope,
              channel: "email",
              purpose: null,
              recipientAddress: "person@example.com",
              reason: "provider_hard_bounce",
              expiresAt: null,
            });
            expect(
              (yield* f.operations
                .removeSuppression({
                  id: old.id,
                  payload: {
                    requestId: "stale-remove",
                    version: old.version,
                    reason: "Reviewed",
                  },
                  actor,
                })
                .pipe(Effect.flip))._tag,
            ).toBe("SendConflict");
            expect((yield* f.operations.suppressions({})).items).toHaveLength(
              1,
            );
            expect((yield* f.operations.audit({})).items).toHaveLength(0);
            expect(
              (yield* f.operations
                .addSuppression({
                  payload: {
                    requestId: "overwrite",
                    email: "person@example.com",
                    reason: "Replace bounce",
                  },
                  actor,
                })
                .pipe(Effect.flip))._tag,
            ).toBe("SendConflict");
          }),
        ),
    );
    it.effect(
      "keeps a concurrent new provider block regardless of removal ordering",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            const block = {
              scope,
              channel: "email",
              purpose: null,
              recipientAddress: "person@example.com",
              reason: "provider_hard_bounce",
              expiresAt: null,
            };
            yield* f.notifications.setSuppression(block);
            const reviewed = (yield* f.operations.suppressions({})).items[0];
            yield* Effect.all(
              [
                f.operations
                  .removeSuppression({
                    id: reviewed.id,
                    payload: {
                      requestId: "concurrent-remove",
                      version: reviewed.version,
                      reason: "Reviewed old block",
                    },
                    actor,
                  })
                  .pipe(Effect.result),
                f.notifications.setSuppression({
                  ...block,
                  reason: "provider_complaint",
                }),
              ],
              { concurrency: "unbounded" },
            );
            expect((yield* f.operations.suppressions({})).items[0].reason).toBe(
              "provider_complaint",
            );
          }),
        ),
    );
    it.effect(
      "never exposes or clears account, organization, or push suppressions",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            for (const input of [
              {
                scope: { ...scope, recipientUserId: "user" },
                channel: "email",
              },
              { scope: { ...scope, organizationId: "org" }, channel: "email" },
              { scope, channel: "push" },
            ]) {
              const s = yield* f.notifications.setSuppression({
                ...input,
                purpose: null,
                recipientAddress: "person@example.com",
                reason: "private",
                expiresAt: null,
              });
              expect(
                (yield* f.operations
                  .removeSuppression({
                    id: s.id,
                    payload: {
                      requestId: s.id,
                      version: "1",
                      reason: "Attempt",
                    },
                    actor,
                  })
                  .pipe(Effect.flip))._tag,
              ).toBe("SendNotFound");
            }
            expect(
              (yield* f.operations.suppressions({ state: "all" })).items,
            ).toHaveLength(0);
            expect((yield* f.operations.overview({})).activeSuppressions).toBe(
              0,
            );
          }),
        ),
    );
    it.effect("rolls back a removal when its audit cannot be persisted", () =>
      withSend((f) =>
        Effect.gen(function* () {
          yield* f.operations.addSuppression({
            payload: {
              requestId: "add",
              email: "person@example.com",
              reason: "Review",
            },
            actor,
          });
          const s = (yield* f.operations.suppressions({})).items[0];
          yield* f.sql`ALTER TABLE kraksend_suppression_audit ADD CONSTRAINT reject_remove CHECK (action <> 'remove')`;
          expect(
            (yield* f.operations
              .removeSuppression({
                id: s.id,
                payload: {
                  requestId: "remove",
                  version: s.version,
                  reason: "Reviewed",
                },
                actor,
              })
              .pipe(Effect.flip))._tag,
          ).toBe("SendStorageError");
          expect((yield* f.operations.suppressions({})).items).toHaveLength(1);
        }),
      ),
    );
    it.effect(
      "does not restore withdrawn consent or resend a suppressed delivery after removing a block",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            const { contact, queued } = yield* seed(f);
            yield* f.send.withdrawEmailConsent({ id: contact.id });
            yield* f.operations.addSuppression({
              payload: {
                requestId: "add",
                email: contact.email,
                reason: "Review",
              },
              actor,
            });
            yield* f.runtime.runDeliveryWorkerOnce;
            const s = (yield* f.operations.suppressions({})).items[0];
            yield* f.operations.removeSuppression({
              id: s.id,
              payload: {
                requestId: "remove",
                version: s.version,
                reason: "Reviewed",
              },
              actor,
            });
            expect(
              (yield* f.send.getContact({ id: contact.id })).emailConsent,
            ).toBe("unsubscribed");
            expect(
              (yield* f.operations.inspect({ id: queued.deliveryId })).delivery
                .status,
            ).toBe("suppressed");
            expect(f.transport.sent).toHaveLength(0);
          }),
        ),
    );
    it.effect(
      "exposes pending and skipped campaign recipients with their publication reason",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            const contact = yield* f.send.createContact({
              email: "person@example.com",
            });
            yield* f.send.recordEmailConsent({
              contactId: contact.id,
              requestId: "grant",
              status: "subscribed",
              source: "test",
              actor,
              noticeVersion: "v1",
            });
            const campaign = yield* f.campaigns.create({
              actor,
              payload: {
                requestId: "campaign",
                name: "News",
                from: "sender@example.com",
                audience: { _tag: "AllSubscribed" },
                content: {
                  en: {
                    subject: "News",
                    text: "Body",
                    unsubscribeText: "Unsubscribe",
                  },
                  fr: {
                    subject: "Nouvelles",
                    text: "Texte",
                    unsubscribeText: "Désabonner",
                  },
                },
              },
            });
            yield* f.campaigns.schedule({
              id: campaign.id,
              scheduledFor: new Date(0),
            });
            expect(
              (yield* f.operations.recipients({
                campaignId: campaign.id,
                status: "pending",
              })).items,
            ).toHaveLength(1);
            yield* f.send.withdrawEmailConsent({ id: contact.id });
            yield* f.campaigns.processBatch({
              id: campaign.id,
              batchNumber: 0,
            });
            expect(
              (yield* f.operations.recipients({
                campaignId: campaign.id,
                status: "skipped",
              })).items[0],
            ).toMatchObject({
              id: contact.id,
              status: "skipped",
              reason: "consent_required",
              deliveryId: null,
            });
          }),
        ),
    );
  },
);
