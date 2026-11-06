import { Schema } from "effect";

const PositiveInt = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThan(0)),
).annotate({
  identifier: "NotificationPositiveInt",
});

const NonNegativeInt = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(0)),
).annotate({
  identifier: "NotificationNonNegativeInt",
});

const Uuid = Schema.String.pipe(Schema.check(Schema.isUUID())).annotate({
  identifier: "NotificationUuid",
});

export const NotificationDate = Schema.Union([
  Schema.Date,
  Schema.DateFromString,
]).annotate({
  identifier: "NotificationDate",
});

export const NotificationId = Uuid.annotate({
  identifier: "NotificationId",
});
export const NotificationPreferenceId = Uuid.annotate({
  identifier: "NotificationPreferenceId",
});
export const NotificationDeliveryId = Uuid.annotate({
  identifier: "NotificationDeliveryId",
});
export const NotificationDeliveryAttemptId = Uuid.annotate({
  identifier: "NotificationDeliveryAttemptId",
});
export const NotificationReminderId = Uuid.annotate({
  identifier: "NotificationReminderId",
});
export const NotificationQueueJobId = Uuid.annotate({
  identifier: "NotificationQueueJobId",
});

export const NotificationScope = Schema.Struct({
  recipientUserId: Schema.NullOr(Schema.NonEmptyString),
  organizationId: Schema.NullOr(Schema.NonEmptyString),
  workspaceId: Schema.NullOr(Schema.NonEmptyString),
}).annotate({ identifier: "NotificationScope" });

export const RecipientNotificationScope = Schema.Struct({
  recipientUserId: Schema.NonEmptyString,
  organizationId: Schema.NullOr(Schema.NonEmptyString),
  workspaceId: Schema.NullOr(Schema.NonEmptyString),
}).annotate({ identifier: "RecipientNotificationScope" });

export const NotificationDeliveryPurpose = Schema.Literals([
  "transactional",
  "notification",
]).annotate({ identifier: "NotificationDeliveryPurpose" });

export const NotificationDeliveryStatus = Schema.Literals([
  "queued",
  "processing",
  "sent",
  "retrying",
  "failed",
  "suppressed",
  "cancelled",
]).annotate({ identifier: "NotificationDeliveryStatus" });

export const NotificationReminderStatus = Schema.Literals([
  "scheduled",
  "queued",
  "processing",
  "retrying",
  "completed",
  "failed",
  "cancelled",
]).annotate({ identifier: "NotificationReminderStatus" });

export const PaginationCursor = Schema.Struct({
  createdAt: NotificationDate,
  id: Uuid,
}).annotate({ identifier: "NotificationPaginationCursor" });

export const Pagination = Schema.Struct({
  limit: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(100)),
  ),
  cursor: Schema.NullOr(PaginationCursor),
}).annotate({ identifier: "NotificationPagination" });

export const InboxSnapshotInput = Schema.Struct({
  locale: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.String),
  href: Schema.NullOr(Schema.String),
  metadata: Schema.Json,
}).annotate({ identifier: "InboxSnapshotInput" });

export const InboxNotification = Schema.Struct({
  id: NotificationId,
  idempotencyKey: Schema.NonEmptyString,
  scope: RecipientNotificationScope,
  eventKey: Schema.NonEmptyString,
  eventVersion: PositiveInt,
  locale: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.String),
  href: Schema.NullOr(Schema.String),
  metadata: Schema.Json,
  createdAt: NotificationDate,
  readAt: Schema.NullOr(NotificationDate),
  archivedAt: Schema.NullOr(NotificationDate),
}).annotate({ identifier: "InboxNotification" });

export const NotificationPreference = Schema.Struct({
  id: NotificationPreferenceId,
  scope: RecipientNotificationScope,
  eventKey: Schema.NullOr(Schema.NonEmptyString),
  channel: Schema.NonEmptyString,
  enabled: Schema.Boolean,
  createdAt: NotificationDate,
  updatedAt: NotificationDate,
}).annotate({ identifier: "NotificationPreference" });

export const ResolvedNotificationPreference = Schema.Struct({
  enabled: Schema.Boolean,
  source: Schema.Literals(["default", "preference"]),
  preference: Schema.NullOr(NotificationPreference),
}).annotate({ identifier: "ResolvedNotificationPreference" });

export const EmailSubscriptionInput = Schema.Struct({
  recipientUserId: Schema.NonEmptyString,
}).annotate({ identifier: "NotificationEmailSubscriptionInput" });

export const EmailSubscription = Schema.Struct({
  recipientUserId: Schema.NonEmptyString,
  unsubscribedAt: Schema.NullOr(NotificationDate),
}).annotate({ identifier: "NotificationEmailSubscription" });

