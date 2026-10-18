import { createHmac, randomUUID } from "node:crypto";
import {
  Context,
  DateTime,
  Effect,
  Layer,
  Option,
  Redacted,
  References,
  Schema,
} from "effect";
import { HttpServerRequest } from "effect/http";
import { SqlClient, SqlSchema } from "effect/sql";

import {
  OtlpLogsProcessor,
  OtlpProcessingError,
} from "../opentelemetry/processor";
import { OtlpResource } from "effect/observability";
import { cloudflareContext, deviceContext } from "./request-context";
import {
  EventUuid,
  EventIdentity,
  AuditAttribution,
  EventLogRecord,
  EventId,
  BrowserEventPath,
  OtlpLogs,
  VisitorEventsRequest,
  VisitorEventSession,
  ExistingEventRequest,
  StoredEventPayload,
  EventConflictError,
  type EventSource,
  StoredEventRequest,
  StoredEventId,
  EventsPersistenceError,
  TrackEvent,
} from "./schema";
import { migrateEvents } from "./migrations";

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const identityAttributes = (identity: EventIdentity | null | undefined) => {
  const attributes: Record<string, string> = {};
  if (identity?.userId) attributes["user.id"] = identity.userId;
  if (identity?.organizationId)
    attributes["organization.id"] = identity.organizationId;
  return attributes;
};

const actorAttributeKeys = [
  "app.actor.type",
  "app.actor.id",
  "app.actor.owner.type",
  "app.actor.owner.id",
];
const reservedBrowserAttribute = (key: string) =>
  key.startsWith("app.actor.") ||
  key.startsWith("app.audit.") ||
  key.startsWith("app.executor.") ||
  key === "app.access.channel";

export interface EventsOptions {
  /** Defaults to the server's OTEL_SERVICE_NAME / OTEL_RESOURCE_ATTRIBUTES. */
  readonly serviceName?: string;
  readonly origin: string;
  /** Reuse a stable application secret; never sent to the browser. */
  readonly secret: Redacted.Redacted<string>;
  readonly trustCloudflare?: boolean;
  /** Resolves verified identity once per accepted analytics batch. Null means anonymous. */
  readonly identity?: (
    request: HttpServerRequest.HttpServerRequest,
  ) => Effect.Effect<EventIdentity | null, unknown>;
}

const Configuration = Schema.Struct({
  serviceName: Schema.NonEmptyString,
  origin: Schema.URLFromString.check(
    Schema.makeFilter(
      (url) =>
        ((url.protocol === "https:" || url.protocol === "http:") &&
          !url.username &&
          !url.password &&
          url.pathname === "/" &&
          !url.search &&
          !url.hash) ||
        "Expected an HTTP origin",
    ),
  ),
  trustCloudflare: Schema.optional(Schema.Boolean),
  secret: Schema.String.check(Schema.isMinLength(32)),
}).annotate({ identifier: "EventsConfiguration" });
export class EventsConfigurationError extends Schema.TaggedError<EventsConfigurationError>()(
  "EventsConfigurationError",
  { message: Schema.String },
) {}
const codec = Schema.fromJsonString(OtlpLogs);
const textAttribute = (record: EventLogRecord, key: string) => {
  const value = record.attributes.find(
    (attribute) => attribute.key === key,
  )?.value;
  return value && "stringValue" in value ? value.stringValue : undefined;
};
const contextKeys = new Set([
  "url.path",
  "url.referrer",
  "browser.language",
  "analytics.locale",
  "analytics.page_view.id",
  "log.record.uid",
  "app.event.schema.version",
  "analytics.page.name",
  "analytics.page.category",
  "utm.source",
  "utm.medium",
  "utm.campaign",
  "utm.content",
  "utm.term",
]);

// Compare caller-owned content, excluding enrichment and retry-time metadata.
const eventContent = (
  record: EventLogRecord,
  source: EventSource,
  compareTimestamp = source === "browser",
) =>
  JSON.stringify({
    name: record.eventName,
    timestamp: compareTimestamp ? record.timeUnixNano : undefined,
    attributes: record.attributes
      .filter(({ key }) =>
        source === "browser"
          ? (contextKeys.has(key) || key.startsWith("app.")) &&
            !reservedBrowserAttribute(key) &&
            !key.startsWith("app.event.")
          : (key.startsWith("app.") &&
              ![
                "app.event.type",
                "app.event.source",
                "app.event.schema.version",
              ].includes(key)) ||
            key === "user.id" ||
            key === "organization.id",
      )
      .sort((a, b) => a.key.localeCompare(b.key)),
  });

