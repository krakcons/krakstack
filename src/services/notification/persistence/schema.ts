import { Schema } from "effect";

export const NOTIFICATION_DELIVERY_PURPOSES = [
  "transactional",
  "notification",
] as const;

export const NOTIFICATION_DELIVERY_STATUSES = [
  "queued",
  "processing",
  "sent",
  "retrying",
  "failed",
  "suppressed",
  "cancelled",
] as const;

export const NotificationDeliveryPurpose = Schema.Literals(
  NOTIFICATION_DELIVERY_PURPOSES,
).annotate({ identifier: "NotificationDeliveryPurpose" });

export const NotificationDeliveryStatus = Schema.Literals(
  NOTIFICATION_DELIVERY_STATUSES,
).annotate({ identifier: "NotificationDeliveryStatus" });

export const NotificationId = Schema.String.pipe(
  Schema.brand("NotificationId"),
).annotate({ identifier: "NotificationId" });

export const NotificationSettingId = Schema.String.pipe(
  Schema.brand("NotificationSettingId"),
).annotate({ identifier: "NotificationSettingId" });

export const NotificationDeliveryId = Schema.String.pipe(
  Schema.brand("NotificationDeliveryId"),
).annotate({ identifier: "NotificationDeliveryId" });

export const InboxNotificationSchema = Schema.Struct({
  id: NotificationId,
  idempotencyKey: Schema.NonEmptyString,
  recipientUserId: Schema.NonEmptyString,
  organizationId: Schema.NullOr(Schema.NonEmptyString),
  workspaceId: Schema.NullOr(Schema.NonEmptyString),
  eventKey: Schema.NonEmptyString,
  eventVersion: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0))),
  locale: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.String),
  href: Schema.NullOr(Schema.String),
  metadata: Schema.Json,
  createdAt: Schema.Date,
  readAt: Schema.NullOr(Schema.Date),
  archivedAt: Schema.NullOr(Schema.Date),
}).annotate({ identifier: "InboxNotification" });

export const NotificationSettingSchema = Schema.Struct({
  id: NotificationSettingId,
  recipientUserId: Schema.NonEmptyString,
  organizationId: Schema.NullOr(Schema.NonEmptyString),
  workspaceId: Schema.NullOr(Schema.NonEmptyString),
  eventKey: Schema.NullOr(Schema.NonEmptyString),
  channel: Schema.NonEmptyString,
  enabled: Schema.Boolean,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "NotificationSetting" });

export const NotificationDeliverySchema = Schema.Struct({
  id: NotificationDeliveryId,
  notificationId: Schema.NullOr(NotificationId),
  idempotencyKey: Schema.NonEmptyString,
  recipientUserId: Schema.NullOr(Schema.NonEmptyString),
  organizationId: Schema.NullOr(Schema.NonEmptyString),
  workspaceId: Schema.NullOr(Schema.NonEmptyString),
  eventKey: Schema.NonEmptyString,
  eventVersion: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0))),
  channel: Schema.NonEmptyString,
  purpose: NotificationDeliveryPurpose,
  template: Schema.NullOr(Schema.NonEmptyString),
  recipientAddress: Schema.NonEmptyString,
  recipientName: Schema.NullOr(Schema.NonEmptyString),
  payloadVersion: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0))),
  payload: Schema.Json,
  status: NotificationDeliveryStatus,
  attempts: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
  maxAttempts: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0))),
  provider: Schema.NullOr(Schema.NonEmptyString),
  providerMessageId: Schema.NullOr(Schema.NonEmptyString),
  errorMessage: Schema.NullOr(Schema.String),
  scheduledFor: Schema.Date,
  processingAt: Schema.NullOr(Schema.Date),
  lastAttemptAt: Schema.NullOr(Schema.Date),
  leaseExpiresAt: Schema.NullOr(Schema.Date),
  claimedBy: Schema.NullOr(Schema.NonEmptyString),
  sentAt: Schema.NullOr(Schema.Date),
  failedAt: Schema.NullOr(Schema.Date),
  suppressedAt: Schema.NullOr(Schema.Date),
  cancelledAt: Schema.NullOr(Schema.Date),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "NotificationDelivery" });

export const EmailDeliveryPayloadV1 = Schema.Struct({
  from: Schema.optional(Schema.NonEmptyString),
  to: Schema.Union([
    Schema.NonEmptyString,
    Schema.NonEmptyArray(Schema.NonEmptyString),
  ]),
  cc: Schema.optional(Schema.Array(Schema.NonEmptyString)),
  bcc: Schema.optional(Schema.Array(Schema.NonEmptyString)),
  replyTo: Schema.optional(Schema.Array(Schema.NonEmptyString)),
  subject: Schema.NonEmptyString,
  text: Schema.optional(Schema.NonEmptyString),
  html: Schema.optional(Schema.NonEmptyString),
})
  .pipe(
    Schema.refine(
      (
        payload,
      ): payload is typeof payload &
        ({ readonly text: string } | { readonly html: string }) =>
        payload.text !== undefined || payload.html !== undefined,
      { message: "Email delivery payload requires text or html" },
    ),
  )
  .annotate({ identifier: "EmailDeliveryPayloadV1" });

export const PersistedNotificationDeliveryPayload = Schema.Union([
  Schema.Struct({
    channel: Schema.Literal("email"),
    payloadVersion: Schema.Literal(1),
    payload: EmailDeliveryPayloadV1,
  }),
]).annotate({ identifier: "PersistedNotificationDeliveryPayload" });

export const decodeNotificationDeliveryPayload = Schema.decodeUnknownEffect(
  PersistedNotificationDeliveryPayload,
);

export type InboxNotification = typeof InboxNotificationSchema.Type;
export type NotificationSetting = typeof NotificationSettingSchema.Type;
export type NotificationDelivery = typeof NotificationDeliverySchema.Type;
export type EmailDeliveryPayloadV1 = typeof EmailDeliveryPayloadV1.Type;
export type PersistedNotificationDeliveryPayload =
  typeof PersistedNotificationDeliveryPayload.Type;