export const EmailUnsubscribeUrl = Schema.NonEmptyString.pipe(
  Schema.check(
    Schema.isMaxLength(978),
    Schema.isPattern(/^[\x21-\x7e]+$/),
    Schema.isPattern(/^[^\s<>"\\]+$/),
    Schema.makeFilter((value) => {
      if (!URL.canParse(value)) return "Expected an absolute HTTPS URL";
      const url = new URL(value);
      return url.protocol === "https:" &&
        url.username === "" &&
        url.password === "" &&
        url.hash === ""
        ? undefined
        : "Expected an HTTPS URL without credentials or a fragment";
    }),
  ),
).annotate({ identifier: "NotificationEmailUnsubscribeUrl" });

export const EmailUnsubscribeOptions = Schema.Struct({
  secret: Schema.Redacted(Schema.String.check(Schema.isMinLength(32))),
  audience: Schema.NonEmptyString,
  endpoint: EmailUnsubscribeUrl,
  tokenTtlMillis: Schema.optional(PositiveInt),
}).annotate({ identifier: "NotificationEmailUnsubscribeOptions" });

export const EmailUnsubscribeTokenInput = Schema.Struct({
  token: Schema.String.check(
    Schema.isMaxLength(4096),
    Schema.isPattern(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/),
  ),
}).annotate({ identifier: "NotificationEmailUnsubscribeTokenInput" });

export const EmailUnsubscribeTokenClaims = Schema.Struct({
  version: Schema.Literal(1),
  purpose: Schema.Literal("email-unsubscribe"),
  audience: Schema.NonEmptyString,
  recipientUserId: Schema.NonEmptyString,
  expiresAt: NonNegativeInt,
}).annotate({ identifier: "NotificationEmailUnsubscribeTokenClaimsV1" });

export const EmailUnsubscribePost = Schema.Struct({
  "List-Unsubscribe": Schema.Literal("One-Click"),
}).annotate({ identifier: "NotificationEmailUnsubscribePost" });

export class EmailUnsubscribeTokenError extends Schema.TaggedError<
  EmailUnsubscribeTokenError,
  { readonly brand: unique symbol }
>()("EmailUnsubscribeTokenError", { message: Schema.String }) {}

export class EmailUnsubscribeConfigurationError extends Schema.TaggedError<
  EmailUnsubscribeConfigurationError,
  { readonly brand: unique symbol }
>()("EmailUnsubscribeConfigurationError", { message: Schema.String }) {}

export class EmailUnsubscribeCryptoError extends Schema.TaggedError<
  EmailUnsubscribeCryptoError,
  { readonly brand: unique symbol }
>()("EmailUnsubscribeCryptoError", { message: Schema.String }) {}

export const NotificationDeliveryReferenceInput = Schema.Struct({
  namespace: Schema.NonEmptyString.pipe(
    Schema.check(Schema.isPattern(/^(?!krakstack\.)/)),
  ),
  value: Schema.NonEmptyString,
}).annotate({ identifier: "NotificationDeliveryReferenceInput" });

export const NotificationRecipientAddress = Schema.NonEmptyString.pipe(
  Schema.check(
    Schema.makeFilter((address) =>
      address.trim().length > 0
        ? undefined
        : "Expected a recipient address containing a non-whitespace character",
    ),
  ),
).annotate({ identifier: "NotificationRecipientAddress" });

export const PublishDeliveryInput = Schema.Struct({
  key: Schema.NonEmptyString,
  channel: Schema.NonEmptyString,
  purpose: NotificationDeliveryPurpose,
  template: Schema.NullOr(Schema.NonEmptyString),
  recipientAddress: NotificationRecipientAddress,
  recipientName: Schema.NullOr(Schema.NonEmptyString),
  payloadVersion: PositiveInt,
  payload: Schema.Json,
  scheduledFor: Schema.optional(NotificationDate),
  expiresAt: Schema.optional(Schema.NullOr(NotificationDate)),
  maxAttempts: Schema.optional(PositiveInt),
  references: Schema.optional(Schema.Array(NotificationDeliveryReferenceInput)),
  dispatchPolicy: Schema.optional(Schema.NonEmptyString),
}).annotate({ identifier: "PublishNotificationDeliveryInput" });

const PublishInputFields = Schema.Struct({
  idempotencyKey: Schema.NonEmptyString,
  scope: NotificationScope,
  eventKey: Schema.NonEmptyString,
  eventVersion: PositiveInt,
  inbox: Schema.optional(Schema.NullOr(InboxSnapshotInput)),
  deliveries: Schema.Array(PublishDeliveryInput),
});

export const PublishInput = PublishInputFields.pipe(
  Schema.refine(
    (input): input is typeof input =>
      input.inbox !== undefined && input.inbox !== null
        ? true
        : input.deliveries.length > 0,
    { message: "Publish requires an inbox or at least one delivery" },
  ),
  Schema.refine(
    (input): input is typeof input =>
      input.inbox === undefined ||
      input.inbox === null ||
      input.scope.recipientUserId !== null,
    { message: "Inbox publication requires a recipient user id" },
  ),
  Schema.refine(
    (input): input is typeof input =>
      new Set(input.deliveries.map(({ key }) => key)).size ===
      input.deliveries.length,
    { message: "Publish delivery keys must be unique" },
  ),
).annotate({ identifier: "PublishNotificationInput" });

export const NotificationDelivery = Schema.Struct({
  id: NotificationDeliveryId,
  notificationId: Schema.NullOr(NotificationId),
  idempotencyKey: Schema.NonEmptyString,
  scope: NotificationScope,
  eventKey: Schema.NonEmptyString,
  eventVersion: PositiveInt,
  channel: Schema.NonEmptyString,
  purpose: NotificationDeliveryPurpose,
  template: Schema.NullOr(Schema.NonEmptyString),
  recipientAddress: NotificationRecipientAddress,
  recipientName: Schema.NullOr(Schema.NonEmptyString),
  payloadVersion: PositiveInt,
  payload: Schema.Json,
  status: NotificationDeliveryStatus,
  attempts: NonNegativeInt,
  maxAttempts: PositiveInt,
  provider: Schema.NullOr(Schema.NonEmptyString),
  providerMessageId: Schema.NullOr(Schema.NonEmptyString),
  errorMessage: Schema.NullOr(Schema.String),
  scheduledFor: NotificationDate,
  processingAt: Schema.NullOr(NotificationDate),
  lastAttemptAt: Schema.NullOr(NotificationDate),
  leaseExpiresAt: Schema.NullOr(NotificationDate),
  claimedBy: Schema.NullOr(Schema.NonEmptyString),
  currentJobId: Schema.NullOr(NotificationQueueJobId),
  jobGeneration: NonNegativeInt,
  queuedAt: Schema.NullOr(NotificationDate),
  expiresAt: Schema.NullOr(NotificationDate),
  sentAt: Schema.NullOr(NotificationDate),
  failedAt: Schema.NullOr(NotificationDate),
  suppressedAt: Schema.NullOr(NotificationDate),
  cancelledAt: Schema.NullOr(NotificationDate),
  createdAt: NotificationDate,
  updatedAt: NotificationDate,
}).annotate({ identifier: "NotificationDelivery" });

export const DeliveryAttemptSent = Schema.TaggedStruct("Sent", {
  provider: Schema.NonEmptyString,
  providerMessageId: Schema.NullOr(Schema.NonEmptyString),
}).annotate({ identifier: "NotificationDeliveryAttemptSent" });

export const DeliveryAttemptRetryableFailure = Schema.TaggedStruct(
  "RetryableFailure",
  {
    message: Schema.NonEmptyString,
    retryAfter: Schema.NullOr(NotificationDate),
  },
).annotate({
  identifier: "NotificationDeliveryAttemptRetryableFailure",
});

export const DeliveryAttemptPermanentFailure = Schema.TaggedStruct(
  "PermanentFailure",
  {
    message: Schema.NonEmptyString,
  },
).annotate({
  identifier: "NotificationDeliveryAttemptPermanentFailure",
});

export const DeliveryAttemptUnavailable = Schema.TaggedStruct("Unavailable", {
  message: Schema.NonEmptyString,
  retryAfter: Schema.NullOr(NotificationDate),
}).annotate({ identifier: "NotificationDeliveryAttemptUnavailable" });

export const DeliveryAttemptSkipped = Schema.TaggedStruct("Skipped", {
  reason: Schema.Literals([
    "cancelled",
    "expired",
    "stale",
    "terminal",
    "suppressed",
    "deferred",
  ]),
}).annotate({ identifier: "NotificationDeliveryAttemptSkipped" });

export const DeliveryAttemptOutcome = Schema.Union([
  DeliveryAttemptSent,
  DeliveryAttemptRetryableFailure,
  DeliveryAttemptPermanentFailure,
  DeliveryAttemptUnavailable,
  DeliveryAttemptSkipped,
]).annotate({ identifier: "NotificationDeliveryAttemptOutcome" });

export const NotificationDeliveryAttempt = Schema.Struct({
  id: NotificationDeliveryAttemptId,
  deliveryId: NotificationDeliveryId,
  jobId: NotificationQueueJobId,
  generation: PositiveInt,
  attempt: PositiveInt,
  outcome: Schema.NullOr(DeliveryAttemptOutcome),
  queuedAt: NotificationDate,
  startedAt: Schema.NullOr(NotificationDate),
  completedAt: Schema.NullOr(NotificationDate),
  createdAt: NotificationDate,
}).annotate({ identifier: "NotificationDeliveryAttempt" });

export const NotificationDeliveryReference = Schema.Struct({
  deliveryId: NotificationDeliveryId,
  namespace: Schema.NonEmptyString,
  value: Schema.NonEmptyString,
  createdAt: NotificationDate,
}).annotate({ identifier: "NotificationDeliveryReference" });

export const NotificationDeliveryDetail = Schema.Struct({
  delivery: NotificationDelivery,
  attempts: Schema.Array(NotificationDeliveryAttempt),
  references: Schema.Array(NotificationDeliveryReference),
}).annotate({ identifier: "NotificationDeliveryDetail" });

export const NotificationSuppression = Schema.Struct({
  id: Uuid,
  scope: NotificationScope,
  channel: Schema.NonEmptyString,
  purpose: Schema.NullOr(NotificationDeliveryPurpose),
  recipientAddress: NotificationRecipientAddress,
  reason: Schema.NullOr(Schema.String),
  expiresAt: Schema.NullOr(NotificationDate),
  createdAt: NotificationDate,
}).annotate({ identifier: "NotificationSuppression" });

export const ScheduleReminderInput = Schema.Struct({
  idempotencyKey: Schema.NonEmptyString,
  scope: NotificationScope,
  handlerKey: Schema.NonEmptyString,
  handlerVersion: PositiveInt,
  payload: Schema.Json,
  scheduledFor: NotificationDate,
  expiresAt: Schema.NullOr(NotificationDate),
  maxAttempts: Schema.optional(PositiveInt),
}).annotate({ identifier: "ScheduleNotificationReminderInput" });

export const NotificationReminder = Schema.Struct({
  id: NotificationReminderId,
  idempotencyKey: Schema.NonEmptyString,
  scope: NotificationScope,
  handlerKey: Schema.NonEmptyString,
  handlerVersion: PositiveInt,
  payload: Schema.Json,
  status: NotificationReminderStatus,
  scheduledFor: NotificationDate,
  attempts: NonNegativeInt,
  maxAttempts: PositiveInt,
  currentJobId: Schema.NullOr(NotificationQueueJobId),
  jobGeneration: NonNegativeInt,
  queuedAt: Schema.NullOr(NotificationDate),
  expiresAt: Schema.NullOr(NotificationDate),
  lastError: Schema.NullOr(Schema.String),
  completedAt: Schema.NullOr(NotificationDate),
  failedAt: Schema.NullOr(NotificationDate),
  cancelledAt: Schema.NullOr(NotificationDate),
  createdAt: NotificationDate,
  updatedAt: NotificationDate,
}).annotate({ identifier: "NotificationReminder" });

export const DeliveryQueueJob = Schema.TaggedStruct("Delivery", {
  deliveryId: NotificationDeliveryId,
  generation: PositiveInt,
  attempt: PositiveInt,
}).annotate({ identifier: "NotificationDeliveryQueueJob" });

export const ReminderQueueJob = Schema.TaggedStruct("Reminder", {
  reminderId: NotificationReminderId,
  generation: PositiveInt,
  attempt: PositiveInt,
}).annotate({ identifier: "NotificationReminderQueueJob" });

export const NotificationQueueJob = Schema.Union([
  DeliveryQueueJob,
  ReminderQueueJob,
]).annotate({
  identifier: "NotificationQueueJob",
});

export const NotificationTransportInput = Schema.Struct({
  dispatchId: Schema.NonEmptyString,
  deliveryId: Schema.NullOr(NotificationDeliveryId),
  attempt: PositiveInt,
  scope: NotificationScope,
  eventKey: Schema.NonEmptyString,
  eventVersion: PositiveInt,
  channel: Schema.NonEmptyString,
  template: Schema.NullOr(Schema.NonEmptyString),
  recipientAddress: NotificationRecipientAddress,
  recipientName: Schema.NullOr(Schema.NonEmptyString),
  payloadVersion: PositiveInt,
  payload: Schema.Json,
}).annotate({ identifier: "NotificationTransportInput" });

export const NotificationTransportResult = Schema.Struct({
  provider: Schema.NonEmptyString,
  providerMessageId: Schema.NullOr(Schema.NonEmptyString),
}).annotate({ identifier: "NotificationTransportResult" });

export const DirectNotificationInput = Schema.Struct({
  scope: NotificationScope,
  eventKey: Schema.NonEmptyString,
  eventVersion: PositiveInt,
  channel: Schema.NonEmptyString,
  template: Schema.NullOr(Schema.NonEmptyString),
  recipientAddress: NotificationRecipientAddress,
  recipientName: Schema.NullOr(Schema.NonEmptyString),
  payloadVersion: PositiveInt,
  payload: Schema.Json,
}).annotate({ identifier: "DirectNotificationInput" });

export const RetryPolicy = Schema.Struct({
  baseDelayMillis: PositiveInt,
  maxDelayMillis: PositiveInt,
}).annotate({ identifier: "NotificationRetryPolicy" });

export const EnqueueDueInput = Schema.Struct({
  limit: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(1_000)),
  ),
}).annotate({ identifier: "EnqueueDueNotificationsInput" });

