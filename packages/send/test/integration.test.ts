import { PgClient } from "@effect/sql-pg";
import { NodeServices } from "@effect/platform-node";
import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Redacted } from "effect";
import { SqlClient } from "effect/sql";
import { NotificationService } from "@krak-stack/notifications";
import {
  NotificationRuntime,
  ReminderHandlerRegistry,
} from "@krak-stack/notifications/runtime";
import { makeFakeTransport } from "@krak-stack/notifications/testing";

import { KrakSend } from "../src/index.js";
import { sendRuntimeLayer } from "../src/policy.js";

const withSend = <A, E>(
  run: (fixture: {
    send: KrakSend["Service"];
    notifications: NotificationService["Service"];
    runtime: NotificationRuntime["Service"];
    transport: ReturnType<typeof makeFakeTransport>;
    sql: SqlClient.SqlClient;
  }) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    const url = process.env.TEST_DATABASE_URL;
    if (!url)
      return yield* Effect.die(new Error("TEST_DATABASE_URL is required"));
    const schema = `send_${crypto.randomUUID().replaceAll("-", "")}`;
    const admin = PgClient.layer({ url: Redacted.make(url) });
    const scopedUrl = new URL(url);
    scopedUrl.searchParams.set("options", `-csearch_path=${schema}`);
    const postgres = PgClient.layer({
      url: Redacted.make(scopedUrl.toString()),
    });
    const transport = makeFakeTransport({ channel: "email" });
    const domain = KrakSend.layer.pipe(
      Layer.provideMerge(NotificationService.layer),
    );
    const layer = sendRuntimeLayer.pipe(
      Layer.provideMerge(domain),
      Layer.provide(transport.layer),
      Layer.provide(ReminderHandlerRegistry.emptyLayer),
      Layer.provideMerge(postgres),
      Layer.provide(NodeServices.layer),
    );
    const create = SqlClient.SqlClient.use(
      (sql) => sql`CREATE SCHEMA ${sql(schema)}`,
    ).pipe(Effect.provide(admin));
    const drop = SqlClient.SqlClient.use(
      (sql) => sql`DROP SCHEMA ${sql(schema)} CASCADE`,
    ).pipe(Effect.provide(admin), Effect.orDie);
    return yield* Effect.acquireUseRelease(
      create,
      () =>
        Effect.gen(function* () {
          return yield* run({
            send: yield* KrakSend,
            notifications: yield* NotificationService,
            runtime: yield* NotificationRuntime,
            transport,
            sql: yield* SqlClient.SqlClient,
          });
        }).pipe(Effect.provide(layer)),
      () => drop,
    );
  });

