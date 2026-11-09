import { PgClient } from "@effect/sql-pg";
import { describe, expect, it } from "@effect/vitest";
import { DateTime, Effect, Layer, Redacted } from "effect";
import { SqlClient } from "effect/sql";
import * as TestClock from "effect/testing/TestClock";

import { NotificationService } from "../src/index.js";
import {
  NotificationRuntime,
  ReminderHandlerRegistry,
} from "../src/runtime.js";
import {
  DispatchPolicyError,
  NotificationDispatchPolicy,
  type DispatchPolicy,
} from "../src/policy.js";
import { makeFakeTransport } from "../src/testing.js";

const scope = {
  recipientUserId: null,
  organizationId: null,
  workspaceId: null,
};

const withPolicy = <A, E>(
  policy: DispatchPolicy,
  run: (fixture: {
    service: NotificationService["Service"];
    runtime: NotificationRuntime["Service"];
    transport: ReturnType<typeof makeFakeTransport>;
  }) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    const url = process.env.TEST_DATABASE_URL;
    if (!url)
      return yield* Effect.die(new Error("TEST_DATABASE_URL is required"));
    const schema = `policy_${crypto.randomUUID().replaceAll("-", "")}`;
    const admin = PgClient.layer({ url: Redacted.make(url) });
    const scopedUrl = new URL(url);
    scopedUrl.searchParams.set("options", `-csearch_path=${schema}`);
    const postgres = PgClient.layer({
      url: Redacted.make(scopedUrl.toString()),
    });
    const transport = makeFakeTransport({ channel: "email" });
    const layer = NotificationRuntime.layer.pipe(
      Layer.provideMerge(NotificationService.layer),
      Layer.provide(Layer.succeed(NotificationDispatchPolicy, policy)),
      Layer.provide(transport.layer),
      Layer.provide(ReminderHandlerRegistry.emptyLayer),
      Layer.provide(postgres),
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
          const service = yield* NotificationService;
          const runtime = yield* NotificationRuntime;
          return yield* run({ service, runtime, transport });
        }).pipe(Effect.provide(layer)),
      () => drop,
    );
  });