export const EnqueueDueResult = Schema.Struct({
  reconciledDeliveries: NonNegativeInt,
  reconciledReminders: NonNegativeInt,
  deliveries: NonNegativeInt,
  reminders: NonNegativeInt,
  expiredDeliveries: NonNegativeInt,
  expiredReminders: NonNegativeInt,
}).annotate({ identifier: "EnqueueDueNotificationsResult" });

export const ReminderHandlerInput = Schema.Struct({
  reminderId: NotificationReminderId,
  jobId: NotificationQueueJobId,
  attempt: PositiveInt,
  scope: NotificationScope,
  handlerKey: Schema.NonEmptyString,
  handlerVersion: PositiveInt,
  payload: Schema.Json,
}).annotate({ identifier: "NotificationReminderHandlerInput" });

export const NotificationRuntimeOptions = Schema.Struct({
  dueBatchSize: Schema.optional(
    Schema.Int.pipe(
      Schema.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(1_000)),
    ),
  ),
  queueMaxAttempts: Schema.optional(PositiveInt),
  schedulerIntervalMillis: Schema.optional(PositiveInt),
  retryPolicy: Schema.optional(RetryPolicy),
}).annotate({ identifier: "NotificationRuntimeOptions" });

export const EmailAddress = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isPattern(/^[^\s<>@]+@[^\s<>@]+$/)),
).annotate({ identifier: "NotificationEmailAddress" });

