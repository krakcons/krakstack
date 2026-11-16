import { PgClient } from "@effect/sql-pg";
import { describe, expect, it } from "@effect/vitest";
import { DateTime, Effect, Layer, Redacted } from "effect";
import * as TestClock from "effect/testing/TestClock";
import { SqlClient } from "effect/sql";
import { NotificationService } from "../src/index.js";
import { NotificationEmailConsent } from "../src/consent.js";
import {
  NotificationRuntime,
  ReminderHandlerRegistry,
} from "../src/runtime.js";
import {
  publicationPoliciesLayer,
  type PublicationPolicyExtension,
} from "../src/publication-policy.js";
import {
  NotificationDispatchPolicy,
  type DispatchPolicy,
} from "../src/policy.js";
import {
  sendingWindowPolicy,
  sendingWindowRequirement,
} from "../src/sending-window.js";
import {
  makeFakeTransport,
  type FakeTransportOptions,
} from "../src/testing.js";
import { NotificationTransportUnavailable } from "../src/transport.js";
import type { PublicationInput } from "../src/schema.js";

const scope = {
  recipientUserId: "account-1",
  organizationId: "organization-1",
  workspaceId: null,
};
const configuration = {
  timeZone: "America/Edmonton",
  start: "01:00",
  end: "05:00",
};
const setTime = (iso: string) => TestClock.setTime(new Date(iso).getTime());
const input = Effect.fnUntraced(function* (
  key: string,
  overrides: Partial<PublicationInput["deliveries"][number]> = {},
) {
  const publication: PublicationInput = {
    idempotencyKey: key,
    scope,
    eventKey: "example.optional",
    eventVersion: 1,
    deliveries: [
      {
        key: "email",
        channel: "email",
        recipient: { address: "reader@example.com", name: null },
        policy: { kind: "notification" },
        checks: [yield* sendingWindowRequirement(configuration)],
        template: null,
        payloadVersion: 1,
        payload: {
          subject: "Optional update",
          text: "Content",
          unsubscribeUrl: "https://example.com/unsubscribe",
        },
        ...overrides,
      },
    ],
  };
  return publication;
});

