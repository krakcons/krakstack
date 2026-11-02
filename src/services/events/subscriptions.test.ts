import { BrowserCrypto } from "@effect/platform-browser";
import { PgClient } from "@effect/sql-pg";
import { describe, expect, it } from "@effect/vitest";
import {
  Config,
  Deferred,
  Effect,
  Layer,
  Redacted,
  Result,
  Schema,
} from "effect";
import { ClusterWorkflowEngine, SingleRunner } from "effect/cluster";
import { OtlpResource } from "effect/observability";
import { SqlClient } from "effect/sql";
import { TestClock } from "effect/testing";
import { WorkflowEngine } from "effect/workflow";
import { HttpServerRequest } from "effect/http";
import { Events } from "./index";
import { OtlpLogs, type EventIdentity } from "./schema";
import { Otlp } from "../opentelemetry";
import { OtlpEvents } from "../opentelemetry/events";

const telemetry = Layer.mergeAll(
  Layer.succeed(Otlp, { resource: OtlpResource.fromConfig() }),
  OtlpEvents.disabledLayer,
  BrowserCrypto.layer,
);
const options = {
  serviceName: "events-subscriptions-test",
  origin: "https://example.com",
  secret: Redacted.make("test-secret-at-least-thirty-two-characters"),
  requireConsent: false,
};
const eventsLayer = Events.layerWith(options).pipe(Layer.provide(telemetry));
const memoryLayer = eventsLayer.pipe(
  Layer.provideMerge(WorkflowEngine.layerMemory),
);