export const EmailDisplayName = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isPattern(/^[^\r\n]+$/)),
).annotate({ identifier: "NotificationEmailDisplayName" });

export const EmailRecipient = Schema.Struct({
  address: EmailAddress,
  name: Schema.NullOr(EmailDisplayName),
}).annotate({ identifier: "NotificationEmailRecipient" });

const EmailPayloadV1Fields = Schema.Struct({
  from: Schema.optional(EmailAddress),
  replyTo: Schema.optional(EmailAddress),
  subject: Schema.NonEmptyString,
  text: Schema.optional(Schema.NonEmptyString),
  html: Schema.optional(Schema.NonEmptyString),
  unsubscribeUrl: Schema.optional(EmailUnsubscribeUrl),
});

export const EmailPayloadV1 = EmailPayloadV1Fields.pipe(
  Schema.refine(
    (payload): payload is typeof payload =>
      payload.text !== undefined || payload.html !== undefined,
    { message: "Email payload requires text or html" },
  ),
).annotate({ identifier: "NotificationEmailPayloadV1" });

export const PublishResult = Schema.Struct({
  notificationId: Schema.NullOr(NotificationId),
  deliveryIds: Schema.Array(NotificationDeliveryId),
  idempotentReplay: Schema.Boolean,
}).annotate({ identifier: "PublishNotificationResult" });

