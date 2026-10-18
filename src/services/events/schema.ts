import { Effect, Schema } from "effect";
import { EventAttributesSchema } from "../opentelemetry/schema";

export const EventUuid = Schema.String.check(Schema.isUUID());
export const EventId = Schema.NonEmptyString.check(Schema.isMaxLength(100));
export const BrowserEventPath = Schema.String.check(
  Schema.isMaxLength(2048),
  Schema.isPattern(/^\/(?!\/)[^?#]*$/),
);

export const EventIdentity = Schema.Struct({
  userId: Schema.optional(Schema.NonEmptyString),
  organizationId: Schema.optional(Schema.NonEmptyString),
}).annotate({ identifier: "EventIdentity" });

export type EventIdentity = typeof EventIdentity.Type;

export const BrowserEventOptions = Schema.Struct({
  messageId: Schema.optional(EventId),
  timestamp: Schema.optional(Schema.DateTimeUtc),
  context: Schema.optional(EventAttributesSchema),
}).annotate({ identifier: "BrowserEventOptions" });

export const BrowserPage = Schema.Struct({
  name: Schema.optional(Schema.NonEmptyString),
  category: Schema.optional(Schema.NonEmptyString),
  path: Schema.optional(Schema.NonEmptyString),
  properties: Schema.optional(EventAttributesSchema),
  options: Schema.optional(BrowserEventOptions),
}).annotate({ identifier: "BrowserPage" });

export type BrowserEventOptions = typeof BrowserEventOptions.Type;
export type BrowserPageOptions = typeof BrowserPage.Type;

export const TrackEvent = Schema.Struct({
  eventId: EventId,
  name: Schema.NonEmptyString.check(Schema.isMaxLength(128)),
  properties: Schema.optional(EventAttributesSchema),
  identity: Schema.optional(EventIdentity),
  timestamp: Schema.optional(Schema.DateTimeUtc),
  category: Schema.optional(Schema.Literals(["analytics", "audit"])),
}).annotate({ identifier: "TrackEvent" });
export type TrackEvent = typeof TrackEvent.Type;

/** Minimal attribution contract; actor types and resolution belong to auth. */
export const AuditAttribution = Schema.Struct({
  "app.actor.type": Schema.NonEmptyString,
  "app.actor.id": Schema.NonEmptyString,
}).annotate({ identifier: "AuditAttribution" });

export class EventsPersistenceError extends Schema.TaggedError<EventsPersistenceError>()(
  "EventsPersistenceError",
  { operation: Schema.String },
) {}

export class EventConflictError extends Schema.TaggedError<EventConflictError>()(
  "EventConflictError",
  { eventId: EventId },
) {}

export const EventSource = Schema.Literals(["browser", "server"]).annotate({
  identifier: "EventSource",
});
export type EventSource = typeof EventSource.Type;

export const ExistingEventRequest = Schema.Struct({
  eventId: EventId,
  source: EventSource,
}).annotate({ identifier: "ExistingEventRequest" });

export const StoredEventRequest = Schema.Struct({
  source: EventSource,
  event_id: EventId,
  event_name: Schema.NonEmptyString,
  event_type: Schema.Literals(["page", "track"]),
  occurred_at: Schema.Finite,
  received_at: Schema.Finite,
  organization_id: Schema.NullOr(Schema.NonEmptyString),
  user_id: Schema.NullOr(Schema.NonEmptyString),
  session_id: Schema.NullOr(Schema.NonEmptyString),
  anonymous_id: Schema.NullOr(Schema.NonEmptyString),
  payload_json: Schema.String,
}).annotate({ identifier: "StoredEventRequest" });
export const StoredEventId = Schema.Struct({
  event_id: EventId,
}).annotate({ identifier: "StoredEventId" });
const PrimitiveValue = Schema.Union([
  Schema.Struct({ stringValue: Schema.String.check(Schema.isMaxLength(2048)) }),
  Schema.Struct({
    intValue: Schema.Union([
      Schema.String.check(Schema.isPattern(/^-?\d{1,20}$/)),
      Schema.Int,
    ]),
  }),
  Schema.Struct({ doubleValue: Schema.Finite }),
  Schema.Struct({ boolValue: Schema.Boolean }),
]);
const AttributeValue = Schema.Union([
  PrimitiveValue,
  Schema.Struct({
    arrayValue: Schema.Struct({
      values: Schema.Array(PrimitiveValue).check(Schema.isMaxLength(32)),
    }),
  }),
]);
export const EventAttribute = Schema.Struct({
  key: Schema.NonEmptyString.check(Schema.isMaxLength(128)),
  value: AttributeValue,
}).annotate({ identifier: "EventAttribute" });

export const EventLogRecord = Schema.Struct({
  eventName: Schema.NonEmptyString.check(
    Schema.isMaxLength(128),
    Schema.isPattern(/^[^\r\n]+$/),
  ),
  timeUnixNano: Schema.String.check(Schema.isPattern(/^\d{1,20}$/)),
  observedTimeUnixNano: Schema.optional(
    Schema.String.check(Schema.isPattern(/^\d{1,20}$/)),
  ),
  severityNumber: Schema.optional(Schema.Int),
  traceId: Schema.optional(
    Schema.String.check(Schema.isPattern(/^[a-f0-9]{32}$/)),
  ),
  spanId: Schema.optional(
    Schema.String.check(Schema.isPattern(/^[a-f0-9]{16}$/)),
  ),
  attributes: Schema.Array(EventAttribute).check(
    Schema.isMaxLength(64),
    Schema.makeFilter(
      (values) =>
        new Set(values.map(({ key }) => key)).size === values.length ||
        "Duplicate attribute keys",
    ),
  ),
}).annotate({ identifier: "EventLogRecord" });

/** OTLP/HTTP JSON envelope; unrelated scopes and extension fields are preserved. */
const extensions = Schema.Record(Schema.String, Schema.Unknown);
export const OtlpLogs = Schema.StructWithRest(
  Schema.Struct({
    resourceLogs: Schema.Array(
      Schema.StructWithRest(
        Schema.Struct({
          scopeLogs: Schema.Array(
            Schema.StructWithRest(
              Schema.Struct({
                scope: Schema.optional(
                  Schema.StructWithRest(
                    Schema.Struct({ name: Schema.optional(Schema.String) }),
                    [extensions],
                  ),
                ),
                logRecords: Schema.Array(Schema.Unknown).pipe(
                  Schema.withDecodingDefaultKey(Effect.succeed([])),
                ),
              }),
              [extensions],
            ),
          ).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
        }),
        [extensions],
      ),
    ).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  }),
  [extensions],
).annotate({ identifier: "EventsOtlpLogs" });

export const StoredEventPayload = Schema.Struct({
  payload_json: Schema.Union([OtlpLogs, Schema.fromJsonString(OtlpLogs)]),
}).annotate({ identifier: "StoredEventPayload" });

export const VisitorEventsRequest = Schema.Struct({
  visitorId: Schema.NonEmptyString,
}).annotate({ identifier: "VisitorEventsRequest" });

export const VisitorEventSession = Schema.Struct({
  event_id: EventId,
  session_id: Schema.NullOr(EventUuid),
  received_at: Schema.Finite,
}).annotate({ identifier: "VisitorEventSession" });

export type EventLogRecord = typeof EventLogRecord.Type;
export type EventAttribute = typeof EventAttribute.Type;
export type OtlpLogs = typeof OtlpLogs.Type;
