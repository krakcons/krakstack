import { PgClient } from "@effect/sql-pg";
import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Redacted } from "effect";
import { SqlClient } from "effect/sql";
import { NotificationService } from "../src/index.js";
import { NotificationEmailConsent } from "../src/consent.js";
import {
  NotificationRuntime,
  ReminderHandlerRegistry,
} from "../src/runtime.js";
import { publicationPoliciesLayer } from "../src/publication-policy.js";
import { makeFakeTransport } from "../src/testing.js";
import type { PublicationInput } from "../src/schema.js";

const scope = {
  recipientUserId: null,
  organizationId: "organization-1",
  workspaceId: null,
};
const input = (key: string): PublicationInput => ({
  idempotencyKey: key,
  scope,
  eventKey: "order.receipt",
  eventVersion: 1,
  deliveries: [
    {
      key: "email",
      channel: "email",
      recipient: { address: "external@example.com", name: null },
      policy: { kind: "transactional" },
      template: "receipt",
      payloadVersion: 1,
      payload: { subject: "Receipt", text: "Content" },
    },
  ],
});

const withPublication = <A, E>(
  run: (fixture: {
    notifications: NotificationService["Service"];
    consent: NotificationEmailConsent["Service"];
    runtime: NotificationRuntime["Service"];
    sql: SqlClient.SqlClient;
    sent: ReturnType<typeof makeFakeTransport>["sent"];
  }) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    const url = process.env.TEST_DATABASE_URL;
    if (!url)
      return yield* Effect.die(new Error("TEST_DATABASE_URL is required"));
    const schema = `publication_${crypto.randomUUID().replaceAll("-", "")}`;
    const admin = PgClient.layer({ url: Redacted.make(url) });
    const scoped = new URL(url);
    scoped.searchParams.set("options", `-csearch_path=${schema}`);
    const postgres = PgClient.layer({ url: Redacted.make(scoped.toString()) });
    const transport = makeFakeTransport({ channel: "email" });
    const publisher = NotificationService.layer.pipe(
      Layer.provide(
        publicationPoliciesLayer([
          {
            key: "eligibility",
            version: 1,
            check: () => Effect.succeed({ _tag: "Allow" }),
          },
        ]),
      ),
    );
    // Deliberately omit extension policies on the worker.
    const services = Layer.mergeAll(
      NotificationRuntime.layer,
      NotificationEmailConsent.layer,
    ).pipe(
      Layer.provideMerge(publisher),
      Layer.provide(transport.layer),
      Layer.provide(ReminderHandlerRegistry.emptyLayer),
      Layer.provideMerge(postgres),
    );
    return yield* Effect.acquireUseRelease(
      SqlClient.SqlClient.use((sql) => sql`CREATE SCHEMA ${sql(schema)}`).pipe(
        Effect.provide(admin),
      ),
      () =>
        Effect.gen(function* () {
          return yield* run({
            notifications: yield* NotificationService,
            consent: yield* NotificationEmailConsent,
            runtime: yield* NotificationRuntime,
            sql: yield* SqlClient.SqlClient,
            sent: transport.sent,
          });
        }).pipe(Effect.provide(services)),
      () =>
        SqlClient.SqlClient.use(
          (sql) => sql`DROP SCHEMA ${sql(schema)} CASCADE`,
        ).pipe(Effect.provide(admin), Effect.orDie),
    );
  });

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "publication without administration",
  () => {
    it.effect(
      "sends external transactional and consent-managed email without accounts, contacts or admin migrations",
      () =>
        withPublication((f) =>
          Effect.gen(function* () {
            const receipt = yield* f.notifications.publish(
              input("external-receipt"),
            );
            yield* f.runtime.runDeliveryWorkerOnce;
            expect(
              (yield* f.notifications.getDelivery({
                scope,
                deliveryId: receipt.deliveryIds[0],
              })).delivery.status,
            ).toBe("sent");
            const subject = {
              namespace: "newsletter",
              value: "external-subscriber-1",
            };
            yield* f.consent.record({
              subject,
              recipientAddress: "external@example.com",
              scope,
              purpose: "marketing",
              requestId: "external-opt-in",
              status: "granted",
              actor: "host",
              source: "explicit-opt-in",
              noticeVersion: "v1",
            });
            const newsletter: PublicationInput = {
              ...input("external-newsletter"),
              deliveries: input("unused").deliveries.map((delivery) => ({
                ...delivery,
                policy: {
                  kind: "marketing",
                  consent: { kind: "stored", subject },
                },
                payload: {
                  subject: "Newsletter",
                  text: "Content",
                  unsubscribeUrl: "https://host.example/unsubscribe",
                },
              })),
            };
            const published = yield* f.notifications.publish(newsletter);
            yield* f.runtime.runDeliveryWorkerOnce;
            expect(
              (yield* f.notifications.getDelivery({
                scope,
                deliveryId: published.deliveryIds[0],
              })).delivery,
            ).toMatchObject({ purpose: "marketing", status: "sent" });
            expect(f.sent).toHaveLength(2);
            expect(
              yield* f.sql`SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name LIKE 'kraksend_%'`,
            ).toHaveLength(0);
          }),
        ),
    );

    it.effect(
      "a worker missing a persisted extension cannot dispatch and a missing contact adapter cannot publish",
      () =>
        withPublication((f) =>
          Effect.gen(function* () {
            const base = input("requires-policy");
            const protectedInput: PublicationInput = {
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
            yield* f.notifications.publish(protectedInput);
            expect(
              (yield* f.runtime.runDeliveryWorkerOnce.pipe(Effect.flip))._tag,
            ).toBe("NotificationQueueError");
            expect(f.sent).toHaveLength(0);
            const contact: PublicationInput = {
              ...base,
              idempotencyKey: "missing-contact-adapter",
              deliveries: base.deliveries.map((delivery) => ({
                ...delivery,
                recipient: {
                  ...delivery.recipient,
                  contact: {
                    id: "019a0000-0000-7000-8000-000000000001",
                    endpointId: "019a0000-0000-7000-8000-000000000002",
                  },
                },
              })),
            };
            expect(
              (yield* f.notifications.publish(contact).pipe(Effect.flip))._tag,
            ).toBe("NotificationValidationError");
            expect(
              yield* f.sql`SELECT idempotency_key FROM notification_publications WHERE idempotency_key = 'missing-contact-adapter'`,
            ).toHaveLength(0);
          }),
        ),
    );
  },
);