export const ListInboxInput = Schema.Struct({
  scope: RecipientNotificationScope,
  pagination: Pagination,
  unreadOnly: Schema.Boolean,
  includeArchived: Schema.Boolean,
}).annotate({ identifier: "ListNotificationInboxInput" });

export const InboxPage = Schema.Struct({
  items: Schema.Array(InboxNotification),
  nextCursor: Schema.NullOr(PaginationCursor),
}).annotate({ identifier: "NotificationInboxPage" });

export const InboxMutationInput = Schema.Struct({
  scope: RecipientNotificationScope,
  notificationId: NotificationId,
}).annotate({ identifier: "NotificationInboxMutationInput" });

const BulkInboxMutationInputFields = Schema.Struct({
  scope: RecipientNotificationScope,
  notificationIds: Schema.NonEmptyArray(NotificationId),
});

export const BulkInboxMutationInput = BulkInboxMutationInputFields.pipe(
  Schema.refine(
    (input): input is typeof input =>
      new Set(input.notificationIds).size === input.notificationIds.length,
    { message: "Bulk inbox notification ids must be unique" },
  ),
).annotate({ identifier: "BulkNotificationInboxMutationInput" });

export const UnreadCountInput = Schema.Struct({
  scope: RecipientNotificationScope,
}).annotate({ identifier: "NotificationUnreadCountInput" });

export const ListPreferencesInput = Schema.Struct({
  scope: RecipientNotificationScope,
}).annotate({ identifier: "ListNotificationPreferencesInput" });

export const SetPreferenceInput = Schema.Struct({
  scope: RecipientNotificationScope,
  eventKey: Schema.NullOr(Schema.NonEmptyString),
  channel: Schema.NonEmptyString,
  enabled: Schema.Boolean,
}).annotate({ identifier: "SetNotificationPreferenceInput" });

export const ResetPreferenceInput = Schema.Struct({
  scope: RecipientNotificationScope,
  eventKey: Schema.NullOr(Schema.NonEmptyString),
  channel: Schema.NonEmptyString,
}).annotate({ identifier: "ResetNotificationPreferenceInput" });

export const ResolvePreferenceInput = Schema.Struct({
  scope: RecipientNotificationScope,
  eventKey: Schema.NonEmptyString,
  channel: Schema.NonEmptyString,
}).annotate({ identifier: "ResolveNotificationPreferenceInput" });

export const ListDeliveriesInput = Schema.Struct({
  scope: NotificationScope,
  pagination: Pagination,
  channel: Schema.NullOr(Schema.NonEmptyString),
  statuses: Schema.Array(NotificationDeliveryStatus),
}).annotate({ identifier: "ListNotificationDeliveriesInput" });

export const DeliveryPage = Schema.Struct({
  items: Schema.Array(NotificationDelivery),
  nextCursor: Schema.NullOr(PaginationCursor),
}).annotate({ identifier: "NotificationDeliveryPage" });

