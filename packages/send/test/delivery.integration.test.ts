import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as TestClock from "effect/testing/TestClock";
import { NotificationTransportRetryable } from "@krak-stack/notifications/transport";
import { withSend } from "./fixtures/send.js";
import { initialTableState } from "../../notifications/src/admin/table.schema.js";
import type { DeliveryAdminAccess } from "../../notifications/src/admin/delivery.schema.js";
import type { NotificationScope } from "../../notifications/src/schema.js";

const scope = {
  recipientUserId: "account-one",
  organizationId: "org-one",
  workspaceId: null,
};
const access: typeof DeliveryAdminAccess.Type = {
  contactManaged: false,
  engineScopes: [{ _tag: "Exact", scope }],
  referenceNamespaces: ["order"],
};
const none: typeof DeliveryAdminAccess.Type = {
  contactManaged: false,
  engineScopes: [],
  referenceNamespaces: [],
};
const publication = (
  key: string,
  selectedScope: NotificationScope = scope,
) => ({
  idempotencyKey: key,
  scope: selectedScope,
  eventKey: "order.receipt",
  eventVersion: 1,
  inbox: null,
  deliveries: [
    {
      key: "email",
      channel: "email",
      purpose: "transactional" as const,
      template: "order-receipt-v2",
      recipientAddress: "person@example.com",
      recipientName: "Customer",
      payloadVersion: 2,
      payload: {
        subject: "Not a safe snapshot",
        text: "private body",
        token: "secret",
      },
      references: [
        { namespace: "order", value: "order-123" },
        { namespace: "private", value: "private-ref" },
      ],
    },
  ],
});
const query = { table: initialTableState };

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "staff delivery administration",
  () => {
    it.effect(
      "inspects original retry generations without scheduling or modifying them",
      () => {
        let sends = 0;
        return withSend(
          (f) =>
            Effect.gen(function* () {
              const published = yield* f.notifications.publish(
                publication("retry"),
              );
              const id = published.deliveryIds[0];
              yield* f.runtime.runDeliveryWorkerOnce;
              const retrying = yield* f.notifications.getDelivery({
                scope,
                deliveryId: id,
              });
              expect(retrying.delivery.status).toBe("retrying");
              expect(
                (yield* f.deliveries.inspect({ access, id })).attempts,
              ).toEqual(retrying.attempts);
              expect(
                yield* f.deliveries.overview({ access, query: {} }),
              ).toMatchObject({ total: 1, retrying: 1 });
              expect(
                (yield* f.notifications.publish(publication("retry")))
                  .deliveryIds,
              ).toEqual(published.deliveryIds);
              expect(
                yield* f.notifications.getDelivery({ scope, deliveryId: id }),
              ).toEqual(retrying);
              yield* TestClock.adjust(31_000);
              yield* f.runtime.enqueueDue({ limit: 10 });
              yield* f.runtime.runDeliveryWorkerOnce;
              const sent = yield* f.notifications.getDelivery({
                scope,
                deliveryId: id,
              });
              expect(sent.delivery.status).toBe("sent");
              const inspection = yield* f.deliveries.inspect({ access, id });
              expect(inspection.attempts).toEqual(sent.attempts);
              expect(inspection.attempts.map((a) => a.outcome?._tag)).toEqual([
                "RetryableFailure",
                "Sent",
              ]);
              expect(
                (yield* f.deliveries.activityTable({ access, query })).total,
              ).toBe(1);
              expect(
                (yield* f.deliveries.overview({ access, query: {} })).total,
              ).toBe(1);
              expect(f.transport.sent).toHaveLength(2);
              expect(f.transport.sent[1]).toMatchObject({
                template: "order-receipt-v2",
                payload: { text: "private body" },
              });
            }),
          {
            send: (input) =>
              Effect.suspend(() =>
                ++sends === 1
                  ? Effect.fail(
                      new NotificationTransportRetryable({
                        channel: "email",
                        message: "Temporary provider failure",
                      }),
                    )
                  : Effect.succeed({
                      provider: "fake",
                      providerMessageId: input.dispatchId,
                    }),
              ),
          },
        );
      },
    );
    it.effect(
      "reads historical engine deliveries with their original scope, template, references and attempts without republishing",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            const original = yield* f.notifications.publish(
              publication("original"),
            );
            yield* f.runtime.runDeliveryWorkerOnce;
            const before = yield* f.notifications.getDelivery({
              scope,
              deliveryId: original.deliveryIds[0],
            });
            const page = yield* f.deliveries.activityTable({ access, query });
            expect(page.total).toBe(1);
            expect(page.items[0]).toMatchObject({
              id: before.delivery.id,
              source: "engine",
              contactId: null,
              campaignId: null,
              recipientUserId: scope.recipientUserId,
              organizationId: scope.organizationId,
              template: "order-receipt-v2",
              purpose: "transactional",
            });
            const inspected = yield* f.deliveries.inspect({
              access,
              id: before.delivery.id,
            });
            expect(inspected.attempts).toEqual(before.attempts);
            expect(inspected.attempts).toHaveLength(1);
            expect(inspected.references.map((r) => r.namespace)).toEqual([
              "order",
            ]);
            expect(JSON.stringify(inspected)).not.toMatch(
              /private body|secret|private-ref|Not a safe snapshot|idempotencyKey|leaseExpiresAt/,
            );
            const replay = yield* f.notifications.publish(
              publication("original"),
            );
            expect(replay.deliveryIds).toEqual(original.deliveryIds);
            expect(
              yield* f.deliveries.overview({ access, query: {} }),
            ).toMatchObject({
              total: 1,
              accepted: 1,
              feedbackCovered: 0,
              feedbackUnavailable: 1,
              confirmed: 0,
            });
            expect(
              yield* f.notifications.getDelivery({
                scope,
                deliveryId: before.delivery.id,
              }),
            ).toEqual(before);
            expect((yield* f.send.listContacts({})).items).toHaveLength(0);
            expect((yield* f.operations.overview({})).total).toBe(0);
            expect(
              yield* f.operations
                .inspect({ id: before.delivery.id })
                .pipe(Effect.flip),
            ).toMatchObject({ _tag: "SendNotFound" });
          }),
        ),
    );

    it.effect(
      "enforces exact nulls, explicit organization grants, source isolation and denial across every read",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            const own = yield* f.notifications.publish(publication("own"));
            const push = publication("push");
            yield* f.notifications.publish({
              ...push,
              deliveries: push.deliveries.map((d) => ({
                ...d,
                channel: "push",
              })),
            });
            const otherWorkspace = yield* f.notifications.publish(
              publication("workspace", { ...scope, workspaceId: "workspace" }),
            );
            const otherOrg = yield* f.notifications.publish(
              publication("other-org", { ...scope, organizationId: "org-two" }),
            );
            const otherAccount = yield* f.notifications.publish(
              publication("other-account", {
                ...scope,
                recipientUserId: "account-two",
              }),
            );
            yield* f.notifications.publish(
              publication("installation", {
                recipientUserId: null,
                organizationId: null,
                workspaceId: null,
              }),
            );
            const contact = yield* f.send.createContact({
              email: "one@example.com",
            });
            const contactEmail = yield* f.send.queueEmail({
              requestId: "contact",
              contactId: contact.id,
              eventKey: "contact",
              purpose: "transactional",
              email: { subject: "Contact mail", text: "Body" },
            });
            expect(
              (yield* f.deliveries.activityTable({ access, query })).items.map(
                (r) => r.id,
              ),
            ).toEqual(own.deliveryIds);
            for (const id of [
              ...otherWorkspace.deliveryIds,
              ...otherOrg.deliveryIds,
              ...otherAccount.deliveryIds,
              contactEmail.deliveryId,
            ])
              expect(
                (yield* f.deliveries.inspect({ access, id }).pipe(Effect.flip))
                  ._tag,
              ).toBe("SendNotFound");
            expect(
              yield* f.deliveries.activityTable({ access: none, query }),
            ).toEqual({ total: 0, items: [] });
            expect(
              (yield* f.deliveries.overview({ access: none, query: {} })).total,
            ).toBe(0);
            expect(
              (yield* f.deliveries
                .inspect({ access: none, id: own.deliveryIds[0] })
                .pipe(Effect.flip))._tag,
            ).toBe("SendNotFound");
            const organizationAccess: typeof DeliveryAdminAccess.Type = {
              ...access,
              engineScopes: [
                { _tag: "Organization", organizationId: "org-one" },
                ...access.engineScopes,
              ],
            };
            expect(
              (yield* f.deliveries.overview({
                access: organizationAccess,
                query: {},
              })).total,
            ).toBe(3);
            expect(
              (yield* f.deliveries.activityTable({
                access: organizationAccess,
                query: { ...query, scope },
              })).total,
            ).toBe(1);
            expect(
              (yield* f.deliveries.activityTable({
                access,
                query: {
                  ...query,
                  scope: { ...scope, organizationId: "org-two" },
                },
              })).total,
            ).toBe(0);
            const installationAccess: typeof DeliveryAdminAccess.Type = {
              ...access,
              engineScopes: [{ _tag: "Installation" }],
            };
            expect(
              (yield* f.deliveries.overview({
                access: installationAccess,
                query: {},
              })).total,
            ).toBe(5);
            const all = { ...installationAccess, contactManaged: true };
            expect(
              (yield* f.deliveries.overview({ access: all, query: {} })).total,
            ).toBe(6);
            expect(
              (yield* f.deliveries.overview({
                access: all,
                query: { source: "contacts" },
              })).total,
            ).toBe(1);
            expect(
              (yield* f.deliveries.overview({
                access: all,
                query: { source: "engine" },
              })).total,
            ).toBe(5);
            expect((yield* f.operations.overview({})).total).toBe(1);
          }),
        ),
    );

    it.effect(
      "counts deliveries once despite references, feedback and attempts, and searches beyond the first page",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            for (let n = 0; n < 23; n++)
              yield* f.notifications.publish({
                ...publication(`order-${n}`),
                eventKey: `order-${String(n).padStart(2, "0")}`,
              });
            const first = yield* f.deliveries.activityTable({
              access,
              query: {
                table: {
                  ...initialTableState,
                  pageSize: 10,
                  sort: [{ id: "eventKey", direction: "asc" }],
                },
              },
            });
            expect(first.total).toBe(23);
            expect(first.items).toHaveLength(10);
            const last = yield* f.deliveries.activityTable({
              access,
              query: {
                table: {
                  ...initialTableState,
                  pageSize: 10,
                  page: 2,
                  sort: [{ id: "eventKey", direction: "asc" }],
                },
              },
            });
            expect(last.items).toHaveLength(3);
            expect(last.items.at(-1)?.eventKey).toBe("order-22");
            expect(
              (yield* f.deliveries.activityTable({
                access,
                query: {
                  table: { ...initialTableState, globalFilter: "order-22" },
                },
              })).total,
            ).toBe(1);
            expect(
              yield* f.deliveries.activityTable({
                access,
                query: { table: { ...initialTableState, page: 9 } },
              }),
            ).toEqual({ total: 23, items: [] });
            for (const value of ["%", "private body", "private-ref", "org-two"])
              expect(
                (yield* f.deliveries.activityTable({
                  access,
                  query: {
                    table: { ...initialTableState, globalFilter: value },
                  },
                })).total,
              ).toBe(0);
            expect(
              (yield* f.deliveries
                .activityTable({
                  access,
                  query: {
                    table: {
                      ...initialTableState,
                      filters: [
                        {
                          id: "payload",
                          kind: "text",
                          operator: "contains",
                          value: "secret",
                        },
                      ],
                    },
                  },
                })
                .pipe(Effect.flip))._tag,
            ).toBe("SendValidationError");
            expect(
              (yield* f.deliveries
                .overview({
                  access,
                  query: { since: new Date(1), until: new Date(0) },
                })
                .pipe(Effect.flip))._tag,
            ).toBe("SendValidationError");
            // Contact-managed confirmed metrics must also stay one-per-delivery.
            const contact = yield* f.send.createContact({
              email: "one@example.com",
            });
            const queued = yield* f.send.queueEmail({
              requestId: "contact",
              contactId: contact.id,
              eventKey: "contact",
              purpose: "transactional",
              email: { subject: "Contact", text: "Body" },
            });
            for (let n = 0; n < 24; n++) yield* f.runtime.runDeliveryWorkerOnce;
            const detail = yield* f.notifications.getDelivery({
              scope: {
                recipientUserId: null,
                organizationId: null,
                workspaceId: null,
              },
              deliveryId: queued.deliveryId,
            });
            const providerMessageId = detail.delivery.providerMessageId;
            if (!providerMessageId)
              return yield* Effect.die(new Error("Missing acceptance"));
            for (const eventId of ["one", "two"])
              yield* f.feedback.record({
                provider: "fake",
                eventId,
                providerMessageId,
                recipientAddress: contact.email,
                kind: "delivered",
                occurredAt: new Date(),
              });
            const all = { ...access, contactManaged: true };
            expect(
              yield* f.deliveries.overview({ access: all, query: {} }),
            ).toMatchObject({
              total: 24,
              confirmed: 1,
              feedbackCovered: 1,
              feedbackUnavailable: 23,
            });
          }),
        ),
    );

    it.effect(
      "respects transaction rollback and existing preference/suppression decisions without changing consent",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            yield* f.sql
              .withTransaction(
                Effect.gen(function* () {
                  yield* f.notifications.publish(publication("rolled-back"));
                  return yield* Effect.fail("rollback");
                }),
              )
              .pipe(Effect.flip);
            expect(
              (yield* f.deliveries.overview({ access, query: {} })).total,
            ).toBe(0);
            yield* f.notifications.setPreference({
              scope,
              eventKey: "order.receipt",
              channel: "email",
              enabled: false,
            });
            const p = publication("preference");
            const suppressed = yield* f.notifications.publish({
              ...p,
              deliveries: p.deliveries.map((d) => ({
                ...d,
                purpose: "notification" as const,
              })),
            });
            expect(
              (yield* f.deliveries.inspect({
                access,
                id: suppressed.deliveryIds[0],
              })).delivery.status,
            ).toBe("suppressed");
            yield* f.notifications.setSuppression({
              scope,
              channel: "email",
              purpose: null,
              recipientAddress: "person@example.com",
              reason: "account block",
              expiresAt: null,
            });
            const blocked = yield* f.notifications.publish(
              publication("blocked"),
            );
            const before = yield* f.notifications.getDelivery({
              scope,
              deliveryId: blocked.deliveryIds[0],
            });
            yield* f.deliveries.inspect({ access, id: blocked.deliveryIds[0] });
            yield* f.deliveries.activityTable({ access, query });
            expect(
              yield* f.notifications.getDelivery({
                scope,
                deliveryId: blocked.deliveryIds[0],
              }),
            ).toEqual(before);
            expect(before.delivery.status).toBe("suppressed");
            expect((yield* f.operations.suppressions({})).items).toHaveLength(
              0,
            );
            expect((yield* f.send.listContacts({})).items).toHaveLength(0);
          }),
        ),
    );
  },
);