const publication = {
  idempotencyKey: "policy-test",
  scope,
  eventKey: "test",
  eventVersion: 1,
  deliveries: [
    {
      key: "email",
      channel: "email",
      purpose: "notification",
      template: null,
      recipientAddress: "person@example.com",
      recipientName: null,
      payloadVersion: 1,
      payload: { subject: "Test", text: "Body" },
      maxAttempts: 1,
    },
  ],
} satisfies Parameters<NotificationService["Service"]["publish"]>[0];

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "dispatch policy PostgreSQL integration",
  () => {
    it.effect(
      "requires the declared policy key before evaluating or sending a protected delivery",
      () => {
        let checked = false;
        return withPolicy(
          {
            check: () => {
              checked = true;
              return Effect.succeed({ _tag: "Allow" });
            },
          },
          ({ service, runtime, transport }) =>
            Effect.gen(function* () {
              yield* service.publish({
                ...publication,
                deliveries: publication.deliveries.map((delivery) => ({
                  ...delivery,
                  dispatchPolicy: "required.v1",
                })),
              });
              expect(
                (yield* runtime.runDeliveryWorkerOnce.pipe(Effect.flip))._tag,
              ).toBe("NotificationQueueError");
              expect(checked).toBe(false);
              expect(transport.sent).toHaveLength(0);
            }),
        );
      },
    );

    it.effect(
      "dispatches with the matching policy and rejects replays that remove its requirement",
      () =>
        withPolicy(
          {
            key: "required.v1",
            check: () => Effect.succeed({ _tag: "Allow" }),
          },
          ({ service, runtime, transport }) =>
            Effect.gen(function* () {
              const input = {
                ...publication,
                deliveries: publication.deliveries.map((delivery) => ({
                  ...delivery,
                  dispatchPolicy: "required.v1",
                })),
              };
              const first = yield* service.publish(input);
              expect((yield* service.publish(input)).idempotentReplay).toBe(
                true,
              );
              expect(
                (yield* service.publish(publication).pipe(Effect.flip))._tag,
              ).toBe("NotificationIdempotencyConflictError");
              const detail = yield* service.getDelivery({
                scope,
                deliveryId: first.deliveryIds[0],
              });
              expect(
                detail.references.some(
                  (reference) =>
                    reference.namespace === "krakstack.dispatch-policy" &&
                    reference.value === "required.v1",
                ),
              ).toBe(true);
              yield* runtime.runDeliveryWorkerOnce;
              expect(transport.sent).toHaveLength(1);
            }),
        ),
    );

    it.effect(
      "suppresses a queued anonymous recipient without calling the provider",
      () =>
        withPolicy(
          {
            check: () =>
              Effect.succeed({
                _tag: "Suppress",
                reason: "contact_unsubscribed",
              }),
          },
          ({ service, runtime, transport }) =>
            Effect.gen(function* () {
              const sent = yield* service.publish(publication);
              yield* runtime.runDeliveryWorkerOnce;
              const detail = yield* service.getDelivery({
                scope,
                deliveryId: sent.deliveryIds[0],
              });
              expect(detail.delivery.status).toBe("suppressed");
              expect(detail.delivery.errorMessage).toBe("contact_unsubscribed");
              expect(transport.sent).toHaveLength(0);
            }),
        ),
    );

    it.effect(
      "defers repeatedly without exhausting the provider attempt budget and resumes once",
      () => {
        let paused = true;
        return withPolicy(
          {
            check: () =>
              Effect.gen(function* () {
                const now = yield* DateTime.nowAsDate;
                return paused
                  ? {
                      _tag: "Defer",
                      reason: "campaign_paused",
                      until: new Date(now.getTime() + 1000),
                    }
                  : { _tag: "Allow" };
              }),
          },
          ({ service, runtime, transport }) =>
            Effect.gen(function* () {
              const sent = yield* service.publish(publication);
              for (let index = 0; index < 3; index++) {
                yield* runtime.runDeliveryWorkerOnce;
                const held = yield* service.getDelivery({
                  scope,
                  deliveryId: sent.deliveryIds[0],
                });
                expect(held.delivery.status).toBe("retrying");
                expect(held.delivery.attempts).toBe(0);
                expect(held.attempts.at(-1)?.outcome).toEqual({
                  _tag: "Skipped",
                  reason: "deferred",
                });
                yield* TestClock.adjust(1001);
                yield* runtime.enqueueDue();
              }
              paused = false;
              yield* runtime.runDeliveryWorkerOnce;
              const detail = yield* service.getDelivery({
                scope,
                deliveryId: sent.deliveryIds[0],
              });
              expect(detail.delivery.status).toBe("sent");
              expect(detail.delivery.attempts).toBe(1);
              expect(transport.sent).toHaveLength(1);
            }),
        );
      },
    );

    it.effect("fails closed when policy evaluation is unavailable", () =>
      withPolicy(
        {
          check: () =>
            Effect.fail(
              new DispatchPolicyError({
                message: "Consent storage unavailable",
              }),
            ),
        },
        ({ service, runtime, transport }) =>
          Effect.gen(function* () {
            yield* service.publish(publication);
            const error = yield* runtime.runDeliveryWorkerOnce.pipe(
              Effect.flip,
            );
            expect(error._tag).toBe("NotificationQueueError");
            expect(transport.sent).toHaveLength(0);
          }),
      ),
    );

    it.effect("rejects past deferrals without sending", () =>
      withPolicy(
        {
          check: () =>
            Effect.succeed({
              _tag: "Defer",
              reason: "invalid",
              until: new Date(0),
            }),
        },
        ({ service, runtime, transport }) =>
          Effect.gen(function* () {
            yield* service.publish(publication);
            expect(
              (yield* runtime.runDeliveryWorkerOnce.pipe(Effect.flip))._tag,
            ).toBe("NotificationQueueError");
            expect(transport.sent).toHaveLength(0);
          }),
      ),
    );
  },
);