export const DeliveryMutationInput = Schema.Struct({
  scope: NotificationScope,
  deliveryId: NotificationDeliveryId,
}).annotate({ identifier: "NotificationDeliveryMutationInput" });

export const RescheduleReminderInput = Schema.Struct({
  scope: NotificationScope,
  reminderId: NotificationReminderId,
  scheduledFor: NotificationDate,
  expiresAt: Schema.NullOr(NotificationDate),
}).annotate({ identifier: "RescheduleNotificationReminderInput" });

export const CancelReminderInput = Schema.Struct({
  scope: NotificationScope,
  reminderId: NotificationReminderId,
}).annotate({ identifier: "CancelNotificationReminderInput" });

export const ReminderMutationInput = Schema.Struct({
  scope: NotificationScope,
  reminderId: NotificationReminderId,
}).annotate({ identifier: "NotificationReminderMutationInput" });

export const ListRemindersInput = Schema.Struct({
  scope: NotificationScope,
  pagination: Pagination,
  statuses: Schema.Array(NotificationReminderStatus),
}).annotate({ identifier: "ListNotificationRemindersInput" });

export const ReminderPage = Schema.Struct({
  items: Schema.Array(NotificationReminder),
  nextCursor: Schema.NullOr(PaginationCursor),
}).annotate({ identifier: "NotificationReminderPage" });

export const ListSuppressionsInput = Schema.Struct({
  scope: NotificationScope,
  channel: Schema.NullOr(Schema.NonEmptyString),
  purposes: Schema.optional(
    Schema.Array(Schema.NullOr(NotificationDeliveryPurpose)),
  ),
  includeExpired: Schema.Boolean,
}).annotate({ identifier: "ListNotificationSuppressionsInput" });

export const SetSuppressionInput = Schema.Struct({
  scope: NotificationScope,
  channel: Schema.NonEmptyString,
  purpose: Schema.NullOr(NotificationDeliveryPurpose),
  recipientAddress: NotificationRecipientAddress,
  reason: Schema.NullOr(Schema.String),
  expiresAt: Schema.NullOr(NotificationDate),
}).annotate({ identifier: "SetNotificationSuppressionInput" });

export const ResetSuppressionInput = Schema.Struct({
  scope: NotificationScope,
  channel: Schema.NonEmptyString,
  purpose: Schema.NullOr(NotificationDeliveryPurpose),
  recipientAddress: NotificationRecipientAddress,
}).annotate({ identifier: "ResetNotificationSuppressionInput" });

export class NotificationValidationError extends Schema.TaggedError<
  NotificationValidationError,
  { readonly brand: unique symbol }
>()("NotificationValidationError", {
  operation: Schema.NonEmptyString,
  message: Schema.NonEmptyString,
  cause: Schema.optional(Schema.Defect()),
}) {}

export class NotificationStorageError extends Schema.TaggedError<
  NotificationStorageError,
  { readonly brand: unique symbol }
>()("NotificationStorageError", {
  operation: Schema.NonEmptyString,
  message: Schema.NonEmptyString,
  cause: Schema.optional(Schema.Defect()),
}) {}

export class NotificationQueueError extends Schema.TaggedError<
  NotificationQueueError,
  { readonly brand: unique symbol }
>()("NotificationQueueError", {
  operation: Schema.NonEmptyString,
  message: Schema.NonEmptyString,
  cause: Schema.optional(Schema.Defect()),
}) {}

export class NotificationDataError extends Schema.TaggedError<
  NotificationDataError,
  { readonly brand: unique symbol }
>()("NotificationDataError", {
  entity: Schema.NonEmptyString,
  message: Schema.NonEmptyString,
  cause: Schema.optional(Schema.Defect()),
}) {}

export class NotificationNotFoundError extends Schema.TaggedError<
  NotificationNotFoundError,
  { readonly brand: unique symbol }
>()("NotificationNotFoundError", {
  entity: Schema.Literals(["inbox", "delivery", "reminder"]),
  id: Uuid,
}) {}

export class NotificationTransitionError extends Schema.TaggedError<
  NotificationTransitionError,
  { readonly brand: unique symbol }
>()("NotificationTransitionError", {
  entity: Schema.Literals(["delivery", "reminder"]),
  id: Uuid,
  status: Schema.NonEmptyString,
  operation: Schema.NonEmptyString,
}) {}

export class NotificationIdempotencyConflictError extends Schema.TaggedError<
  NotificationIdempotencyConflictError,
  { readonly brand: unique symbol }
>()("NotificationIdempotencyConflictError", {
  idempotencyKey: Schema.NonEmptyString,
  message: Schema.NonEmptyString,
}) {}

export class NotificationTransportRetryable extends Schema.TaggedError<
  NotificationTransportRetryable,
  { readonly brand: unique symbol }
>()("NotificationTransportRetryable", {
  channel: Schema.NonEmptyString,
  message: Schema.NonEmptyString,
  retryAfter: Schema.optional(NotificationDate),
  cause: Schema.optional(Schema.Defect()),
}) {}