type Phase = {
  notifications: NotificationService["Service"];
  runtime: NotificationRuntime["Service"];
  consent: NotificationEmailConsent["Service"];
  sql: SqlClient.SqlClient;
};
type Options = {
  policies?: ReadonlyArray<PublicationPolicyExtension>;
  workerPolicies?: ReadonlyArray<PublicationPolicyExtension>;
  dispatchPolicy?: DispatchPolicy;
  send?: FakeTransportOptions["send"];
};
const makeFixture = Effect.fnUntraced(function* (options: Options) {
  const url = process.env.TEST_DATABASE_URL;
  if (!url)
    return yield* Effect.die(new Error("TEST_DATABASE_URL is required"));
  const schema = `sending_window_${crypto.randomUUID().replaceAll("-", "")}`;
  const admin = PgClient.layer({ url: Redacted.make(url) });
  const scoped = new URL(url);
  scoped.searchParams.set("options", `-csearch_path=${schema}`);
  const postgres = PgClient.layer({ url: Redacted.make(scoped.toString()) });
  yield* Effect.acquireRelease(
    SqlClient.SqlClient.use((sql) => sql`CREATE SCHEMA ${sql(schema)}`).pipe(
      Effect.provide(admin),
    ),
    () =>
      SqlClient.SqlClient.use(
        (sql) => sql`DROP SCHEMA ${sql(schema)} CASCADE`,
      ).pipe(Effect.provide(admin), Effect.orDie),
  );
  const transport = makeFakeTransport({ channel: "email", send: options.send });
  // Every phase builds and closes fresh publisher, runtime, queues and SQL pool.
  // Only PostgreSQL and the observable fake provider survive a simulated restart.
  const phase = <A, E>(run: (fixture: Phase) => Effect.Effect<A, E>) =>
    Effect.gen(function* () {
      return yield* run({
        notifications: yield* NotificationService,
        runtime: yield* NotificationRuntime,
        consent: yield* NotificationEmailConsent,
        sql: yield* SqlClient.SqlClient,
      });
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          NotificationRuntime.layer,
          NotificationEmailConsent.layer,
        ).pipe(
          Layer.provideMerge(
            NotificationService.layer.pipe(
              Layer.provide(
                publicationPoliciesLayer(
                  options.policies ?? [sendingWindowPolicy],
                ),
              ),
            ),
          ),
          Layer.provide(
            publicationPoliciesLayer(
              options.workerPolicies ??
                options.policies ?? [sendingWindowPolicy],
            ),
          ),
          Layer.provide(
            Layer.succeed(
              NotificationDispatchPolicy,
              options.dispatchPolicy ?? {
                check: () => Effect.succeed({ _tag: "Allow" }),
              },
            ),
          ),
          Layer.provide(transport.layer),
          Layer.provide(ReminderHandlerRegistry.emptyLayer),
          Layer.provideMerge(postgres),
        ),
      ),
    );
  return { phase, sent: transport.sent };
});
const withFixture = <A, E>(
  run: (
    fixture: Effect.Success<ReturnType<typeof makeFixture>>,
  ) => Effect.Effect<A, E>,
  options: Options = {},
) => Effect.scoped(makeFixture(options).pipe(Effect.flatMap(run)));
const detail = (f: Phase, id: string) =>
  f.notifications.getDelivery({ scope, deliveryId: id });

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "sending window runtime",
  () => {
    it.effect(
      "recovers a deferred delivery after restart and leaves transactional mail immediate",
      () =>
        withFixture((f) =>
          Effect.gen(function* () {
            yield* setTime("2026-01-15T07:00:00Z");
            const request = yield* input("restart");
            const published = yield* f.phase((p) =>
              Effect.gen(function* () {
                const result = yield* p.notifications.publish({
                  ...request,
                  deliveries: [
                    ...request.deliveries,
                    {
                      ...request.deliveries[0],
                      key: "receipt",
                      checks: [],
                      policy: { kind: "transactional" },
                    },
                  ],
                } satisfies PublicationInput);
                yield* p.runtime.runDeliveryWorkerOnce;
                expect(
                  (yield* detail(p, result.deliveryIds[0])).delivery,
                ).toMatchObject({
                  scheduledFor: new Date("2026-01-15T08:00:00Z"),
                  attempts: 0,
                });
                expect(
                  (yield* detail(p, result.deliveryIds[1])).delivery.status,
                ).toBe("sent");
                return result;
              }),
            );
            expect(f.sent).toHaveLength(1);
            yield* setTime("2026-01-15T07:59:59.999Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                expect((yield* p.runtime.enqueueDue()).deliveries).toBe(0);
              }),
            );
            yield* setTime("2026-01-15T08:00:00Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                expect((yield* p.runtime.enqueueDue()).deliveries).toBe(1);
                yield* p.runtime.runDeliveryWorkerOnce;
                expect(
                  (yield* detail(p, published.deliveryIds[0])).delivery,
                ).toMatchObject({
                  status: "sent",
                  attempts: 1,
                });
              }),
            );
            expect(f.sent).toHaveLength(2);
          }),
        ),
    );

    it.effect(
      "composes with initial scheduling and repeated deferrals do not consume the attempt budget",
      () =>
        withFixture((f) =>
          Effect.gen(function* () {
            yield* setTime("2026-01-15T07:00:00Z");
            const request = yield* input("schedule", {
              scheduledFor: new Date("2026-01-15T13:00:00Z"),
              maxAttempts: 1,
            });
            const published = yield* f.phase((p) =>
              p.notifications.publish(request),
            );
            yield* setTime("2026-01-15T08:00:00Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                expect((yield* p.runtime.enqueueDue()).deliveries).toBe(0);
              }),
            );
            for (const [now, next] of [
              ["2026-01-15T13:00:00Z", "2026-01-16T08:00:00Z"],
              ["2026-01-16T13:00:00Z", "2026-01-17T08:00:00Z"],
            ]) {
              yield* setTime(now);
              yield* f.phase((p) =>
                Effect.gen(function* () {
                  expect((yield* p.runtime.enqueueDue()).deliveries).toBe(1);
                  yield* p.runtime.runDeliveryWorkerOnce;
                  expect(
                    (yield* detail(p, published.deliveryIds[0])).delivery,
                  ).toMatchObject({
                    status: "retrying",
                    attempts: 0,
                    scheduledFor: new Date(next),
                  });
                }),
              );
              expect(f.sent).toHaveLength(0);
            }
            yield* setTime("2026-01-17T08:00:00Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                yield* p.runtime.enqueueDue();
                yield* p.runtime.runDeliveryWorkerOnce;
                const result = yield* detail(p, published.deliveryIds[0]);
                expect(result.delivery).toMatchObject({
                  status: "sent",
                  attempts: 1,
                });
                expect(
                  result.attempts.map((attempt) => attempt.outcome?._tag),
                ).toEqual(["Skipped", "Skipped", "Sent"]);
              }),
            );
          }),
        ),
    );

    it.effect(
      "manual retry cannot accelerate initial eligibility or bypass the window",
      () =>
        withFixture((f) =>
          Effect.gen(function* () {
            yield* setTime("2026-01-15T07:00:00Z");
            const request = yield* input("manual-retry", {
              scheduledFor: new Date("2026-01-15T13:00:00Z"),
            });
            const published = yield* f.phase((p) =>
              Effect.gen(function* () {
                const result = yield* p.notifications.publish(request);
                yield* p.notifications.cancelDelivery({
                  scope,
                  deliveryId: result.deliveryIds[0],
                });
                return result;
              }),
            );
            yield* setTime("2026-01-15T08:00:00Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                const retried = yield* p.notifications.retryDelivery({
                  scope,
                  deliveryId: published.deliveryIds[0],
                });
                expect(retried).toMatchObject({
                  currentJobId: null,
                  scheduledFor: new Date("2026-01-15T13:00:00Z"),
                  attempts: 0,
                });
                expect((yield* p.runtime.enqueueDue()).deliveries).toBe(0);
              }),
            );
            yield* setTime("2026-01-15T13:00:00Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                yield* p.runtime.enqueueDue();
                yield* p.runtime.runDeliveryWorkerOnce;
                expect(
                  (yield* detail(p, published.deliveryIds[0])).delivery,
                ).toMatchObject({
                  attempts: 0,
                  scheduledFor: new Date("2026-01-16T08:00:00Z"),
                });
              }),
            );
            expect(f.sent).toHaveLength(0);
          }),
        ),
    );

    it.effect("rechecks the window for automatic provider retries", () =>
      withFixture(
        (f) =>
          Effect.gen(function* () {
            yield* setTime("2026-01-15T11:59:59Z");
            const request = yield* input("retry", { maxAttempts: 2 });
            const published = yield* f.phase((p) =>
              Effect.gen(function* () {
                const result = yield* p.notifications.publish(request);
                yield* p.runtime.runDeliveryWorkerOnce;
                expect(
                  (yield* detail(p, result.deliveryIds[0])).delivery,
                ).toMatchObject({
                  status: "retrying",
                  attempts: 1,
                });
                return result;
              }),
            );
            yield* setTime("2026-01-15T12:00:29Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                yield* p.runtime.enqueueDue();
                yield* p.runtime.runDeliveryWorkerOnce;
                expect(
                  (yield* detail(p, published.deliveryIds[0])).delivery,
                ).toMatchObject({
                  status: "retrying",
                  attempts: 1,
                  scheduledFor: new Date("2026-01-16T08:00:00Z"),
                });
              }),
            );
            expect(f.sent).toHaveLength(1);
            yield* setTime("2026-01-16T08:00:00Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                yield* p.runtime.enqueueDue();
                yield* p.runtime.runDeliveryWorkerOnce;
                expect(
                  (yield* detail(p, published.deliveryIds[0])).delivery,
                ).toMatchObject({ status: "sent", attempts: 2 });
              }),
            );
            expect(f.sent).toHaveLength(2);
          }),
        {
          send: (attempt) =>
            attempt.attempt === 1
              ? Effect.fail(
                  new NotificationTransportUnavailable({
                    channel: "email",
                    message: "Retry later",
                  }),
                )
              : Effect.succeed({
                  provider: "fake",
                  providerMessageId: attempt.dispatchId,
                }),
        },
      ),
    );

    for (const withdrawal of [
      "consent",
      "unsubscribe",
      "suppression",
    ] as const) {
      it.effect(`does not send after ${withdrawal} while deferred`, () =>
        withFixture((f) =>
          Effect.gen(function* () {
            yield* setTime("2026-01-15T07:00:00Z");
            const subject = {
              namespace: "example.subscription",
              value: "subscriber-1",
            };
            const request = yield* input(
              "withdrawal",
              withdrawal === "consent"
                ? {
                    policy: {
                      kind: "notification",
                      consent: { kind: "stored", subject },
                    },
                  }
                : {},
            );
            const evidence = {
              subject,
              recipientAddress: "reader@example.com",
              scope,
              purpose: "notification" as const,
              actor: "host",
              source: "verified",
              noticeVersion: "v1",
            };
            const published = yield* f.phase((p) =>
              Effect.gen(function* () {
                if (withdrawal === "consent")
                  yield* p.consent.record({
                    ...evidence,
                    requestId: "grant",
                    status: "granted",
                  });
                return yield* p.notifications.publish(request);
              }),
            );
            yield* setTime("2026-01-15T07:30:00Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                if (withdrawal === "consent")
                  yield* p.consent.record({
                    ...evidence,
                    requestId: "withdraw",
                    status: "withdrawn",
                  });
                if (withdrawal === "unsubscribe")
                  yield* p.notifications.unsubscribeEmail({
                    recipientUserId: scope.recipientUserId,
                  });
                if (withdrawal === "suppression")
                  yield* p.notifications.setSuppression({
                    scope,
                    scopeMatch: "exact",
                    channel: "email",
                    purpose: "notification",
                    recipientAddress: "reader@example.com",
                    reason: "blocked",
                    expiresAt: null,
                  });
              }),
            );
            yield* setTime("2026-01-15T08:00:00Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                yield* p.runtime.enqueueDue();
                yield* p.runtime.runDeliveryWorkerOnce;
                expect(
                  (yield* detail(p, published.deliveryIds[0])).delivery.status,
                ).toBe("suppressed");
              }),
            );
            expect(f.sent).toHaveLength(0);
          }),
        ),
      );
    }

    it.effect(
      "does not revive deliveries expiring before opening, including manual retry",
      () =>
        withFixture((f) =>
          Effect.gen(function* () {
            yield* setTime("2026-01-15T07:00:00Z");
            const request = yield* input("expired", {
              expiresAt: new Date("2026-01-15T07:30:00Z"),
            });
            const published = yield* f.phase((p) =>
              p.notifications.publish(request),
            );
            yield* setTime("2026-01-15T08:00:00Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                expect((yield* p.runtime.enqueueDue()).expiredDeliveries).toBe(
                  1,
                );
                expect(
                  (yield* detail(p, published.deliveryIds[0])).delivery.status,
                ).toBe("cancelled");
                yield* p.notifications.retryDelivery({
                  scope,
                  deliveryId: published.deliveryIds[0],
                });
                yield* p.runtime.runDeliveryWorkerOnce;
                expect(
                  (yield* detail(p, published.deliveryIds[0])).delivery.status,
                ).toBe("cancelled");
              }),
            );
            expect(f.sent).toHaveLength(0);
          }),
        ),
    );

    it.effect(
      "preserves replay identity and rejects changed immutable window intent",
      () =>
        withFixture((f) =>
          Effect.gen(function* () {
            yield* setTime("2026-01-15T07:00:00Z");
            const request = yield* input("replay");
            const published = yield* f.phase((p) =>
              p.notifications.publish(request),
            );
            yield* setTime("2026-01-15T09:00:00Z");
            yield* f.phase((p) =>
              Effect.gen(function* () {
                expect(
                  (yield* p.notifications.publish(request)).deliveryIds,
                ).toEqual(published.deliveryIds);
                const changed = yield* sendingWindowRequirement({
                  ...configuration,
                  start: "02:00",
                });
                const conflict = yield* p.notifications
                  .publish({
                    ...request,
                    deliveries: [
                      { ...request.deliveries[0], checks: [changed] },
                    ],
                  })
                  .pipe(Effect.flip);
                expect(conflict._tag).toBe(
                  "NotificationIdempotencyConflictError",
                );
              }),
            );
          }),
        ),
    );

    it.effect(
      "fails closed when the sending window policy is absent on a worker",
      () =>
        withFixture(
          (f) =>
            Effect.gen(function* () {
              yield* setTime("2026-01-15T07:00:00Z");
              const request = yield* input("missing-worker-policy");
              yield* f.phase((p) => p.notifications.publish(request));
              yield* setTime("2026-01-15T08:00:00Z");
              yield* f.phase((p) =>
                Effect.gen(function* () {
                  yield* p.runtime.enqueueDue();
                  expect(
                    (yield* p.runtime.runDeliveryWorkerOnce.pipe(Effect.flip))
                      ._tag,
                  ).toBe("NotificationQueueError");
                }),
              );
              expect(f.sent).toHaveLength(0);
            }),
          { workerPolicies: [] },
        ),
    );

    it.effect(
      "rejects malformed and unsupported window requirements at publication",
      () =>
        withFixture((f) =>
          Effect.gen(function* () {
            yield* setTime("2026-01-15T07:00:00Z");
            const window = yield* sendingWindowRequirement(configuration);
            for (const requirement of [
              { ...window, subject: { ...window.subject, value: "invalid" } },
              { ...window, version: window.version + 1 },
            ]) {
              const request = yield* input("invalid-policy", {
                checks: [requirement],
              });
              yield* f.phase((p) =>
                Effect.gen(function* () {
                  expect(
                    (yield* p.notifications.publish(request).pipe(Effect.flip))
                      ._tag,
                  ).toBe("NotificationValidationError");
                  expect(
                    yield* p.sql`SELECT id FROM notification_deliveries`,
                  ).toHaveLength(0);
                }),
              );
            }
          }),
        ),
    );

    it.effect(
      "composes a second deferral that falls outside the window without sending",
      () =>
        withFixture(
          (f) =>
            Effect.gen(function* () {
              yield* setTime("2026-01-15T07:00:00Z");
              const request = yield* input("two-deferrals", {
                checks: [
                  yield* sendingWindowRequirement(configuration),
                  {
                    key: "domain",
                    version: 1,
                    subject: { namespace: "example", value: "1" },
                  },
                ],
              });
              const published = yield* f.phase((p) =>
                p.notifications.publish(request),
              );
              for (const [now, next] of [
                ["2026-01-15T08:00:00Z", "2026-01-15T13:00:00Z"],
                ["2026-01-15T13:00:00Z", "2026-01-16T08:00:00Z"],
              ]) {
                yield* setTime(now);
                yield* f.phase((p) =>
                  Effect.gen(function* () {
                    yield* p.runtime.enqueueDue();
                    yield* p.runtime.runDeliveryWorkerOnce;
                    expect(
                      (yield* detail(p, published.deliveryIds[0])).delivery,
                    ).toMatchObject({
                      attempts: 0,
                      scheduledFor: new Date(next),
                    });
                  }),
                );
                expect(f.sent).toHaveLength(0);
              }
              yield* setTime("2026-01-16T08:00:00Z");
              yield* f.phase((p) =>
                Effect.gen(function* () {
                  yield* p.runtime.enqueueDue();
                  yield* p.runtime.runDeliveryWorkerOnce;
                  expect(
                    (yield* detail(p, published.deliveryIds[0])).delivery
                      .status,
                  ).toBe("sent");
                }),
              );
            }),
          {
            policies: [
              sendingWindowPolicy,
              {
                key: "domain",
                version: 1,
                check: () =>
                  DateTime.nowAsDate.pipe(
                    Effect.map((now) =>
                      now < new Date("2026-01-15T13:00:00Z")
                        ? {
                            _tag: "Defer",
                            reason: "domain_wait",
                            until: new Date("2026-01-15T13:00:00Z"),
                          }
                        : { _tag: "Allow" },
                    ),
                  ),
              },
            ],
          },
        ),
    );

    for (const denial of ["publication", "dispatch"] as const) {
      it.effect(
        `continues through ${denial} checks after a window allows`,
        () =>
          withFixture(
            (f) =>
              Effect.gen(function* () {
                yield* setTime("2026-01-15T07:00:00Z");
                const request = yield* input("conjunction", {
                  checks: [
                    yield* sendingWindowRequirement(configuration),
                    {
                      key: "domain",
                      version: 1,
                      subject: { namespace: "example", value: "1" },
                    },
                  ],
                });
                const published = yield* f.phase((p) =>
                  p.notifications.publish(request),
                );
                yield* setTime("2026-01-15T08:00:00Z");
                yield* f.phase((p) =>
                  Effect.gen(function* () {
                    yield* p.runtime.enqueueDue();
                    yield* p.runtime.runDeliveryWorkerOnce;
                    expect(
                      (yield* detail(p, published.deliveryIds[0])).delivery
                        .status,
                    ).toBe("suppressed");
                  }),
                );
                expect(f.sent).toHaveLength(0);
              }),
            {
              policies: [
                sendingWindowPolicy,
                {
                  key: "domain",
                  version: 1,
                  check: () =>
                    Effect.succeed(
                      denial === "publication"
                        ? { _tag: "Suppress", reason: "domain_denied" }
                        : { _tag: "Allow" },
                    ),
                },
              ],
              dispatchPolicy: {
                check: () =>
                  Effect.succeed({ _tag: "Suppress", reason: "domain_denied" }),
              },
            },
          ),
      );
    }

    for (const boundary of ["window", "expiry"] as const) {
      it.effect(
        `rechecks ${boundary} after a slow dispatch eligibility check`,
        () => {
          let checks = 0;
          return withFixture(
            (f) =>
              Effect.gen(function* () {
                yield* setTime("2026-01-15T11:59:59Z");
                const request = yield* input(
                  "slow-check",
                  boundary === "expiry"
                    ? {
                        expiresAt: new Date("2026-01-15T12:00:00Z"),
                      }
                    : {},
                );
                const published = yield* f.phase((p) =>
                  Effect.gen(function* () {
                    const result = yield* p.notifications.publish(request);
                    yield* p.runtime.runDeliveryWorkerOnce;
                    return result;
                  }),
                );
                expect(checks).toBe(1);
                expect(f.sent).toHaveLength(0);
                yield* f.phase((p) =>
                  Effect.gen(function* () {
                    expect(
                      (yield* detail(p, published.deliveryIds[0])).delivery
                        .status,
                    ).toBe(boundary === "expiry" ? "cancelled" : "retrying");
                  }),
                );
              }),
            {
              dispatchPolicy: {
                check: () =>
                  Effect.gen(function* () {
                    checks++;
                    yield* TestClock.adjust(1000);
                    return { _tag: "Allow" } as const;
                  }),
              },
            },
          );
        },
      );
    }
  },
);