const change = (
  contactId: string,
  requestId: string,
  status: "subscribed" | "unsubscribed",
) => ({
  contactId,
  requestId,
  status,
  source: "test",
  actor: "host-admin",
  noticeVersion: "notice-v1",
});
const email = {
  subject: "Hello",
  text: "Body",
  unsubscribeUrl: "https://example.com/unsubscribe?token=host-signed",
};
const scope = {
  recipientUserId: null,
  organizationId: null,
  workspaceId: null,
};

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "KrakSend PostgreSQL integration",
  () => {
    it.effect(
      "creates anonymous contacts without subscription and rejects duplicate addresses without orphan profiles",
      () =>
        withSend(({ send }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: " Person@Example.com ",
              name: "Person",
              locale: "fr",
            });
            expect(contact.email).toBe("person@example.com");
            expect(contact.emailConsent).toBe("unknown");
            expect(
              (yield* send
                .createContact({ email: "person@example.com" })
                .pipe(Effect.flip))._tag,
            ).toBe("SendConflict");
            expect((yield* send.listContacts({})).items).toHaveLength(1);
            expect(
              (yield* send.listEmailConsentEvents({
                contactId: contact.id,
                query: {},
              })).items,
            ).toHaveLength(0);
          }),
        ),
    );

    it.effect(
      "preserves current withdrawal when an old consent grant is replayed and rejects conflicting replays",
      () =>
        withSend(({ send }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "person@example.com",
            });
            const grant = change(contact.id, "grant", "subscribed");
            const first = yield* send.recordEmailConsent(grant);
            yield* send.recordEmailConsent(
              change(contact.id, "withdraw", "unsubscribed"),
            );
            expect(yield* send.recordEmailConsent(grant)).toEqual(first);
            expect(
              (yield* send.getContact({ id: contact.id })).emailConsent,
            ).toBe("unsubscribed");
            expect(
              (yield* send
                .recordEmailConsent({ ...grant, status: "unsubscribed" })
                .pipe(Effect.flip))._tag,
            ).toBe("SendConflict");
            expect(
              (yield* send.listEmailConsentEvents({
                contactId: contact.id,
                query: {},
              })).items,
            ).toHaveLength(2);
            yield* send.updateContact({
              id: contact.id,
              payload: { name: "Updated", locale: "fr" },
            });
            expect(
              (yield* send.getContact({ id: contact.id })).emailConsent,
            ).toBe("unsubscribed");
          }),
        ),
    );

    it.effect(
      "requires consent before optional sends and rechecks queued deliveries after withdrawal",
      () =>
        withSend(({ send, notifications, runtime, transport }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "person@example.com",
            });
            const request = {
              contactId: contact.id,
              requestId: "notice",
              purpose: "marketing",
              eventKey: "newsletter",
              email,
            } satisfies Parameters<typeof send.queueEmail>[0];
            expect(
              (yield* send.queueEmail(request).pipe(Effect.flip))._tag,
            ).toBe("SendConsentRequired");
            yield* send.recordEmailConsent(
              change(contact.id, "grant", "subscribed"),
            );
            const queued = yield* send.queueEmail(request);
            yield* send.recordEmailConsent(
              change(contact.id, "withdraw", "unsubscribed"),
            );
            yield* runtime.runDeliveryWorkerOnce;
            const detail = yield* notifications.getDelivery({
              scope,
              deliveryId: queued.deliveryId,
            });
            expect(detail.delivery.status).toBe("suppressed");
            expect(detail.delivery.errorMessage).toBe(
              "kraksend_email_consent_required",
            );
            expect(transport.sent).toHaveLength(0);
          }),
        ),
    );

    it.effect(
      "keeps transactional sends working but still honors engine endpoint suppressions",
      () =>
        withSend(({ send, notifications, runtime, transport }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "person@example.com",
            });
            yield* send.recordEmailConsent(
              change(contact.id, "withdraw", "unsubscribed"),
            );
            const request = {
              contactId: contact.id,
              requestId: "reset-1",
              purpose: "transactional",
              eventKey: "reset",
              email,
            } satisfies Parameters<typeof send.queueEmail>[0];
            const first = yield* send.queueEmail(request);
            yield* runtime.runDeliveryWorkerOnce;
            expect(
              (yield* notifications.getDelivery({
                scope,
                deliveryId: first.deliveryId,
              })).delivery.status,
            ).toBe("sent");
            yield* notifications.setSuppression({
              scope,
              channel: "email",
              purpose: null,
              recipientAddress: contact.email,
              reason: "hard_bounce",
              expiresAt: null,
            });
            const blocked = yield* send.queueEmail({
              ...request,
              requestId: "reset-2",
            });
            expect(
              (yield* notifications.getDelivery({
                scope,
                deliveryId: blocked.deliveryId,
              })).delivery.status,
            ).toBe("suppressed");
            expect(transport.sent).toHaveLength(1);
          }),
        ),
    );

    it.effect(
      "replays the original queued message after profile changes and rejects changed content",
      () =>
        withSend(({ send, notifications }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "person@example.com",
              name: "Original",
            });
            const request = {
              contactId: contact.id,
              requestId: "stable",
              purpose: "transactional",
              eventKey: "welcome",
              email,
            } satisfies Parameters<typeof send.queueEmail>[0];
            const first = yield* send.queueEmail(request);
            yield* send.updateContact({
              id: contact.id,
              payload: { name: "New", locale: "fr" },
            });
            expect(yield* send.queueEmail(request)).toEqual({
              ...first,
              idempotentReplay: true,
            });
            expect(
              (yield* notifications.getDelivery({
                scope,
                deliveryId: first.deliveryId,
              })).delivery.recipientName,
            ).toBe("Original");
            expect(
              (yield* send
                .queueEmail({
                  ...request,
                  email: { ...email, subject: "Changed" },
                })
                .pipe(Effect.flip))._tag,
            ).toBe("SendConflict");
            expect(
              (yield* notifications.listDeliveries({
                scope,
                pagination: { limit: 100, cursor: null },
                channel: null,
                statuses: [],
              })).items,
            ).toHaveLength(1);
          }),
        ),
    );

    it.effect("paginates contacts and consent history without duplicates", () =>
      withSend(({ send }) =>
        Effect.gen(function* () {
          const one = yield* send.createContact({ email: "one@example.com" });
          yield* send.createContact({ email: "two@example.com" });
          const page = yield* send.listContacts({ limit: 1 });
          const next = yield* send.listContacts({
            limit: 1,
            after: page.nextCursor ?? undefined,
          });
          expect(next.items[0].id).not.toBe(page.items[0].id);
          expect(next.nextCursor).toBeNull();
          yield* send.recordEmailConsent(change(one.id, "grant", "subscribed"));
          yield* send.recordEmailConsent(
            change(one.id, "withdraw", "unsubscribed"),
          );
          const history = yield* send.listEmailConsentEvents({
            contactId: one.id,
            query: { limit: 1 },
          });
          const older = yield* send.listEmailConsentEvents({
            contactId: one.id,
            query: { limit: 1, before: history.nextCursor ?? undefined },
          });
          expect(older.items[0].requestId).not.toBe(history.items[0].requestId);
          expect(older.nextCursor).toBeNull();
        }),
      ),
    );

    it.effect(
      "rolls back the product record and engine publication together",
      () =>
        withSend(({ send, notifications, sql }) =>
          Effect.gen(function* () {
            const contact = yield* send.createContact({
              email: "person@example.com",
            });
            const request = {
              contactId: contact.id,
              requestId: "rollback",
              purpose: "transactional",
              eventKey: "test",
              email,
            } satisfies Parameters<typeof send.queueEmail>[0];
            yield* sql
              .withTransaction(
                Effect.gen(function* () {
                  yield* send.queueEmail(request);
                  return yield* Effect.fail("rollback requested");
                }),
              )
              .pipe(Effect.flip);
            expect(
              (yield* notifications.listDeliveries({
                scope,
                pagination: { limit: 100, cursor: null },
                channel: null,
                statuses: [],
              })).items,
            ).toHaveLength(0);
            expect((yield* send.queueEmail(request)).idempotentReplay).toBe(
              false,
            );
          }),
        ),
    );

    it.effect("concurrent publication replays allocate only one delivery", () =>
      withSend(({ send, notifications }) =>
        Effect.gen(function* () {
          const contact = yield* send.createContact({
            email: "person@example.com",
          });
          const request = {
            contactId: contact.id,
            requestId: "concurrent",
            purpose: "transactional",
            eventKey: "test",
            email,
          } satisfies Parameters<typeof send.queueEmail>[0];
          const results = yield* Effect.all(
            [send.queueEmail(request), send.queueEmail(request)],
            { concurrency: "unbounded" },
          );
          expect(results[0].deliveryId).toBe(results[1].deliveryId);
          expect(
            results.filter((result) => result.idempotentReplay),
          ).toHaveLength(1);
          expect(
            (yield* notifications.listDeliveries({
              scope,
              pagination: { limit: 100, cursor: null },
              channel: null,
              statuses: [],
            })).items,
          ).toHaveLength(1);
        }),
      ),
    );
  },
);
