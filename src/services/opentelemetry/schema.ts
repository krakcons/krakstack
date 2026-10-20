import { Schema } from "effect";

export const BrowserAnalyticsPreference = Schema.Struct({
  version: Schema.String,
  choice: Schema.Literals(["accepted", "declined"]),
  /** A consent revision, not a visitor identifier; never exported with telemetry. */
  revision: Schema.String,
  issuedAt: Schema.Finite,
  expiresAt: Schema.Finite,
}).annotate({ identifier: "BrowserAnalyticsPreference" });

export const BrowserPrivacySignals = Schema.Struct({
  globalPrivacyControl: Schema.optional(Schema.Boolean),
}).annotate({ identifier: "BrowserPrivacySignals" });

export const BrowserWebVital = Schema.Struct({
  name: Schema.Literals(["LCP", "INP", "CLS", "FCP", "TTFB"]),
  id: Schema.NonEmptyString.check(Schema.isMaxLength(64)),
  value: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
  delta: Schema.Finite,
  rating: Schema.Literals(["good", "needs-improvement", "poor"]),
  navigationType: Schema.Literals([
    "navigate",
    "reload",
    "back-forward",
    "back-forward-cache",
    "prerender",
    "restore",
  ]),
}).annotate({ identifier: "BrowserWebVital" });

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

export type EventAttributes = typeof EventAttributesSchema.Type;
export type EventOptions = typeof EventOptionsSchema.Type;
