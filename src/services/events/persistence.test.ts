import { PgClient } from "@effect/sql-pg";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { describe, expect, it } from "@effect/vitest";
import { Config, DateTime, Effect, Layer, Redacted, Schema } from "effect";
import { HttpServerRequest } from "effect/http";
import { SqlClient, SqlSchema } from "effect/sql";
import { TestClock } from "effect/testing";

import { Events, type EventsOptions } from "./index";
import {
  EventLogRecord,
  TrackEvent,
  OtlpLogs,
  EventSource,
  StoredEventPayload,
} from "./schema";

const options = {
  serviceName: `analytics-test-${crypto.randomUUID()}`,
  origin: "https://example.com",
  secret: Redacted.make("test-secret-at-least-thirty-two-characters"),
  geolocation: "cloudflare",
} satisfies EventsOptions;
const databases = [
  {
    name: "SQLite",
    enabled: true,
    layer: SqliteClient.layer({ filename: ":memory:" }),
  },
  {
    name: "PostgreSQL",
    enabled: Boolean(process.env.TEST_DATABASE_URL),
    layer: PgClient.layerConfig({ url: Config.Redacted("TEST_DATABASE_URL") }),
  },
];
const attr = (key: string, value: string) => ({
  key,
  value: { stringValue: value },
});
const batch = (now: number, eventId: string = crypto.randomUUID()) =>
  new TextEncoder().encode(
    JSON.stringify({
      resourceLogs: [
        {
          resource: {
            attributes: [attr("service.name", "untrusted-browser-name")],
          },
          scopeLogs: [
            {
              scope: { name: "krakstack.application.events" },
              logRecords: [
                {
                  eventName: "browser.page_view",
                  timeUnixNano: (BigInt(now) * 1_000_000n).toString(),
                  attributes: [
                    attr("app.event.schema.version", "1"),
                    attr("analytics.page_view.id", crypto.randomUUID()),
                    attr("log.record.uid", eventId),
                    attr("url.path", "/docs"),
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  );
const request = HttpServerRequest.fromWeb(
  new Request("https://example.com/api/otel/v1/logs", {
    method: "POST",
    headers: {
      origin: options.origin,
      "cf-connecting-ip": "203.0.113.42",
      "user-agent": "test-browser",
    },
  }),
);
const searchRequest = HttpServerRequest.fromWeb(
  new Request("https://example.com/api/search", { headers: request.headers }),
);
const VisitRow = Schema.Struct({
  event_id: Schema.String,
  source: EventSource,
  session_id: Schema.NullOr(Schema.NonEmptyString),
  anonymous_id: Schema.NullOr(Schema.NonEmptyString),
}).annotate({ identifier: "StoredVisitTestRow" });

const forwardedSession = Effect.fnUntraced(function* (body: Uint8Array) {
  const payload = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(OtlpLogs),
  )(new TextDecoder().decode(body));
  const record = yield* Schema.decodeUnknownEffect(EventLogRecord)(
    payload.resourceLogs[0]?.scopeLogs[0]?.logRecords[0],
  );
  const value = record.attributes.find(
    ({ key }) => key === "session.id",
  )?.value;
  return value && "stringValue" in value ? value.stringValue : undefined;
});

for (const database of databases) {
  const layer = Events.layer(options).pipe(Layer.provideMerge(database.layer));
  const fixture = Effect.gen(function* () {
    const analytics = yield* Events;
    const sql = yield* SqlClient.SqlClient;
    yield* Effect.addFinalizer(() =>
      Effect.gen(function* () {
        yield* sql`DELETE FROM events WHERE service_name IN (${options.serviceName}, ${options.serviceName + "-other"})`;
      }).pipe(Effect.orDie),
    );
    const visits = SqlSchema.findAll({
      Request: Schema.Void,
      Result: VisitRow,
      execute:
        () => sql`SELECT event_id, source, session_id, anonymous_id FROM events
        WHERE service_name = ${options.serviceName} ORDER BY received_at, event_id`,
    });
    return { analytics, sql, visits };
  });
  describe.skipIf(!database.enabled)(
    `Events persistence (${database.name})`,
    () => {
      it.effect(
        "shares custom geolocation across browser and server visits without storing raw IPs",
        () =>
          Effect.gen(function* () {
            const { sql, visits } = yield* fixture;
            let calls = 0;
            const analytics = yield* Events.make({
              ...options,
              geolocation: () =>
                Effect.sync(() => {
                  calls++;
                  return {
                    ip: "2001:db8::42",
                    country: "CA",
                    region: "ON",
                    city: "Toronto",
                  };
                }),
            });
            yield* analytics
              .track({ eventId: "custom-search", name: "search" })
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  searchRequest,
                ),
              );
            const output = yield* analytics
              .process(batch(DateTime.toEpochMillis(yield* DateTime.now)))
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
              );
            const rows = yield* visits();
            expect(rows).toHaveLength(2);
            expect(rows[0]!.session_id).not.toBeNull();
            expect(rows[0]!.anonymous_id).not.toBeNull();
            expect(rows[1]!.session_id).toBe(rows[0]!.session_id);
            expect(rows[1]!.anonymous_id).toBe(rows[0]!.anonymous_id);
            expect(yield* forwardedSession(output.body)).toBe(
              rows[0]!.session_id,
            );
            const stored =
              yield* sql`SELECT payload_json FROM events WHERE service_name = ${options.serviceName} AND event_id = 'custom-search'`;
            const payload = yield* Schema.decodeUnknownEffect(
              StoredEventPayload,
            )(stored[0]);
            const record = yield* Schema.decodeUnknownEffect(EventLogRecord)(
              payload.payload_json.resourceLogs[0]?.scopeLogs[0]?.logRecords[0],
            );
            expect(record.attributes).toEqual(
              expect.arrayContaining([
                attr("geo.country.iso_code", "CA"),
                attr("geo.region.iso_code", "CA-ON"),
                attr("geo.locality.name", "Toronto"),
              ]),
            );
            expect(JSON.stringify(payload)).not.toContain("2001:db8::42");
            yield* analytics.track({
              eventId: "background-custom-geo",
              name: "import",
            });
            expect(calls).toBe(2);
            expect(
              (yield* visits()).find(
                (row) => row.event_id === "background-custom-geo",
              )!.session_id,
            ).toBeNull();
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "rejects failed or invalid custom geolocation without persisting events or extending visits",
        () =>
          Effect.gen(function* () {
            const { analytics, sql } = yield* fixture;
            yield* analytics
              .track({ eventId: "original-geo", name: "search" })
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  searchRequest,
                ),
              );
            const stored =
              yield* sql`SELECT payload_json, received_at FROM events WHERE service_name = ${options.serviceName}`;
            const resolvers: ReadonlyArray<
              Exclude<EventsOptions["geolocation"], string | undefined>
            > = [
              () => Effect.fail("provider unavailable"),
              () => Effect.succeed({ ip: "not-an-ip" }),
              () => Effect.succeed({ country: "invalid" }),
              () => Effect.succeed({ region: "CA-ON" }),
              () => Effect.succeed({ city: "" }),
            ];
            for (const geolocation of resolvers) {
              const failing = yield* Events.make({ ...options, geolocation });
              expect(
                yield* failing
                  .track({ eventId: "failed-geo", name: "search" })
                  .pipe(
                    Effect.provideService(
                      HttpServerRequest.HttpServerRequest,
                      searchRequest,
                    ),
                    Effect.result,
                  ),
              ).toMatchObject({
                _tag: "Failure",
                failure: { _tag: "EventsPersistenceError" },
              });
              expect(
                yield* failing
                  .process(batch(DateTime.toEpochMillis(yield* DateTime.now)))
                  .pipe(
                    Effect.provideService(
                      HttpServerRequest.HttpServerRequest,
                      request,
                    ),
                    Effect.result,
                  ),
              ).toMatchObject({ _tag: "Failure", failure: { status: 503 } });
            }
            expect(
              yield* sql`SELECT payload_json, received_at FROM events WHERE service_name = ${options.serviceName}`,
            ).toEqual(stored);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "shares visits between server events and browser ingestion and counts both as activity",
        () =>
          Effect.gen(function* () {
            const { analytics, sql, visits } = yield* fixture;
            const track = (eventId: string) =>
              analytics
                .track({ eventId, name: "search" })
                .pipe(
                  Effect.provideService(
                    HttpServerRequest.HttpServerRequest,
                    searchRequest,
                  ),
                );
            const page = () =>
              Effect.gen(function* () {
                const output = yield* analytics
                  .process(batch(DateTime.toEpochMillis(yield* DateTime.now)))
                  .pipe(
                    Effect.provideService(
                      HttpServerRequest.HttpServerRequest,
                      request,
                    ),
                  );
                return yield* forwardedSession(output.body);
              });
            yield* track("first-search");
            const first = (yield* visits())[0]!;
            expect(first.session_id).not.toBeNull();
            expect(first.anonymous_id).not.toBeNull();
            const stored =
              yield* sql`SELECT payload_json FROM events WHERE service_name = ${options.serviceName} AND event_id = 'first-search'`;
            const payload = yield* Schema.decodeUnknownEffect(
              StoredEventPayload,
            )(stored[0]);
            const record = yield* Schema.decodeUnknownEffect(EventLogRecord)(
              payload.payload_json.resourceLogs[0]?.scopeLogs[0]?.logRecords[0],
            );
            expect(record.attributes).toEqual(
              expect.arrayContaining([
                attr("session.id", first.session_id!),
                attr("analytics.anonymous_id", first.anonymous_id!),
                attr("analytics.identity.mode", "daily"),
                attr("app.event.source", "server"),
              ]),
            );
            expect(JSON.stringify(payload)).not.toMatch(
              /203\.0\.113\.42|test-browser/,
            );
            yield* TestClock.adjust("29 minutes");
            expect(yield* page()).toBe(first.session_id);
            yield* TestClock.adjust("29 minutes");
            yield* track("record-view");
            yield* TestClock.adjust("29 minutes");
            expect(yield* page()).toBe(first.session_id);
            const active = yield* visits();
            expect(active).toHaveLength(4);
            expect(new Set(active.map((row) => row.session_id))).toEqual(
              new Set([first.session_id]),
            );
            expect(new Set(active.map((row) => row.anonymous_id))).toEqual(
              new Set([first.anonymous_id]),
            );
            yield* TestClock.adjust("30 minutes");
            yield* track("new-visit");
            const next = (yield* visits()).find(
              (row) => row.event_id === "new-visit",
            )!;
            expect(next.session_id).not.toBeNull();
            expect(next.session_id).not.toBe(first.session_id);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "serializes concurrent first browser and server arrivals across service instances",
        () =>
          Effect.gen(function* () {
            const { analytics, visits } = yield* fixture;
            const second = yield* Events.make(options);
            const now = DateTime.toEpochMillis(yield* DateTime.now);
            yield* Effect.forEach(
              Array.from({ length: 8 }),
              (_, index) =>
                Effect.gen(function* () {
                  if (index % 2) {
                    yield* analytics
                      .process(batch(now))
                      .pipe(
                        Effect.provideService(
                          HttpServerRequest.HttpServerRequest,
                          request,
                        ),
                      );
                  } else {
                    yield* second
                      .track({ eventId: `server-${index}`, name: "search" })
                      .pipe(
                        Effect.provideService(
                          HttpServerRequest.HttpServerRequest,
                          searchRequest,
                        ),
                      );
                  }
                }),
              { concurrency: "unbounded" },
            );
            const rows = yield* visits();
            expect(rows).toHaveLength(8);
            expect(
              rows.every(
                (row) => row.session_id !== null && row.anonymous_id !== null,
              ),
            ).toBe(true);
            expect(new Set(rows.map((row) => row.session_id)).size).toBe(1);
            expect(new Set(rows.map((row) => row.anonymous_id)).size).toBe(1);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "does not invent visits for background events or missing/untrusted request metadata",
        () =>
          Effect.gen(function* () {
            const { analytics, visits } = yield* fixture;
            yield* analytics.track({ eventId: "background", name: "import" });
            const untrusted = yield* Events.make({
              ...options,
              geolocation: undefined,
            });
            yield* untrusted
              .track({ eventId: "untrusted", name: "search" })
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  searchRequest,
                ),
              );
            for (const [eventId, headers] of [
              ["missing-ip", { "user-agent": "test-browser" }],
              ["missing-ua", { "cf-connecting-ip": "203.0.113.42" }],
              [
                "invalid-ip",
                {
                  "cf-connecting-ip": "not-an-ip",
                  "user-agent": "test-browser",
                },
              ],
            ] satisfies ReadonlyArray<
              readonly [string, Record<string, string>]
            >) {
              yield* analytics.track({ eventId, name: "search" }).pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  HttpServerRequest.fromWeb(
                    new Request("https://example.com/api/search", {
                      headers: {
                        ...headers,
                        "x-session-id": "forged-session",
                      },
                    }),
                  ),
                ),
              );
            }
            const rows = yield* visits();
            expect(rows).toHaveLength(5);
            expect(
              rows.every(
                (row) => row.session_id === null && row.anonymous_id === null,
              ),
            ).toBe(true);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "honors trusted explicit session annotations without accepting request session claims",
        () =>
          Effect.gen(function* () {
            const { analytics, visits } = yield* fixture;
            yield* analytics
              .track({ eventId: "explicit", name: "search" })
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  searchRequest,
                ),
                Effect.annotateLogs({ "session.id": "application-session" }),
              );
            const output = yield* analytics
              .process(batch(DateTime.toEpochMillis(yield* DateTime.now)))
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
              );
            expect(yield* forwardedSession(output.body)).toBe(
              "application-session",
            );
            yield* analytics
              .track({
                eventId: "header-claim",
                name: "view",
                properties: { "session.id": "property-forgery" },
              })
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  HttpServerRequest.fromWeb(
                    new Request("https://example.com/api/records/1", {
                      headers: {
                        ...request.headers,
                        "x-session-id": "header-forgery",
                      },
                    }),
                  ),
                ),
              );
            expect(
              new Set((yield* visits()).map((row) => row.session_id)),
            ).toEqual(new Set(["application-session"]));
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "keeps server retry attribution across midnight and does not extend activity",
        () =>
          Effect.gen(function* () {
            const { analytics, sql, visits } = yield* fixture;
            yield* TestClock.adjust("1439 minutes");
            const input = {
              eventId: "retry",
              name: "search",
              properties: { query: "food" },
            };
            yield* analytics
              .track(input)
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  searchRequest,
                ),
              );
            const stored =
              yield* sql`SELECT session_id, anonymous_id, received_at, payload_json FROM events WHERE service_name = ${options.serviceName}`;
            const first = (yield* visits())[0]!;
            yield* TestClock.adjust("2 minutes");
            for (const retryRequest of [
              searchRequest,
              HttpServerRequest.fromWeb(
                new Request("https://example.com/api/search", {
                  headers: {
                    ...request.headers,
                    "user-agent": "different-browser",
                    "cf-connecting-ip": "203.0.113.43",
                  },
                }),
              ),
            ]) {
              expect(
                yield* analytics
                  .track(input)
                  .pipe(
                    Effect.provideService(
                      HttpServerRequest.HttpServerRequest,
                      retryRequest,
                    ),
                  ),
              ).toEqual({ eventId: input.eventId, inserted: false });
            }
            expect(
              yield* sql`SELECT session_id, anonymous_id, received_at, payload_json FROM events WHERE service_name = ${options.serviceName}`,
            ).toEqual(stored);
            yield* analytics
              .track({ eventId: "new-day", name: "view" })
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  searchRequest,
                ),
              );
            const next = (yield* visits()).find(
              (row) => row.event_id === "new-day",
            )!;
            expect(next.anonymous_id).not.toBe(first.anonymous_id);
            expect(next.session_id).not.toBe(first.session_id);
            yield* TestClock.adjust("29 minutes");
            yield* analytics
              .track({ eventId: "new-day", name: "view" })
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  searchRequest,
                ),
              );
            yield* TestClock.adjust("1 minute");
            yield* analytics
              .track({ eventId: "after-idle", name: "view" })
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  searchRequest,
                ),
              );
            expect(
              (yield* visits()).find((row) => row.event_id === "after-idle")!
                .session_id,
            ).not.toBe(next.session_id);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "rolls back request-attributed server events with the application transaction",
        () =>
          Effect.gen(function* () {
            const { analytics, sql, visits } = yield* fixture;
            yield* Effect.gen(function* () {
              yield* analytics.track({
                eventId: "rollback-session",
                name: "search",
              });
              expect((yield* visits())[0]!.session_id).not.toBeNull();
              return yield* Effect.fail("abort");
            }).pipe(
              sql.withTransaction,
              Effect.provideService(
                HttpServerRequest.HttpServerRequest,
                searchRequest,
              ),
              Effect.result,
            );
            expect(yield* visits()).toEqual([]);
            const output = yield* analytics
              .process(batch(DateTime.toEpochMillis(yield* DateTime.now)))
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
              );
            expect(yield* forwardedSession(output.body)).toBeDefined();
            expect(yield* visits()).toHaveLength(1);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect("rejects retries under a different verified principal", () =>
        Effect.gen(function* () {
          const { sql } = yield* fixture;
          let userId = "user-1";
          const events = yield* Events.make({
            ...options,
            identity: () => Effect.succeed({ userId }),
          });
          const original = batch(DateTime.toEpochMillis(yield* DateTime.now));
          yield* events
            .process(original)
            .pipe(
              Effect.provideService(
                HttpServerRequest.HttpServerRequest,
                request,
              ),
            );
          userId = "user-2";
          expect(
            yield* events
              .process(original)
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
                Effect.result,
              ),
          ).toMatchObject({ _tag: "Failure", failure: { status: 409 } });
          expect(
            yield* sql`SELECT user_id FROM events WHERE service_name = ${options.serviceName}`,
          ).toEqual([{ user_id: "user-1" }]);
        }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "isolates browser IDs from trusted server writes and rejects conflicting server content",
        () =>
          Effect.gen(function* () {
            const { analytics: events, sql } = yield* fixture;
            const eventId = "order:1:completed";
            yield* events
              .process(
                batch(DateTime.toEpochMillis(yield* DateTime.now), eventId),
              )
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
              );
            const input = {
              eventId,
              name: "order.completed",
              category: "audit",
              properties: { total: 42 },
            } satisfies TrackEvent;
            const actor = {
              "app.actor.type": "user",
              "app.actor.id": "verified-user",
            };
            expect(
              (yield* events.track(input).pipe(Effect.annotateLogs(actor)))
                .inserted,
            ).toBe(true);
            yield* TestClock.adjust("1 minute");
            expect(
              (yield* events.track(input).pipe(Effect.annotateLogs(actor)))
                .inserted,
            ).toBe(false);
            for (const changed of [
              { ...input, name: "order.cancelled" },
              { ...input, properties: { total: 99 } },
            ]) {
              expect(
                yield* events
                  .track(changed)
                  .pipe(Effect.annotateLogs(actor), Effect.result),
              ).toMatchObject({
                _tag: "Failure",
                failure: { _tag: "EventConflictError", eventId },
              });
            }
            expect(
              yield* sql`SELECT source, event_name FROM events WHERE service_name = ${options.serviceName} ORDER BY source`,
            ).toEqual([
              { source: "browser", event_name: "browser.page_view" },
              { source: "server", event_name: "order.completed" },
            ]);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "preserves the authoritative session across midnight, changed/missing visitor metadata, and concurrent retries",
        () =>
          Effect.gen(function* () {
            const { analytics: events, sql } = yield* fixture;
            yield* TestClock.adjust("1439 minutes");
            const original = batch(DateTime.toEpochMillis(yield* DateTime.now));
            const first = yield* events
              .process(original)
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
              );
            const stored =
              yield* sql`SELECT session_id, received_at, payload_json FROM events WHERE service_name = ${options.serviceName}`;
            const session = yield* forwardedSession(first.body);
            expect(session).toBeDefined();
            yield* TestClock.adjust("2 minutes");
            const changed = HttpServerRequest.fromWeb(
              new Request("https://example.com/api/otel/v1/logs", {
                headers: {
                  ...request.headers,
                  "cf-connecting-ip": "203.0.113.43",
                  "user-agent": "changed-browser",
                },
              }),
            );
            const missing = HttpServerRequest.fromWeb(
              new Request("https://example.com/api/otel/v1/logs", {
                headers: { origin: options.origin },
              }),
            );
            const results = yield* Effect.forEach(
              [request, changed, missing],
              (request) =>
                events.process(original).pipe(
                  Effect.provideService(
                    HttpServerRequest.HttpServerRequest,
                    request,
                  ),
                  Effect.flatMap(({ body }) => forwardedSession(body)),
                ),
              { concurrency: "unbounded" },
            );
            expect(results).toEqual([session, session, session]);
            expect(
              yield* sql`SELECT session_id, received_at, payload_json FROM events WHERE service_name = ${options.serviceName}`,
            ).toEqual(stored);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "returns 409 for a browser ID reused with different content without changing the original",
        () =>
          Effect.gen(function* () {
            const { analytics: events, sql } = yield* fixture;
            const now = DateTime.toEpochMillis(yield* DateTime.now);
            const eventId = crypto.randomUUID();
            yield* events
              .process(batch(now, eventId))
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
              );
            const stored =
              yield* sql`SELECT payload_json FROM events WHERE service_name = ${options.serviceName}`;
            const result = yield* events
              .process(batch(now, eventId))
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
                Effect.result,
              );
            expect(result).toMatchObject({
              _tag: "Failure",
              failure: { status: 409 },
            });
            expect(
              yield* sql`SELECT payload_json FROM events WHERE service_name = ${options.serviceName}`,
            ).toEqual(stored);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "reuses event-derived visits, rotates at 30 minutes, and forwards the original ID on retries",
        () =>
          Effect.gen(function* () {
            const { analytics, sql } = yield* fixture;
            const send = (body: Uint8Array) =>
              analytics.process(body).pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
                Effect.flatMap((result) => forwardedSession(result.body)),
              );
            const first = yield* send(
              batch(DateTime.toEpochMillis(yield* DateTime.now)),
            );
            expect(first).toBeDefined();
            yield* TestClock.adjust("29 minutes");
            const repeatBody = batch(
              DateTime.toEpochMillis(yield* DateTime.now),
            );
            expect(yield* send(repeatBody)).toBe(first);
            yield* TestClock.adjust("30 minutes");
            const next = yield* send(
              batch(DateTime.toEpochMillis(yield* DateTime.now)),
            );
            expect(next).not.toBe(first);
            yield* TestClock.adjust("1 minute");
            expect(yield* send(repeatBody)).toBe(first);
            yield* TestClock.adjust("29 minutes");
            // A duplicate must not extend an old or current visit's activity.
            expect(
              yield* send(batch(DateTime.toEpochMillis(yield* DateTime.now))),
            ).not.toBe(next);
            expect(
              yield* sql`SELECT event_id FROM events WHERE service_name = ${options.serviceName}`,
            ).toHaveLength(4);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "serializes first-time arrivals across service instances and isolates sites and visitors",
        () =>
          Effect.gen(function* () {
            const { analytics } = yield* fixture;
            const second = yield* Events.make(options);
            const now = DateTime.toEpochMillis(yield* DateTime.now);
            const sessions = yield* Effect.forEach(
              Array.from({ length: 8 }),
              (_, index) =>
                (index % 2 ? analytics : second).process(batch(now)).pipe(
                  Effect.provideService(
                    HttpServerRequest.HttpServerRequest,
                    request,
                  ),
                  Effect.flatMap((result) => forwardedSession(result.body)),
                ),
              { concurrency: "unbounded" },
            );
            expect(sessions[0]).toBeDefined();
            expect(new Set(sessions).size).toBe(1);
            const otherSite = yield* Events.make({
              ...options,
              serviceName: options.serviceName + "-other",
            });
            const other = yield* otherSite
              .process(batch(now))
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
              );
            expect(yield* forwardedSession(other.body)).not.toBe(sessions[0]);
            const differentVisitor = HttpServerRequest.fromWeb(
              new Request("https://example.com/api/otel/v1/logs", {
                headers: {
                  ...request.headers,
                  "cf-connecting-ip": "203.0.113.43",
                },
              }),
            );
            const separate = yield* analytics
              .process(batch(now))
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  differentVisitor,
                ),
              );
            expect(yield* forwardedSession(separate.body)).not.toBe(
              sessions[0],
            );
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "keeps event context self-contained and never requires a session table",
        () =>
          Effect.gen(function* () {
            const { sql } = yield* fixture;
            const tables = yield* sql.onDialectOrElse({
              pg: () =>
                sql`SELECT table_name AS name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'analytics_sessions'`,
              orElse: () =>
                sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'analytics_sessions'`,
            });
            expect(tables).toHaveLength(0);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );
      if (database.name === "PostgreSQL") {
        it.effect(
          "stores native JSONB and supports indexed containment search",
          () =>
            Effect.gen(function* () {
              const { analytics, sql } = yield* fixture;
              yield* analytics.track({
                eventId: "json-search",
                name: "purchase",
              });
              expect(
                yield* sql`SELECT pg_typeof(payload_json)::text AS type FROM events WHERE service_name = ${options.serviceName}`,
              ).toEqual([{ type: "jsonb" }]);
              expect(
                yield* sql`SELECT event_id FROM events
             WHERE service_name = ${options.serviceName}
              AND payload_json @> ${'{"resourceLogs":[{"scopeLogs":[{"logRecords":[{"eventName":"purchase"}]}]}]}'}::jsonb`,
              ).toEqual([{ event_id: "json-search" }]);
              expect(
                yield* sql`SELECT indexname FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'events_payload'`,
              ).toHaveLength(1);
            }).pipe(Effect.scoped, Effect.provide(layer)),
        );
      }
      it.effect(
        "deduplicates per site, preserves trusted identity, and joins application transactions",
        () =>
          Effect.gen(function* () {
            const { analytics, sql } = yield* fixture;
            const input = {
              eventId: "purchase-1",
              name: "purchase",
              identity: { userId: "user-1", organizationId: "org-1" },
            };
            expect((yield* analytics.track(input)).inserted).toBe(true);
            expect((yield* analytics.track(input)).inserted).toBe(false);
            const other = yield* Events.make({
              ...options,
              serviceName: options.serviceName + "-other",
            });
            expect((yield* other.track(input)).inserted).toBe(true);
            const rows =
              yield* sql`SELECT user_id, organization_id FROM events WHERE service_name = ${options.serviceName}`;
            expect(rows).toEqual([
              { user_id: "user-1", organization_id: "org-1" },
            ]);
            const rollback = yield* Effect.gen(function* () {
              yield* analytics.track({ ...input, eventId: "rolled-back" });
              return yield* Effect.fail("abort");
            }).pipe(sql.withTransaction, Effect.result);
            expect(rollback._tag).toBe("Failure");
            expect(
              yield* sql`SELECT event_id FROM events WHERE service_name = ${options.serviceName} AND event_id = 'rolled-back'`,
            ).toHaveLength(0);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "inherits server context without mixing explicit identity or overriding event classification",
        () =>
          Effect.gen(function* () {
            const { analytics, sql } = yield* fixture;
            yield* analytics
              .track({
                eventId: "audit-actor",
                name: "document.deleted",
                category: "audit",
                identity: {
                  userId: "spoofed-user",
                  organizationId: "spoofed-org",
                },
                properties: {
                  "actor.id": "property-actor",
                  target_type: "document",
                  target_id: "doc-1",
                  outcome: "success",
                  reason: "requested",
                },
              })
              .pipe(
                Effect.annotateLogs({
                  "organization.id": "org-verified",
                  "app.actor.type": "api_key",
                  "app.actor.id": "key-1",
                  "app.actor.owner.type": "organization",
                  "app.actor.owner.id": "org-verified",
                  "gen_ai.agent.id": "agent-1",
                  "mcp.method.name": "tools/call",
                  "app.executor.type": "ai_agent",
                  "app.access.channel": "mcp",
                  "integration.request.id": "request-1",
                  "log.record.uid": "must-not-override",
                }),
              );
            const rows =
              yield* sql`SELECT user_id, organization_id, payload_json FROM events WHERE service_name = ${options.serviceName} AND event_id = 'audit-actor'`;
            const row = yield* Schema.decodeUnknownEffect(
              Schema.Struct({
                user_id: Schema.NullOr(Schema.String),
                organization_id: Schema.NullOr(Schema.String),
                payload_json: Schema.Union([
                  OtlpLogs,
                  Schema.fromJsonString(OtlpLogs),
                ]),
              }),
            )(rows[0]);
            expect(row.user_id).toBeNull();
            expect(row.organization_id).toBe("org-verified");
            const record = yield* Schema.decodeUnknownEffect(EventLogRecord)(
              row.payload_json.resourceLogs[0]!.scopeLogs[0]!.logRecords[0],
            );
            const attrs = Object.fromEntries(
              record.attributes.map(({ key, value }) => [key, value]),
            );
            expect(attrs).toMatchObject({
              "app.actor.type": { stringValue: "api_key" },
              "app.actor.id": { stringValue: "key-1" },
              "app.actor.owner.id": { stringValue: "org-verified" },
              "app.event.category": { stringValue: "audit" },
              "app.target_id": { stringValue: "doc-1" },
              "app.outcome": { stringValue: "success" },
              "gen_ai.agent.id": { stringValue: "agent-1" },
              "mcp.method.name": { stringValue: "tools/call" },
              "log.record.uid": { stringValue: "audit-actor" },
              "integration.request.id": { stringValue: "request-1" },
            });
            expect(JSON.stringify(row.payload_json)).not.toMatch(
              /spoofed|property-actor/,
            );
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "records explicit system actors and rejects incomplete audit identity before insertion",
        () =>
          Effect.gen(function* () {
            const { analytics, sql } = yield* fixture;
            const event = {
              eventId: "audit-system",
              name: "retention.executed",
              category: "audit",
            } satisfies TrackEvent;
            yield* analytics.track(event).pipe(
              Effect.annotateLogs({
                "app.actor.type": "system",
                "app.actor.id": "retention-job",
              }),
            );
            expect(
              (yield* analytics
                .track({ ...event, eventId: "missing-actor" })
                .pipe(Effect.result))._tag,
            ).toBe("Failure");
            expect(
              (yield* analytics
                .track({ ...event, eventId: "partial-annotation" })
                .pipe(
                  Effect.annotateLogs({ "app.actor.type": "api_key" }),
                  Effect.result,
                ))._tag,
            ).toBe("Failure");
            expect(
              (yield* analytics
                .track({ ...event, eventId: "legacy-user" })
                .pipe(
                  Effect.annotateLogs({
                    "user.id": "owner-is-not-necessarily-actor",
                  }),
                  Effect.result,
                ))._tag,
            ).toBe("Failure");
            expect(
              (yield* Schema.decodeUnknownEffect(TrackEvent)({
                ...event,
                category: "unrecognized",
              }).pipe(Effect.result))._tag,
            ).toBe("Failure");
            expect(
              yield* sql`SELECT event_id FROM events WHERE service_name = ${options.serviceName}`,
            ).toEqual([{ event_id: "audit-system" }]);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "uses one recording path without requiring target/outcome and protects category from properties and annotations",
        () =>
          Effect.gen(function* () {
            const { analytics: events, sql } = yield* fixture;
            const input = {
              eventId: "optional-outcome",
              name: "document.deleted",
              category: "audit",
            } satisfies TrackEvent;
            const actor = {
              "app.actor.type": "user",
              "app.actor.id": "user-1",
            };
            expect(
              (yield* events.track(input).pipe(
                Effect.annotateLogs({
                  ...actor,
                  "app.event.category": "analytics",
                }),
              )).inserted,
            ).toBe(true);
            expect(
              (yield* events.track(input).pipe(Effect.annotateLogs(actor)))
                .inserted,
            ).toBe(false);
            // Only the explicit category selects audit policy, never attributes.
            const tracked = {
              ...input,
              eventId: "ordinary-track",
              category: "analytics",
              properties: { "event.category": "audit" },
            } satisfies TrackEvent;
            yield* events.track(tracked).pipe(
              Effect.annotateLogs({
                "app.event.category": "audit",
              }),
            );
            const rows =
              yield* sql`SELECT event_id, payload_json FROM events WHERE service_name = ${options.serviceName} ORDER BY event_id`;
            const decoded = yield* Schema.decodeUnknownEffect(
              Schema.Array(
                Schema.Struct({
                  event_id: Schema.String,
                  payload_json: Schema.Union([
                    OtlpLogs,
                    Schema.fromJsonString(OtlpLogs),
                  ]),
                }),
              ),
            )(rows);
            for (const row of decoded) {
              const record = yield* Schema.decodeUnknownEffect(EventLogRecord)(
                row.payload_json.resourceLogs[0]!.scopeLogs[0]!.logRecords[0],
              );
              const attrs = Object.fromEntries(
                record.attributes.map(({ key, value }) => [key, value]),
              );
              expect(attrs["app.audit.outcome"]).toBeUndefined();
              expect(attrs["app.event.category"]).toEqual({
                stringValue:
                  row.event_id === "ordinary-track" ? "analytics" : "audit",
              });
              expect(attrs["app.target_id"]).toBeUndefined();
              expect(attrs["app.outcome"]).toBeUndefined();
            }
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "inherits existing ActorRequired user and organization annotations for ordinary server events",
        () =>
          Effect.gen(function* () {
            const { analytics, sql } = yield* fixture;
            yield* analytics
              .track({
                eventId: "legacy-identity",
                name: "updated",
                identity: { userId: "other" },
              })
              .pipe(
                Effect.annotateLogs({
                  "user.id": "verified-user",
                  "organization.id": "verified-org",
                }),
              );
            expect(
              yield* sql`SELECT user_id, organization_id FROM events WHERE service_name = ${options.serviceName}`,
            ).toEqual([
              { user_id: "verified-user", organization_id: "verified-org" },
            ]);
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );

      it.effect(
        "persists enriched OTLP records with session IDs and deduplicates retries",
        () =>
          Effect.gen(function* () {
            const { analytics, sql } = yield* fixture;
            const body = batch(DateTime.toEpochMillis(yield* DateTime.now));
            const first = yield* analytics
              .process(body)
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
              );
            expect(first.persisted).toBe(true);
            yield* analytics
              .process(body)
              .pipe(
                Effect.provideService(
                  HttpServerRequest.HttpServerRequest,
                  request,
                ),
              );
            const rows =
              yield* sql`SELECT payload_json FROM events WHERE service_name = ${options.serviceName}`;
            expect(rows).toHaveLength(1);
            expect(
              yield* sql`SELECT service_name, session_id FROM events WHERE service_name = ${options.serviceName} AND session_id IS NOT NULL`,
            ).toEqual([
              {
                service_name: options.serviceName,
                session_id: yield* forwardedSession(first.body),
              },
            ]);
            const decoded = yield* Schema.decodeUnknownEffect(
              Schema.Struct({
                payload_json: Schema.Union([
                  OtlpLogs,
                  Schema.fromJsonString(OtlpLogs),
                ]),
              }),
            )(rows[0]);
            const serialized = JSON.stringify(decoded.payload_json);
            expect(serialized).toContain("analytics.anonymous_id");
            expect(serialized).toContain("session.id");
            expect(serialized).not.toContain("203.0.113.42");
            expect(serialized).not.toContain("test-browser");
            expect(serialized).not.toContain("analytics.site.id");
          }).pipe(Effect.scoped, Effect.provide(layer)),
      );
    },
  );
}

it.effect("rejects server recording when no SqlClient is injected", () =>
  Effect.gen(function* () {
    const analytics = yield* Events;
    expect(
      yield* analytics
        .track({ eventId: "disabled", name: "purchase" })
        .pipe(Effect.result),
    ).toMatchObject({
      _tag: "Failure",
      failure: { operation: "persistence-disabled" },
    });
  }).pipe(Effect.provide(Events.layer(options))),
);

it.effect(
  "rolls back earlier events in the batch if a later insert fails",
  () =>
    Effect.gen(function* () {
      const analytics = yield* Events;
      const sql = yield* SqlClient.SqlClient;
      yield* sql`CREATE TRIGGER reject_events BEFORE INSERT ON events WHEN (SELECT COUNT(*) FROM events) > 0 BEGIN SELECT RAISE(ABORT, 'test failure'); END`;
      const now = DateTime.toEpochMillis(yield* DateTime.now);
      const payload = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(OtlpLogs),
      )(new TextDecoder().decode(batch(now)));
      const scope = payload.resourceLogs[0]!.scopeLogs[0]!;
      const second = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(OtlpLogs),
      )(new TextDecoder().decode(batch(now)));
      const body = yield* Schema.encodeEffect(Schema.fromJsonString(OtlpLogs))({
        resourceLogs: [
          {
            scopeLogs: [
              {
                ...scope,
                logRecords: [
                  ...scope.logRecords,
                  ...second.resourceLogs[0]!.scopeLogs[0]!.logRecords,
                ],
              },
            ],
          },
        ],
      });
      const result = yield* analytics
        .process(new TextEncoder().encode(body))
        .pipe(
          Effect.provideService(HttpServerRequest.HttpServerRequest, request),
          Effect.result,
        );
      expect(result).toMatchObject({
        _tag: "Failure",
        failure: { status: 503 },
      });
      expect(yield* sql`SELECT event_id FROM events`).toHaveLength(0);
    }).pipe(
      Effect.provide(
        Events.layer(options).pipe(
          Layer.provideMerge(SqliteClient.layer({ filename: ":memory:" })),
        ),
      ),
    ),
);
