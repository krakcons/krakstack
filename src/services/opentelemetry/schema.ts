import { Schema } from "effect";

const EventAttributeValue = Schema.Union([
  Schema.String,
  Schema.Finite,
  Schema.Boolean,
  Schema.Array(Schema.String),
  Schema.Array(Schema.Finite),
  Schema.Array(Schema.Boolean),
]);

export const EventAttributesSchema = Schema.Record(
  Schema.String,
  EventAttributeValue,
).annotate({ identifier: "EventAttributes" });

export const EventOptionsSchema = Schema.Struct({
  userId: Schema.optional(Schema.NonEmptyString),
  anonymousId: Schema.optional(Schema.NonEmptyString),
  sessionId: Schema.optional(Schema.NonEmptyString),
  messageId: Schema.optional(Schema.NonEmptyString),
  timestamp: Schema.optional(Schema.DateTimeUtc),
  context: Schema.optional(EventAttributesSchema),
}).annotate({ identifier: "EventOptions" });

export const TelemetryEvent = Schema.Struct({
  name: Schema.NonEmptyString,
  properties: Schema.optional(EventAttributesSchema),
  options: Schema.optional(EventOptionsSchema),
}).annotate({ identifier: "TelemetryEvent" });

export const PageEvent = Schema.Struct({
  name: Schema.optional(Schema.NonEmptyString),
  category: Schema.optional(Schema.NonEmptyString),
  path: Schema.optional(Schema.NonEmptyString),
  properties: Schema.optional(EventAttributesSchema),
  options: Schema.optional(EventOptionsSchema),
}).annotate({ identifier: "PageEvent" });

export type EventAttributes = typeof EventAttributesSchema.Type;
export type EventOptions = typeof EventOptionsSchema.Type;
export type PageOptions = typeof PageEvent.Type;

export const BrowserIdentity = Schema.Struct({
  userId: Schema.optional(Schema.NonEmptyString),
  organizationId: Schema.optional(Schema.NonEmptyString),
}).annotate({ identifier: "BrowserTelemetryIdentity" });

export type BrowserIdentity = typeof BrowserIdentity.Type;