describe("Events subscriptions", () => {
  it.effect(
    "normalizes application snapshots to JSON before subscriber dispatch",
    () =>
      Effect.gen(function* () {
        const events = yield* Events;
        const handled = yield* Deferred.make<void>();
        const createdAt = new Date("2026-10-31T12:00:00Z");
        yield* events.subscribe({
          name: "snapshots-v1",
          events: ["learner.started"],
          handle: (event) =>
            Effect.gen(function* () {
              expect(event.properties).toEqual({
                attempt: {
                  createdAt: createdAt.toISOString(),
                  values: [null, { completedAt: createdAt.toISOString() }],
                },
              });
              yield* Deferred.succeed(handled, undefined);
            }),
        });
        yield* events.track({
          name: "learner.started",
          properties: {
            attempt: {
              createdAt,
              optional: undefined,
              values: [undefined, { completedAt: createdAt }],
            },
          },
        });
        yield* Deferred.await(handled);
      }).pipe(Effect.scoped, Effect.provide(memoryLayer)),
  );

  it.effect("rejects snapshots that cannot be serialized to JSON", () =>
    Effect.gen(function* () {
      const events = yield* Events;
      expect(
        yield* events
          .track({ name: "example.invalid", properties: { amount: 1n } })
          .pipe(Effect.flip),
      ).toBeInstanceOf(Schema.SchemaError);
    }).pipe(Effect.provide(memoryLayer)),
  );

  it.effect(
    "passes arbitrary JSON properties unchanged without a custom OTLP mapping",
    () =>
      Effect.gen(function* () {
        const events = yield* Events;
        const handled = yield* Deferred.make<void>();
        const properties = {
          learner: {
            id: "learner-1",
            profile: { name: "Learner" },
            attempts: [null, { score: 85, passed: true }],
          },
          metadata: null,
          description: "x".repeat(3_000),
        };
        yield* events.subscribe({
          name: "json-v1",
          events: ["learner.completed"],
          handle: (event) =>
            Effect.gen(function* () {
              expect(event.properties).toEqual(properties);
              yield* Deferred.succeed(handled, undefined);
            }),
        });
        yield* events.track({
          name: "learner.completed",
          eventId: "json-event",
          properties,
        });
        yield* Deferred.await(handled);
      }).pipe(Effect.scoped, Effect.provide(memoryLayer)),
  );

  it.effect(
    "passes authoritative identity without inheriting the publishing HTTP request",
    () =>
      Effect.gen(function* () {
        const events = yield* Events;
        const handled = yield* Deferred.make<void>();
        let seen:
          | { identity: EventIdentity | undefined; request: "Some" | "None" }
          | undefined;
        yield* events.subscribe({
          name: "identity-v1",
          events: ["learner.completed"],
          handle: (event) =>
            Effect.gen(function* () {
              const request = yield* Effect.serviceOption(
                HttpServerRequest.HttpServerRequest,
              );
              seen = { identity: event.identity, request: request._tag };
              yield* Deferred.succeed(handled, undefined);
            }),
        });
        yield* events
          .track({
            name: "learner.completed",
            eventId: "identity-event",
            identity: {
              userId: "spoofed-user",
              organizationId: "spoofed-organization",
            },
          })
          .pipe(
            Effect.annotateLogs({
              "user.id": "verified-user",
              "organization.id": "verified-organization",
            }),
            Effect.provideService(
              HttpServerRequest.HttpServerRequest,
              HttpServerRequest.fromWeb(
                new Request("https://example.com/action"),
              ),
            ),
          );
        yield* Deferred.await(handled);
        expect(seen).toEqual({
          identity: {
            userId: "verified-user",
            organizationId: "verified-organization",
          },
          request: "None",
        });
      }).pipe(Effect.scoped, Effect.provide(memoryLayer)),
  );

  it.effect(
    "supports application-layer subscriptions without dispatching browser ingestion",
    () =>
      Effect.gen(function* () {
        const handled = yield* Deferred.make<void>();
        const seen: string[] = [];
        const subscription = Events.subscribe({
          name: "server-only-v1",
          events: ["browser.page_view"],
          handle: (event) =>
            Effect.gen(function* () {
              seen.push(event.eventId);
              yield* Deferred.succeed(handled, undefined);
            }),
        });
        yield* Effect.gen(function* () {
          const events = yield* Events;
          const body = yield* Schema.encodeEffect(
            Schema.fromJsonString(OtlpLogs),
          )({
            resourceLogs: [
              {
                resource: { attributes: [] },
                scopeLogs: [
                  {
                    scope: { name: "krakstack.application.events" },
                    logRecords: [
                      {
                        eventName: "browser.page_view",
                        timeUnixNano: "0",
                        attributes: [
                          {
                            key: "log.record.uid",
                            value: { stringValue: "browser-event" },
                          },
                          {
                            key: "app.event.schema.version",
                            value: { stringValue: "1" },
                          },
                          {
                            key: "analytics.page_view.id",
                            value: {
                              stringValue:
                                "00000000-0000-4000-8000-000000000001",
                            },
                          },
                          { key: "url.path", value: { stringValue: "/docs" } },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          }).pipe(Effect.orDie);
          yield* events.process(new TextEncoder().encode(body)).pipe(
            Effect.provideService(
              HttpServerRequest.HttpServerRequest,
              HttpServerRequest.fromWeb(
                new Request("https://example.com/api/otel/v1/logs", {
                  headers: { origin: "https://example.com" },
                }),
              ),
            ),
          );
          yield* events.track({
            name: "browser.page_view",
            eventId: "server-event",
          });
          yield* Deferred.await(handled);
          expect(seen).toEqual(["server-event"]);
        }).pipe(
          Effect.provide(subscription.pipe(Layer.provideMerge(memoryLayer))),
        );
      }),
  );

  it.effect(
    "filters server events and deduplicates each subscriber independently",
    () =>
      Effect.gen(function* () {
        const events = yield* Events;
        const first = yield* Deferred.make<void>();
        const second = yield* Deferred.make<void>();
        const seen: Array<{
          name: string;
          eventId: string;
          properties: unknown;
        }> = [];
        yield* events.subscribe({
          name: "first-v1",
          events: ["learner.completed"],
          handle: (event) =>
            Effect.gen(function* () {
              seen.push({
                name: "first",
                eventId: event.eventId,
                properties: event.properties,
              });
              yield* Deferred.succeed(first, undefined);
            }),
        });
        yield* events.subscribe({
          name: "second-v1",
          events: ["learner.completed"],
          handle: (event) =>
            Effect.gen(function* () {
              seen.push({
                name: "second",
                eventId: event.eventId,
                properties: event.properties,
              });
              yield* Deferred.succeed(second, undefined);
            }),
        });
        yield* events.track({ name: "learner.updated", eventId: "ignored" });
        const input = {
          name: "learner.completed",
          eventId: "completion-1",
          properties: { learnerId: "learner-1" },
        };
        yield* events.track(input);
        yield* Deferred.await(first);
        yield* Deferred.await(second);
        yield* events.track(input);
        expect(seen).toHaveLength(2);
        expect(seen.map((item) => item.name).sort()).toEqual([
          "first",
          "second",
        ]);
        expect(seen.every((item) => item.eventId === input.eventId)).toBe(true);
        expect(seen[0]?.properties).toEqual(input.properties);
      }).pipe(Effect.scoped, Effect.provide(memoryLayer)),
  );

  it.effect(
    "keeps a failing subscriber independent and retries it durably",
    () =>
      Effect.gen(function* () {
        const events = yield* Events;
        const failed = yield* Deferred.make<void>();
        const retried = yield* Deferred.make<void>();
        const independent = yield* Deferred.make<void>();
        let attempts = 0;
        yield* events.subscribe({
          name: "retry-v1",
          events: ["invoice.paid"],
          handle: () =>
            Effect.gen(function* () {
              attempts++;
              if (attempts === 1) {
                yield* Deferred.succeed(failed, undefined);
                return yield* Effect.fail("temporary failure");
              }
              yield* Deferred.succeed(retried, undefined);
            }),
        });
        yield* events.subscribe({
          name: "independent-v1",
          events: ["invoice.paid"],
          handle: () => Deferred.succeed(independent, undefined),
        });
        yield* events.track({ name: "invoice.paid", eventId: "invoice-1" });
        yield* Deferred.await(independent);
        yield* Deferred.await(failed);
        yield* TestClock.adjust("5 seconds");
        yield* Deferred.await(retried);
        expect(attempts).toBe(2);
      }).pipe(Effect.scoped, Effect.provide(memoryLayer)),
  );

  it.effect("rejects concurrent duplicate subscriber names", () =>
    Effect.gen(function* () {
      const events = yield* Events;
      const subscription = {
        name: "duplicate-v1",
        events: ["invoice.paid"] as const,
        handle: () => Effect.void,
      };
      const result = yield* Effect.all(
        [events.subscribe(subscription), events.subscribe(subscription)],
        { concurrency: 2 },
      ).pipe(Effect.result);
      expect(Result.isFailure(result) && result.failure._tag).toBe(
        "EventsConfigurationError",
      );
    }).pipe(Effect.scoped, Effect.provide(memoryLayer)),
  );
});

const database = PgClient.layerConfig({
  url: Config.Redacted("TEST_DATABASE_URL"),
});
const isolatedDatabase = Layer.unwrap(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const schema = `events_subscriptions_${crypto.randomUUID().replaceAll("-", "")}`;
    yield* Effect.acquireRelease(sql`CREATE SCHEMA ${sql(schema)}`, () =>
      sql`DROP SCHEMA ${sql(schema)} CASCADE`.pipe(Effect.orDie),
    );
    return PgClient.layerConfig({
      url: Config.Redacted("TEST_DATABASE_URL"),
      startupParameters: Config.succeed({
        search_path: schema,
        TimeZone: "UTC",
      }),
    });
  }),
).pipe(Layer.provide(database));

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "Event subscriber SQL handoff",
  () => {
    it.effect(
      "commits the event and workflow message atomically and rolls both back together",
      () =>
        Effect.gen(function* () {
          const events = yield* Events;
          const sql = yield* SqlClient.SqlClient;
          const handled = yield* Deferred.make<void>();
          let calls = 0;
          yield* events.subscribe({
            name: "atomic-v1",
            events: ["invoice.paid"],
            handle: () =>
              Effect.gen(function* () {
                calls++;
                yield* Deferred.succeed(handled, undefined);
              }),
          });
          const messagesBefore = (yield* sql`SELECT id FROM cluster_messages`)
            .length;
          const event = {
            name: "invoice.paid",
            eventId: "transaction-1",
            properties: { invoiceId: "invoice-1" },
          };
          yield* sql
            .withTransaction(
              events.track(event).pipe(Effect.andThen(Effect.fail("rollback"))),
            )
            .pipe(Effect.ignore);
          expect((yield* sql`SELECT event_id FROM events`).length).toBe(0);
          expect((yield* sql`SELECT id FROM cluster_messages`).length).toBe(
            messagesBefore,
          );
          expect(calls).toBe(0);
          yield* events.track(event);
          yield* Deferred.await(handled);
          expect(calls).toBe(1);
          expect((yield* sql`SELECT event_id FROM events`).length).toBe(1);
        }).pipe(
          Effect.scoped,
          Effect.provide(
            eventsLayer.pipe(
              Layer.provideMerge(
                ClusterWorkflowEngine.layer.pipe(
                  Layer.provide(
                    SingleRunner.layer({ runnerStorage: "memory" }),
                  ),
                ),
              ),
              Layer.provideMerge(telemetry),
              Layer.provideMerge(isolatedDatabase),
            ),
          ),
          TestClock.withLive,
        ),
    );
  },
);