export const dailyVisitorId = (input: {
  readonly serviceName: string;
  readonly ip: string;
  readonly userAgent: string;
  readonly day: string;
  readonly secret: Redacted.Redacted<string>;
}) =>
  createHmac("sha256", Redacted.value(input.secret))
    .update(
      JSON.stringify([
        "analytics.visitor.v1",
        input.serviceName,
        input.day,
        input.ip,
        input.userAgent,
      ]),
    )
    .digest("hex");

export class Events extends Context.Service<Events>()(
  "krakstack/events/Events",
  {
    make: (options: EventsOptions) =>
      Effect.gen(function* () {
        const resource = yield* OtlpResource.fromConfig({
          serviceName: options.serviceName,
        });
        const configuration = yield* Schema.decodeUnknownEffect(Configuration)({
          ...options,
          serviceName: OtlpResource.serviceNameUnsafe(resource),
          secret: Redacted.value(options.secret),
        }).pipe(
          Effect.mapError(
            () =>
              new EventsConfigurationError({
                message:
                  "Events requires an OTel service name, HTTP origin, and server secret of at least 32 characters",
              }),
          ),
        );
        const client = yield* Effect.serviceOption(SqlClient.SqlClient);
        const storage = Option.isSome(client)
          ? yield* Effect.gen(function* () {
              const sql = client.value.withoutTransforms();
              if (
                !sql.onDialectOrElse({
                  pg: () => true,
                  sqlite: () => true,
                  orElse: () => false,
                })
              ) {
                return yield* new EventsConfigurationError({
                  message: "Events supports PostgreSQL and SQLite",
                });
              }
              const latestSession = SqlSchema.findOneOption({
                Request: VisitorEventsRequest,
                Result: VisitorEventSession,
                execute: ({ visitorId }) => sql`
            SELECT event_id, session_id, received_at FROM events
            WHERE service_name = ${configuration.serviceName} AND source = 'browser' AND anonymous_id = ${visitorId}
              AND session_id IS NOT NULL
            ORDER BY received_at DESC, event_id DESC LIMIT 1
          `,
              });
              const existingEvent = SqlSchema.findOne({
                Request: ExistingEventRequest,
                Result: StoredEventPayload,
                execute: ({ source, eventId }) => sql`
                  SELECT payload_json FROM events
                  WHERE service_name = ${configuration.serviceName} AND source = ${source} AND event_id = ${eventId}
                `,
              });
              const lockVisitor = (visitorId: string) =>
                sql.onDialectOrElse({
                  pg: () =>
                    sql`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify(["analytics.visit.v1", configuration.serviceName, visitorId])}, 0))`,
                  // Acquire SQLite's writer lock before reading, including for a visitor's first event.
                  orElse: () =>
                    sql`UPDATE events SET received_at = received_at WHERE 1 = 0`,
                });
              const insertEvent = SqlSchema.findOneOption({
                Request: StoredEventRequest,
                Result: StoredEventId,
                execute: (event) => sql`
            INSERT INTO events ${sql.insert({ service_name: configuration.serviceName, ...event })}
            ON CONFLICT (service_name, source, event_id) DO NOTHING RETURNING event_id
          `,
              });
              const persist = Effect.fnUntraced(function* (input: {
                readonly record: EventLogRecord;
                readonly source: EventSource;
                readonly compareTimestamp?: boolean;
                readonly payload: OtlpLogs;
                readonly now: number;
              }) {
                const { record, payload, now, source } = input;
                const eventId = textAttribute(record, "log.record.uid")!;
                const payloadJson = yield* Schema.encodeEffect(codec)(payload);
                const inserted = yield* insertEvent({
                  source,
                  event_id: eventId,
                  event_name: record.eventName,
                  event_type:
                    record.eventName === "browser.page_view" ? "page" : "track",
                  occurred_at: Number(BigInt(record.timeUnixNano) / 1_000_000n),
                  received_at: now,
                  organization_id:
                    textAttribute(record, "organization.id") ?? null,
                  user_id: textAttribute(record, "user.id") ?? null,
                  session_id: textAttribute(record, "session.id") ?? null,
                  anonymous_id:
                    textAttribute(record, "analytics.anonymous_id") ?? null,
                  payload_json: payloadJson,
                });
                if (Option.isSome(inserted))
                  return { eventId, inserted: true, record };
                // The insert waits for a concurrent winner before reading its row.
                const existing = yield* existingEvent({ source, eventId });
                const original = yield* Schema.decodeUnknownEffect(
                  EventLogRecord,
                )(
                  existing.payload_json.resourceLogs[0]?.scopeLogs[0]
                    ?.logRecords[0],
                );
                const identityChanged =
                  source === "browser" &&
                  ["user.id", "organization.id"].some(
                    (key) =>
                      textAttribute(original, key) !==
                      textAttribute(record, key),
                  );
                if (
                  identityChanged ||
                  eventContent(original, source, input.compareTimestamp) !==
                    eventContent(record, source, input.compareTimestamp)
                ) {
                  return yield* new EventConflictError({ eventId });
                }
                return { eventId, inserted: false, record: original };
              });
              return {
                sql,
                persist,
                latestSession,
                lockVisitor,
              };
            })
          : undefined;
        const track = Effect.fn("Events.track")(function* (input: TrackEvent) {
          const event = yield* Schema.decodeUnknownEffect(TrackEvent)(input);
          const category = event.category ?? "analytics";
          if (!storage)
            return yield* new EventsPersistenceError({
              operation: "persistence-disabled",
            });
          const now = DateTime.toEpochMillis(yield* DateTime.now);
          const annotations = yield* References.CurrentLogAnnotations;
          // Request identity replaces the entire explicit identity: never combine
          // a verified API key with a caller-supplied user or owner.
          const hasIdentity = [
            "user.id",
            "organization.id",
            ...actorAttributeKeys,
          ].some((key) => annotations[key] !== undefined);
          const identity = hasIdentity
            ? yield* Schema.decodeUnknownEffect(EventIdentity)({
                userId: annotations["user.id"],
                organizationId: annotations["organization.id"],
              })
            : event.identity;
          if (category === "audit") {
            yield* Schema.decodeUnknownEffect(AuditAttribution)(annotations);
          }
          const attributes: Record<
            string,
            | string
            | number
            | boolean
            | ReadonlyArray<string>
            | ReadonlyArray<number>
            | ReadonlyArray<boolean>
          > = {};
          for (const [key, value] of Object.entries(event.properties ?? {})) {
            const name = key.startsWith("app.") ? key : `app.${key}`;
            if (!reservedBrowserAttribute(name)) attributes[name] = value;
          }
          Object.assign(attributes, identityAttributes(identity));
          Object.assign(attributes, annotations);
          // These belong to the event, not its surrounding request context.
          attributes["log.record.uid"] = event.eventId;
          attributes["app.event.schema.version"] = "1";
          attributes["app.event.type"] = "track";
          attributes["app.event.source"] = "server";
          attributes["app.event.category"] = category;
          const span = yield* Effect.currentSpan.pipe(Effect.option);
          const entry = {
            eventName: event.name,
            timeUnixNano: (
              BigInt(
                event.timestamp ? DateTime.toEpochMillis(event.timestamp) : now,
              ) * 1_000_000n
            ).toString(),
            observedTimeUnixNano: (BigInt(now) * 1_000_000n).toString(),
            attributes: OtlpResource.entriesToAttributes(
              Object.entries(attributes),
            ),
          };
          const validated = yield* Schema.decodeUnknownEffect(EventLogRecord)({
            ...entry,
            traceId: Option.isSome(span) ? span.value.traceId : undefined,
            spanId: Option.isSome(span) ? span.value.spanId : undefined,
          });
          return yield* storage
            .persist({
              source: "server",
              compareTimestamp: event.timestamp !== undefined,
              record: validated,
              now,
              payload: {
                resourceLogs: [
                  {
                    resource,
                    scopeLogs: [
                      {
                        scope: { name: "krakstack.application.events" },
                        logRecords: [validated],
                      },
                    ],
                  },
                ],
              },
            })
            .pipe(
              storage.sql.withTransaction,
              Effect.map(({ eventId, inserted }) => ({ eventId, inserted })),
              Effect.mapError((error) =>
                error._tag === "EventConflictError"
                  ? error
                  : new EventsPersistenceError({
                      operation: "track",
                    }),
              ),
            );
        });
        const process = Effect.fnUntraced(function* (body: Uint8Array) {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const payload = yield* Schema.decodeUnknownEffect(codec)(
            new TextDecoder().decode(body),
          ).pipe(
            Effect.mapError(() => new OtlpProcessingError({ status: 400 })),
          );
          const analyticsScopes = payload.resourceLogs
            .flatMap((resource) => resource.scopeLogs)
            .filter(
              (scope) => scope.scope?.name === "krakstack.application.events",
            );
          if (analyticsScopes.length === 0) return { body, persisted: false };
          if (
            request.headers.origin !== configuration.origin.origin ||
            request.headers["sec-fetch-site"] === "cross-site"
          ) {
            return yield* new OtlpProcessingError({ status: 403 });
          }
          const rawRecords = analyticsScopes.flatMap(
            (scope) => scope.logRecords,
          );
          const records = yield* Schema.decodeUnknownEffect(
            Schema.Array(EventLogRecord).check(
              Schema.isMinLength(1),
              Schema.isMaxLength(100),
            ),
          )(rawRecords).pipe(
            Effect.mapError(() => new OtlpProcessingError({ status: 400 })),
          );
          const now = yield* DateTime.now;
          const nowMillis = DateTime.toEpochMillis(now);
          for (const record of records) {
            const timestamp = BigInt(record.timeUnixNano) / 1_000_000n;
            if (
              timestamp < BigInt(nowMillis - 60 * 60 * 1000) ||
              timestamp > BigInt(nowMillis + 60_000) ||
              textAttribute(record, "app.event.schema.version") !== "1" ||
              Option.isNone(
                Schema.decodeUnknownOption(EventUuid)(
                  textAttribute(record, "analytics.page_view.id"),
                ),
              ) ||
              Option.isNone(
                Schema.decodeUnknownOption(EventId)(
                  textAttribute(record, "log.record.uid"),
                ),
              ) ||
              Option.isNone(
                Schema.decodeUnknownOption(BrowserEventPath)(
                  textAttribute(record, "url.path"),
                ),
              )
            ) {
              return yield* new OtlpProcessingError({ status: 400 });
            }
          }
          const userAgent = request.headers["user-agent"]?.slice(0, 2048) ?? "";
          const trustedIdentity = options.identity
            ? yield* options.identity(request).pipe(
                Effect.flatMap(
                  Schema.decodeUnknownEffect(Schema.NullOr(EventIdentity)),
                ),
                Effect.mapError(() => new OtlpProcessingError({ status: 503 })),
              )
            : null;
          const trustedAttributes = identityAttributes(trustedIdentity);
          const ingest = Effect.gen(function* () {
            const location = options.trustCloudflare
              ? cloudflareContext(request.headers)
              : { ip: undefined, attributes: {} };
            const attributes = {
              ...deviceContext(userAgent),
              ...location.attributes,
              "analytics.identity.mode":
                location.ip && userAgent ? "daily" : "unattributed",
            };
            const identity: Record<string, string> = {};
            let sessionId: string | undefined;
            if (location.ip && userAgent) {
              const visitorId = dailyVisitorId({
                serviceName: configuration.serviceName,
                secret: options.secret,
                ip: location.ip,
                userAgent,
                day: DateTime.formatIsoDate(now),
              });
              identity["analytics.anonymous_id"] = visitorId;
              if (storage) {
                yield* storage.lockVisitor(visitorId);
                const latest = yield* storage.latestSession({ visitorId });
                sessionId =
                  Option.isSome(latest) &&
                  latest.value.received_at > nowMillis - SESSION_TIMEOUT_MS
                    ? latest.value.session_id!
                    : randomUUID();
              }
            }
            let index = 0;
            const resourceLogs = payload.resourceLogs.map((resource) => ({
              ...resource,
              scopeLogs: resource.scopeLogs.map((scope) =>
                scope.scope?.name !== "krakstack.application.events"
                  ? scope
                  : {
                      ...scope,
                      logRecords: scope.logRecords.map(() => {
                        const record = records[index++]!;
                        const sessionAttributes = sessionId
                          ? { "session.id": sessionId }
                          : undefined;
                        return {
                          ...record,
                          observedTimeUnixNano: (
                            BigInt(nowMillis) * 1_000_000n
                          ).toString(),
                          attributes: [
                            ...record.attributes.filter(
                              ({ key }) =>
                                (contextKeys.has(key) ||
                                  key.startsWith("app.")) &&
                                !reservedBrowserAttribute(key) &&
                                !key.startsWith("app.event."),
                            ),
                            {
                              key: "app.event.type",
                              value: {
                                stringValue:
                                  record.eventName === "browser.page_view"
                                    ? "page"
                                    : "track",
                              },
                            },
                            ...OtlpResource.entriesToAttributes(
                              Object.entries({
                                ...attributes,
                                ...identity,
                                ...sessionAttributes,
                                ...trustedAttributes,
                                "app.event.category": "analytics",
                                "app.event.source": "browser",
                                "app.event.schema.version": "1",
                              }),
                            ),
                          ],
                        };
                      }),
                    },
              ),
            }));
            const persistedRecords = new Map<unknown, EventLogRecord>();
            if (storage) {
              for (const resource of resourceLogs) {
                for (const scope of resource.scopeLogs) {
                  if (scope.scope?.name !== "krakstack.application.events")
                    continue;
                  for (const raw of scope.logRecords) {
                    const record =
                      yield* Schema.decodeUnknownEffect(EventLogRecord)(raw);
                    const persisted = yield* storage.persist({
                      source: "browser",
                      record,
                      now: nowMillis,
                      payload: {
                        ...payload,
                        resourceLogs: [
                          {
                            ...resource,
                            scopeLogs: [{ ...scope, logRecords: [record] }],
                          },
                        ],
                      },
                    });
                    persistedRecords.set(raw, persisted.record);
                  }
                }
              }
            }
            const encoded = yield* Schema.encodeEffect(codec)({
              ...payload,
              resourceLogs: resourceLogs.map((resource) => ({
                ...resource,
                scopeLogs: resource.scopeLogs.map((scope) => ({
                  ...scope,
                  logRecords: scope.logRecords.map(
                    (raw) => persistedRecords.get(raw) ?? raw,
                  ),
                })),
              })),
            });
            const persisted =
              Boolean(storage) &&
              payload.resourceLogs.every((resource) =>
                resource.scopeLogs.every(
                  (scope) =>
                    scope.scope?.name === "krakstack.application.events" ||
                    scope.logRecords.length === 0,
                ),
              );
            return { body: new TextEncoder().encode(encoded), persisted };
          });
          return yield* (
            storage ? ingest.pipe(storage.sql.withTransaction) : ingest
          ).pipe(
            Effect.mapError(
              (error) =>
                new OtlpProcessingError({
                  status: error._tag === "EventConflictError" ? 409 : 503,
                }),
            ),
          );
        });
        return { process, track };
      }),
  },
) {
  static readonly baseLayer = (options: EventsOptions) =>
    Layer.effect(this, this.make(options));

  /** An injected PostgreSQL/SQLite SqlClient enables persistence and the initial migration. */
  static readonly layer = (options: EventsOptions) =>
    this.baseLayer(options).pipe(
      Layer.provide(
        Layer.effectDiscard(
          Effect.gen(function* () {
            const client = yield* Effect.serviceOption(SqlClient.SqlClient);
            if (Option.isNone(client)) return;
            if (
              !client.value.onDialectOrElse({
                pg: () => true,
                sqlite: () => true,
                orElse: () => false,
              })
            ) {
              return yield* new EventsConfigurationError({
                message: "Events supports PostgreSQL and SQLite",
              });
            }
            yield* migrateEvents.pipe(
              Effect.provideService(SqlClient.SqlClient, client.value),
            );
          }),
        ),
      ),
    );

  static readonly processorLayer = Layer.effect(OtlpLogsProcessor, Events);
}
