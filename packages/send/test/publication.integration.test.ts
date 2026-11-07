import { describe, expect, it } from "@effect/vitest";
import { DateTime, Effect } from "effect";
import * as TestClock from "effect/testing/TestClock";
import { NotificationService } from "@krak-stack/notifications";
import { NotificationTransportRetryable } from "@krak-stack/notifications/transport";
import {
  CurrentNotificationIntegration,
  NotificationIntegrationAuthorization,
  NotificationPublicationIntegration,
  PublicationAccessDenied,
  type PublicationAccess,
} from "@krak-stack/notifications/integration";
import { withSend } from "./fixtures/send.js";
import { initialTableState } from "../../notifications/src/admin/table.schema.js";
import type {
  PublicationInput,
  PublicationRecipient,
  DeliveryPolicy,
} from "../../notifications/src/schema.js";

const scope = {
  recipientUserId: "account-1",
  organizationId: "org-1",
  workspaceId: null,
};
const access = {
  contactManaged: false,
  engineScopes: [],
  deliveryScopes: [{ _tag: "Exact", scope }] as const,
  referenceNamespaces: ["order"],
};
const publication = (
  idempotencyKey: string,
  recipient: PublicationRecipient,
  policy: DeliveryPolicy = { kind: "transactional" },
): PublicationInput => ({
  idempotencyKey,
  scope,
  eventKey: "order.receipt",
  eventVersion: 1,
  deliveries: [
    {
      key: "email",
      channel: "email",
      recipient,
      policy,
      template: "order-receipt",
      payloadVersion: 1,
      payload: {
        from: "sender@example.com",
        subject: "Receipt",
        text: "Content",
        unsubscribeUrl: "https://example.com/unsubscribe",
      },
      references: [{ namespace: "order", value: "order-1" }],
    },
  ],
});
const subject = { namespace: "newsletter", value: "endpoint-1" };
const marketing: DeliveryPolicy = {
  kind: "marketing",
  consent: { kind: "stored", subject },
};