export class NotificationTransportPermanent extends Schema.TaggedError<
  NotificationTransportPermanent,
  { readonly brand: unique symbol }
>()("NotificationTransportPermanent", {
  channel: Schema.NonEmptyString,
  message: Schema.NonEmptyString,
  invalidRecipient: Schema.optional(Schema.Boolean),
  cause: Schema.optional(Schema.Defect()),
}) {}

export class NotificationTransportUnavailable extends Schema.TaggedError<
  NotificationTransportUnavailable,
  { readonly brand: unique symbol }
>()("NotificationTransportUnavailable", {
  channel: Schema.NonEmptyString,
  message: Schema.NonEmptyString,
  retryAfter: Schema.optional(NotificationDate),
  cause: Schema.optional(Schema.Defect()),
}) {}

export class NotificationTransportConfigurationError extends Schema.TaggedError<
  NotificationTransportConfigurationError,
  { readonly brand: unique symbol }
>()("NotificationTransportConfigurationError", {
  channel: Schema.NonEmptyString,
  message: Schema.NonEmptyString,
}) {}

export class DirectNotificationValidationError extends Schema.TaggedError<
  DirectNotificationValidationError,
  { readonly brand: unique symbol }
>()("DirectNotificationValidationError", {
  message: Schema.NonEmptyString,
  cause: Schema.optional(Schema.Defect()),
}) {}

export class ReminderHandlerRetryable extends Schema.TaggedError<
  ReminderHandlerRetryable,
  { readonly brand: unique symbol }
>()("ReminderHandlerRetryable", {
  handlerKey: Schema.NonEmptyString,
  handlerVersion: PositiveInt,
  message: Schema.NonEmptyString,
  retryAfter: Schema.optional(NotificationDate),
  cause: Schema.optional(Schema.Defect()),
}) {}

export class ReminderHandlerPermanent extends Schema.TaggedError<
  ReminderHandlerPermanent,
  { readonly brand: unique symbol }
>()("ReminderHandlerPermanent", {
  handlerKey: Schema.NonEmptyString,
  handlerVersion: PositiveInt,
  message: Schema.NonEmptyString,
  cause: Schema.optional(Schema.Defect()),
}) {}

export class ReminderHandlerUnavailable extends Schema.TaggedError<
  ReminderHandlerUnavailable,
  { readonly brand: unique symbol }
>()("ReminderHandlerUnavailable", {
  handlerKey: Schema.NonEmptyString,
  handlerVersion: PositiveInt,
  message: Schema.NonEmptyString,
  retryAfter: Schema.optional(NotificationDate),
  cause: Schema.optional(Schema.Defect()),
}) {}

export class ReminderHandlerConfigurationError extends Schema.TaggedError<
  ReminderHandlerConfigurationError,
  { readonly brand: unique symbol }
>()("ReminderHandlerConfigurationError", {
  handlerKey: Schema.NonEmptyString,
  handlerVersion: Schema.Int,
  message: Schema.NonEmptyString,
}) {}

export type NotificationDate = typeof NotificationDate.Type;
export type NotificationId = typeof NotificationId.Type;
export type NotificationPreferenceId = typeof NotificationPreferenceId.Type;
export type NotificationDeliveryId = typeof NotificationDeliveryId.Type;
export type NotificationDeliveryAttemptId =
  typeof NotificationDeliveryAttemptId.Type;
export type NotificationReminderId = typeof NotificationReminderId.Type;
export type NotificationQueueJobId = typeof NotificationQueueJobId.Type;
export type NotificationScope = typeof NotificationScope.Type;
export type RecipientNotificationScope = typeof RecipientNotificationScope.Type;
export type NotificationDeliveryPurpose =
  typeof NotificationDeliveryPurpose.Type;
export type NotificationDeliveryStatus = typeof NotificationDeliveryStatus.Type;
export type NotificationReminderStatus = typeof NotificationReminderStatus.Type;
export type PaginationCursor = typeof PaginationCursor.Type;
export type Pagination = typeof Pagination.Type;
export type InboxSnapshotInput = typeof InboxSnapshotInput.Type;
export type InboxNotification = typeof InboxNotification.Type;
export type NotificationPreference = typeof NotificationPreference.Type;
export type ResolvedNotificationPreference =
  typeof ResolvedNotificationPreference.Type;
export type EmailSubscriptionInput = typeof EmailSubscriptionInput.Type;
export type EmailSubscription = typeof EmailSubscription.Type;
export type EmailUnsubscribeOptions = typeof EmailUnsubscribeOptions.Type;
export type EmailUnsubscribeTokenInput = typeof EmailUnsubscribeTokenInput.Type;
export type NotificationDeliveryReferenceInput =
  typeof NotificationDeliveryReferenceInput.Type;
export type PublishDeliveryInput = typeof PublishDeliveryInput.Type;
export type PublishInput = typeof PublishInput.Type;
export type NotificationDelivery = typeof NotificationDelivery.Type;
export type DeliveryAttemptOutcome = typeof DeliveryAttemptOutcome.Type;
export type NotificationDeliveryAttempt =
  typeof NotificationDeliveryAttempt.Type;