describe.skipIf(!process.env.TEST_DATABASE_URL)("canonical publication", () => {
  it.effect(
    "publishes a contact with independent account and organization scope without manufacturing requests or consent",
    () =>
      withSend((f) =>
        Effect.gen(function* () {
          const contact = yield* f.send.createContact({
            email: "person@example.com",
          });
          const recipient = yield* f.send.resolveEmailRecipient({
            id: contact.id,
          });
          const input = publication("scoped-contact", recipient);
          const receipt = yield* f.notifications.publish(input);
          expect(yield* f.notifications.publish(input)).toMatchObject({
            deliveryIds: receipt.deliveryIds,
            idempotentReplay: true,
          });
          const id = receipt.deliveryIds[0];
          const detail = yield* f.deliveries.inspect({ access, id });
          expect(detail.delivery).toMatchObject({
            contactId: contact.id,
            recipientUserId: "account-1",
            organizationId: "org-1",
            template: "order-receipt",
          });
          expect(detail.references).toHaveLength(1);
          expect(
            yield* f.sql`SELECT request_id FROM kraksend_email_requests`,
          ).toHaveLength(0);
          expect(
            yield* f.sql`SELECT request_id FROM notification_email_consent_events`,
          ).toHaveLength(0);
          const denied = yield* f.deliveries.activityTable({
            access: {
              ...access,
              deliveryScopes: [
                { _tag: "Exact", scope: { ...scope, organizationId: null } },
              ],
            },
            query: { table: initialTableState },
          });
          expect(denied.total).toBe(0);
          yield* f.runtime.runDeliveryWorkerOnce;
          expect(f.transport.sent).toHaveLength(1);
          expect(
            (yield* f.notifications.getDelivery({ scope, deliveryId: id }))
              .delivery.publication?.recipient.contact,
          ).toEqual(recipient.contact);
        }),
      ),
  );

  it.effect(
    "rolls business writes, publication, associations and queue allocation back together",
    () =>
      withSend((f) =>
        Effect.gen(function* () {
          const recipient = { address: "person@example.com", name: null };
          const outcome = yield* f.sql
            .withTransaction(
              Effect.gen(function* () {
                yield* f.send.createContact({ email: "person@example.com" });
                yield* f.notifications.publish(
                  publication("rollback-native", recipient),
                );
                return yield* Effect.fail("rollback" as const);
              }),
            )
            .pipe(Effect.flip);
          expect(outcome).toBe("rollback");
          for (const table of [
            "notification_deliveries",
            "notification_delivery_attempts",
            "notification_publications",
            "kraksend_contacts",
          ]) {
            expect(yield* f.sql`SELECT * FROM ${f.sql(table)}`).toHaveLength(0);
          }
          expect(
            (yield* f.notifications.publish(
              publication("rollback-native", recipient),
            )).idempotentReplay,
          ).toBe(false);
        }),
      ),
  );

  it.effect(
    "requires endpoint/address/purpose/exact-scope consent, without inheriting legacy contact grants",
    () =>
      withSend((f) =>
        Effect.gen(function* () {
          const contact = yield* f.send.createContact({
            email: "person@example.com",
          });
          yield* f.send.recordEmailConsent({
            requestId: "legacy-consent",
            contactId: contact.id,
            status: "subscribed",
            source: "test",
            actor: "staff",
            noticeVersion: "v1",
          });
          const recipient = yield* f.send.resolveEmailRecipient({
            id: contact.id,
          });
          const evidence = {
            subject,
            recipientAddress: recipient.address,
            scope,
            purpose: "marketing" as const,
            actor: "staff",
            source: "explicit-opt-in",
            noticeVersion: "v1",
          };
          yield* f.consent.record({
            ...evidence,
            scope: { ...scope, organizationId: null },
            requestId: "other-scope",
            status: "granted",
          });
          const blocked = yield* f.notifications.publish(
            publication("no-scoped-consent", recipient, marketing),
          );
          expect(
            (yield* f.notifications.getDelivery({
              scope,
              deliveryId: blocked.deliveryIds[0],
            })).delivery,
          ).toMatchObject({
            status: "suppressed",
            errorMessage: "consent_required",
            purpose: "marketing",
          });
          yield* f.consent.record({
            ...evidence,
            requestId: "correct-scope",
            status: "granted",
          });
          const input = publication(
            "permitted-marketing",
            recipient,
            marketing,
          );
          const queued = yield* f.notifications.publish(input);
          expect(
            (yield* f.notifications.getDelivery({
              scope,
              deliveryId: queued.deliveryIds[0],
            })).delivery.status,
          ).toBe("queued");
          yield* f.consent.record({
            ...evidence,
            requestId: "withdraw",
            status: "withdrawn",
          });
          // Replaying a past grant cannot re-subscribe after withdrawal.
          yield* f.consent.record({
            ...evidence,
            requestId: "correct-scope",
            status: "granted",
          });
          expect(yield* f.consent.get(evidence)).toBe("withdrawn");
          const conflict = yield* f.consent
            .record({
              ...evidence,
              requestId: "correct-scope",
              status: "withdrawn",
            })
            .pipe(Effect.flip);
          expect(conflict._tag).toBe("NotificationIdempotencyConflictError");
          yield* f.runtime.runDeliveryWorkerOnce;
          expect(f.transport.sent).toHaveLength(0);
          expect(
            (yield* f.notifications.getDelivery({
              scope,
              deliveryId: queued.deliveryIds[0],
            })).delivery.status,
          ).toBe("suppressed");
          expect(yield* f.notifications.publish(input)).toMatchObject({
            deliveryIds: queued.deliveryIds,
            idempotentReplay: true,
          });
        }),
      ),
  );

  it.effect(
    "supports contactless marketing with explicit evidence, while account opt-out still wins",
    () =>
      withSend((f) =>
        Effect.gen(function* () {
          const recipient = { address: "person@example.com", name: null };
          yield* f.consent.record({
            subject,
            recipientAddress: recipient.address,
            scope,
            purpose: "marketing",
            requestId: "grant-external",
            status: "granted",
            actor: "staff",
            source: "opt-in",
            noticeVersion: "v1",
          });
          const queued = yield* f.notifications.publish(
            publication("external-newsletter", recipient, marketing),
          );
          expect(
            (yield* f.notifications.getDelivery({
              scope,
              deliveryId: queued.deliveryIds[0],
            })).delivery.status,
          ).toBe("queued");
          yield* f.notifications.unsubscribeEmail({
            recipientUserId: scope.recipientUserId,
          });
          yield* f.runtime.runDeliveryWorkerOnce;
          expect(f.transport.sent).toHaveLength(0);
          const receipt = yield* f.notifications.publish(
            publication("essential-receipt", recipient),
          );
          yield* f.runtime.runDeliveryWorkerOnce;
          expect(
            (yield* f.notifications.getDelivery({
              scope,
              deliveryId: receipt.deliveryIds[0],
            })).delivery.status,
          ).toBe("sent");
          expect(yield* f.sql`SELECT id FROM kraksend_contacts`).toHaveLength(
            0,
          );
        }),
      ),
  );

  it.effect(
    "preserves snapshots and conflicts on changed associations, scope or policy",
    () =>
      withSend((f) =>
        Effect.gen(function* () {
          const contact = yield* f.send.createContact({
            email: "person@example.com",
          });
          const recipient = yield* f.send.resolveEmailRecipient({
            id: contact.id,
          });
          const input = publication("immutable", recipient);
          const receipt = yield* f.notifications.publish(input);
          for (const changed of [
            { ...input, scope: { ...scope, workspaceId: "other" } },
            publication("immutable", {
              ...recipient,
              address: "other@example.com",
            }),
            publication("immutable", {
              address: recipient.address,
              name: recipient.name,
            }),
            publication("immutable", recipient, marketing),
          ])
            expect(
              (yield* f.notifications.publish(changed).pipe(Effect.flip))._tag,
            ).toBe("NotificationIdempotencyConflictError");
          yield* f.sql`UPDATE kraksend_email_endpoints SET address = 'other@example.com' WHERE contact_id = ${contact.id}`;
          expect((yield* f.notifications.publish(input)).deliveryIds).toEqual(
            receipt.deliveryIds,
          );
          yield* f.runtime.runDeliveryWorkerOnce;
          const detail = yield* f.notifications.getDelivery({
            scope,
            deliveryId: receipt.deliveryIds[0],
          });
          expect(detail.delivery).toMatchObject({
            recipientAddress: "person@example.com",
            status: "suppressed",
            errorMessage: "contact_endpoint_mismatch",
          });
          expect(f.transport.sent).toHaveLength(0);
        }),
      ),
  );

  it.effect(
    "keeps exact null suppression distinct from legacy broad blocks and reconciles scoped provider feedback",
    () =>
      withSend((f) =>
        Effect.gen(function* () {
          const recipient = { address: "person@example.com", name: null };
          const unscoped = {
            recipientUserId: null,
            organizationId: null,
            workspaceId: null,
          };
          yield* f.notifications.setSuppression({
            scope: unscoped,
            scopeMatch: "exact",
            channel: "email",
            purpose: null,
            recipientAddress: recipient.address,
            reason: "explicit",
            expiresAt: null,
          });
          const receipt = yield* f.notifications.publish(
            publication("scoped-feedback", recipient),
          );
          const blocked = yield* f.notifications.publish({
            ...publication("unscoped-blocked", recipient),
            scope: unscoped,
          });
          expect(
            (yield* f.notifications.getDelivery({
              scope: unscoped,
              deliveryId: blocked.deliveryIds[0],
            })).delivery.status,
          ).toBe("suppressed");
          yield* f.runtime.runDeliveryWorkerOnce;
          const sent = (yield* f.notifications.getDelivery({
            scope,
            deliveryId: receipt.deliveryIds[0],
          })).delivery;
          expect(sent.status).toBe("sent");
          expect(
            yield* f.feedback.record({
              provider: sent.provider!,
              eventId: "scoped-bounce",
              providerMessageId: sent.providerMessageId!,
              recipientAddress: recipient.address,
              kind: "hard_bounce",
              occurredAt: yield* DateTime.nowAsDate,
            }),
          ).toMatchObject({ status: "applied", deliveryId: sent.id });
          const scopes = yield* f.notifications.listSuppressions({
            scope,
            channel: "email",
            includeExpired: false,
          });
          expect(scopes).toHaveLength(1);
          expect(scopes[0]).toMatchObject({
            scopeMatch: "exact",
            scope,
            reason: "provider_hard_bounce",
          });
          const other = { ...scope, organizationId: "org-2" };
          const allowed = yield* f.notifications.publish({
            ...publication("other-org", recipient),
            scope: other,
          });
          expect(
            (yield* f.notifications.getDelivery({
              scope: other,
              deliveryId: allowed.deliveryIds[0],
            })).delivery.status,
          ).toBe("queued");
          expect(
            yield* f.deliveries.overview({ access, query: {} }),
          ).toMatchObject({ total: 1, feedbackCovered: 1, hardBounced: 1 });
          // Creating/resetting an exact block never overwrites/removes the old broad block.
          yield* f.notifications.setSuppression({
            scope: unscoped,
            channel: "email",
            purpose: null,
            recipientAddress: recipient.address,
            reason: "legacy",
            expiresAt: null,
          });
          yield* f.notifications.resetSuppression({
            scope: unscoped,
            scopeMatch: "exact",
            channel: "email",
            purpose: null,
            recipientAddress: recipient.address,
          });
          const legacy = yield* f.notifications.publish({
            ...publication("legacy-block", recipient),
            scope: other,
          });
          expect(
            (yield* f.notifications.getDelivery({
              scope: other,
              deliveryId: legacy.deliveryIds[0],
            })).delivery.status,
          ).toBe("suppressed");
        }),
      ),
  );

  it.effect(
    "enforces separate integration permissions and trusted host recipient authorization before publication or replay",
    () =>
      withSend((f) =>
        Effect.gen(function* () {
          let authorized = false;
          let checks = 0;
          const integration =
            yield* NotificationPublicationIntegration.make.pipe(
              Effect.provideService(NotificationService, f.notifications),
              Effect.provideService(NotificationIntegrationAuthorization, {
                authorize: () => {
                  checks++;
                  return authorized
                    ? Effect.void
                    : Effect.fail(
                        new PublicationAccessDenied({
                          message: "Recipient is not authorized",
                        }),
                      );
                },
              }),
            );
          const grant: typeof PublicationAccess.Type = {
            operations: ["publish"],
            scopes: [{ _tag: "Exact", scope }],
            channels: ["email"],
            purposes: ["transactional"],
            referenceNamespaces: ["order"],
          };
          const principal = { reference: "integration-one", access: grant };
          const input = publication("integration-receipt", {
            address: "person@example.com",
            name: null,
          });
          expect(
            (yield* integration
              .publish(input)
              .pipe(
                Effect.provideService(
                  CurrentNotificationIntegration,
                  principal,
                ),
                Effect.flip,
              ))._tag,
          ).toBe("PublicationAccessDenied");
          expect(
            yield* f.sql`SELECT id FROM notification_deliveries`,
          ).toHaveLength(0);
          authorized = true;
          const receipt = yield* integration
            .publish(input)
            .pipe(
              Effect.provideService(CurrentNotificationIntegration, principal),
            );
          expect(
            (yield* integration
              .cancel({ scope, deliveryId: receipt.deliveryIds[0] })
              .pipe(
                Effect.provideService(
                  CurrentNotificationIntegration,
                  principal,
                ),
                Effect.flip,
              ))._tag,
          ).toBe("PublicationAccessDenied");
          const before = checks;
          expect(
            (yield* integration
              .publish({ ...input, scope: { ...scope, organizationId: null } })
              .pipe(
                Effect.provideService(
                  CurrentNotificationIntegration,
                  principal,
                ),
                Effect.flip,
              ))._tag,
          ).toBe("PublicationAccessDenied");
          expect(checks).toBe(before);
          authorized = false;
          expect(
            (yield* integration
              .publish(input)
              .pipe(
                Effect.provideService(
                  CurrentNotificationIntegration,
                  principal,
                ),
                Effect.flip,
              ))._tag,
          ).toBe("PublicationAccessDenied");
          authorized = true;
          const inspector = {
            ...principal,
            access: { ...grant, operations: ["inspect"] as const },
          };
          const detail = yield* integration
            .inspect({ scope, deliveryId: receipt.deliveryIds[0] })
            .pipe(
              Effect.provideService(CurrentNotificationIntegration, inspector),
            );
          expect(detail.references.map((r) => r.namespace)).toEqual(["order"]);
          expect(detail.delivery).not.toHaveProperty("payload");
          expect(detail.delivery).not.toHaveProperty("idempotencyKey");
        }),
      ),
  );

  it.effect(
    "persists scheduling, cancellation and retry generations without republishing",
    () => {
      let sends = 0;
      return withSend(
        (f) =>
          Effect.gen(function* () {
            const input = publication("scheduled-retry", {
              address: "person@example.com",
              name: null,
            });
            const now = yield* DateTime.nowAsDate;
            const future: PublicationInput = {
              ...input,
              deliveries: input.deliveries.map((delivery) => ({
                ...delivery,
                scheduledFor: new Date(now.getTime() + 60_000),
              })),
            };
            const receipt = yield* f.notifications.publish(future);
            const cancelled = yield* f.notifications.publish({
              ...future,
              idempotencyKey: "cancelled-native",
            });
            yield* f.notifications.cancelDelivery({
              scope,
              deliveryId: cancelled.deliveryIds[0],
            });
            expect(
              (yield* f.notifications.getDelivery({
                scope,
                deliveryId: receipt.deliveryIds[0],
              })).attempts,
            ).toHaveLength(0);
            yield* TestClock.adjust(60_000);
            yield* f.runtime.enqueueDue({ limit: 10 });
            yield* f.runtime.runDeliveryWorkerOnce;
            expect(
              (yield* f.notifications.getDelivery({
                scope,
                deliveryId: receipt.deliveryIds[0],
              })).delivery.status,
            ).toBe("retrying");
            yield* TestClock.adjust(31_000);
            yield* f.runtime.enqueueDue({ limit: 10 });
            yield* f.runtime.runDeliveryWorkerOnce;
            const detail = yield* f.notifications.getDelivery({
              scope,
              deliveryId: receipt.deliveryIds[0],
            });
            expect(detail.delivery.status).toBe("sent");
            expect(
              detail.attempts.map((attempt) => attempt.outcome?._tag),
            ).toEqual(["RetryableFailure", "Sent"]);
            expect(
              (yield* f.notifications.publish(future)).deliveryIds,
            ).toEqual(receipt.deliveryIds);
            expect(
              (yield* f.notifications.getDelivery({
                scope,
                deliveryId: cancelled.deliveryIds[0],
              })).delivery.status,
            ).toBe("cancelled");
          }),
        {
          send: () =>
            ++sends === 1
              ? Effect.fail(
                  new NotificationTransportRetryable({
                    channel: "email",
                    message: "Temporary",
                  }),
                )
              : Effect.succeed({
                  provider: "fake",
                  providerMessageId: "retry-ok",
                }),
        },
      );
    },
  );

  it.effect(
    "rechecks versioned extension requirements before sending and fails closed when missing",
    () => {
      let eligible = true;
      return withSend(
        (f) =>
          Effect.gen(function* () {
            const base = publication("extension-check", {
              address: "person@example.com",
              name: null,
            });
            const input: PublicationInput = {
              ...base,
              deliveries: base.deliveries.map((delivery) => ({
                ...delivery,
                checks: [
                  {
                    key: "eligibility",
                    version: 1,
                    subject: { namespace: "order", value: "order-1" },
                  },
                ],
              })),
            };
            const receipt = yield* f.notifications.publish(input);
            eligible = false;
            yield* f.runtime.runDeliveryWorkerOnce;
            expect(
              (yield* f.notifications.getDelivery({
                scope,
                deliveryId: receipt.deliveryIds[0],
              })).delivery.status,
            ).toBe("suppressed");
            expect(f.transport.sent).toHaveLength(0);
            const missing: PublicationInput = {
              ...input,
              idempotencyKey: "missing-policy",
              deliveries: input.deliveries.map((delivery) => ({
                ...delivery,
                checks: [
                  {
                    key: "eligibility",
                    version: 2,
                    subject: { namespace: "order", value: "order-1" },
                  },
                ],
              })),
            };
            expect(
              (yield* f.notifications.publish(missing).pipe(Effect.flip))._tag,
            ).toBe("NotificationValidationError");
            expect(
              yield* f.sql`SELECT idempotency_key FROM notification_publications WHERE idempotency_key = 'missing-policy'`,
            ).toHaveLength(0);
          }),
        undefined,
        [
          {
            key: "eligibility",
            version: 1,
            check: () =>
              Effect.succeed(
                eligible
                  ? { _tag: "Allow" }
                  : { _tag: "Suppress", reason: "no_longer_eligible" },
              ),
          },
        ],
      );
    },
  );
});