export type NotificationDeliveryDetail = typeof NotificationDeliveryDetail.Type;
export type NotificationDeliveryReference =
  typeof NotificationDeliveryReference.Type;
export type NotificationSuppression = typeof NotificationSuppression.Type;
export type ScheduleReminderInput = typeof ScheduleReminderInput.Type;
export type NotificationReminder = typeof NotificationReminder.Type;
export type DeliveryQueueJob = typeof DeliveryQueueJob.Type;
export type ReminderQueueJob = typeof ReminderQueueJob.Type;
export type NotificationQueueJob = typeof NotificationQueueJob.Type;
export type NotificationTransportInput = typeof NotificationTransportInput.Type;
export type NotificationTransportResult =
  typeof NotificationTransportResult.Type;
export type NotificationTransportFailure =
  | NotificationTransportRetryable
  | NotificationTransportPermanent
  | NotificationTransportUnavailable;
export type DirectNotificationInput = typeof DirectNotificationInput.Type;
export type RetryPolicy = typeof RetryPolicy.Type;
export type EnqueueDueInput = typeof EnqueueDueInput.Type;
export type EnqueueDueResult = typeof EnqueueDueResult.Type;
export type ReminderHandlerInput = typeof ReminderHandlerInput.Type;
export type ReminderHandlerFailure =
  | ReminderHandlerRetryable
  | ReminderHandlerPermanent
  | ReminderHandlerUnavailable;
export type NotificationRuntimeOptions = typeof NotificationRuntimeOptions.Type;
export type EmailPayloadV1 = typeof EmailPayloadV1.Type;
export type EmailRecipient = typeof EmailRecipient.Type;
export type PublishResult = typeof PublishResult.Type;
export type ListInboxInput = typeof ListInboxInput.Type;
export type InboxPage = typeof InboxPage.Type;
export type InboxMutationInput = typeof InboxMutationInput.Type;
export type BulkInboxMutationInput = typeof BulkInboxMutationInput.Type;
export type UnreadCountInput = typeof UnreadCountInput.Type;
export type ListPreferencesInput = typeof ListPreferencesInput.Type;
export type SetPreferenceInput = typeof SetPreferenceInput.Type;
export type ResetPreferenceInput = typeof ResetPreferenceInput.Type;
export type ResolvePreferenceInput = typeof ResolvePreferenceInput.Type;
export type ListDeliveriesInput = typeof ListDeliveriesInput.Type;
export type DeliveryPage = typeof DeliveryPage.Type;
export type DeliveryMutationInput = typeof DeliveryMutationInput.Type;
export type RescheduleReminderInput = typeof RescheduleReminderInput.Type;
export type CancelReminderInput = typeof CancelReminderInput.Type;
export type ReminderMutationInput = typeof ReminderMutationInput.Type;
export type ListRemindersInput = typeof ListRemindersInput.Type;
export type ReminderPage = typeof ReminderPage.Type;
export type ListSuppressionsInput = typeof ListSuppressionsInput.Type;
export type SetSuppressionInput = typeof SetSuppressionInput.Type;
export type ResetSuppressionInput = typeof ResetSuppressionInput.Type;

export const NotificationBatchOptions = Schema.Struct({
  passes: Schema.optional(PositiveInt),
  intervalMillis: Schema.optional(PositiveInt),
  maxRunMillis: Schema.optional(PositiveInt),
  shutdownGraceMillis: Schema.optional(PositiveInt),
  idleMillis: Schema.optional(PositiveInt),
  deliveryConcurrency: Schema.optional(
    PositiveInt.check(Schema.isLessThanOrEqualTo(8)),
  ),
}).annotate({ identifier: "NotificationBatchOptions" });
export type NotificationBatchOptions = typeof NotificationBatchOptions.Type;

export const NotificationBatchResult = Schema.Struct({
  passes: Schema.Int,
  elapsedMillis: Schema.Finite,
  deliveries: Schema.Struct({
    sent: Schema.Int,
    retrying: Schema.Int,
    failed: Schema.Int,
    suppressed: Schema.Int,
    skipped: Schema.Int,
  }),
  completedReminderJobs: Schema.Int,
  stopReason: Schema.Literals(["completed", "time-limit"]),
}).annotate({ identifier: "NotificationBatchResult" });
export type NotificationBatchResult = typeof NotificationBatchResult.Type;

export class NotificationBatchTimeoutError extends Schema.TaggedError<
  NotificationBatchTimeoutError,
  { readonly brand: unique symbol }
>()("NotificationBatchTimeoutError", { message: Schema.NonEmptyString }) {}

export type NotificationServiceError =
  | NotificationValidationError
  | NotificationStorageError
  | NotificationQueueError
  | NotificationDataError
  | NotificationNotFoundError
  | NotificationTransitionError
  | NotificationIdempotencyConflictError;
