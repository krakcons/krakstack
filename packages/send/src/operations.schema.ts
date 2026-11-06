import { Schema } from "effect";
import {
  NotificationDate,
  NotificationDeliveryStatus,
  NotificationDeliveryAttempt,
} from "@krak-stack/notifications/schema";
import {
  ContactEmail,
  ContactParams,
  RecordEmailConsent,
  RequestId,
  SendId,
  FeedbackPayload,
} from "./schema.js";

const Count = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).annotate({
  identifier: "SendOperationCount",
});
export const OperationSearch = Schema.Trim.check(
  Schema.isMaxLength(200),
).annotate({ identifier: "SendOperationSearch" });
export const OperationWindow = Schema.Struct({
  since: Schema.optional(NotificationDate),
  until: Schema.optional(NotificationDate),
}).annotate({ identifier: "SendOperationWindow" });
export const OperationQuery = Schema.Struct({
  ...OperationWindow.fields,
  search: Schema.optional(OperationSearch),
  before: Schema.optional(RequestId),
  limit: Schema.optional(
    Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })),
  ),
}).annotate({ identifier: "SendOperationQuery" });
export const ActivityQuery = Schema.Struct({
  ...OperationQuery.fields,
  status: Schema.optional(NotificationDeliveryStatus),
  campaignId: Schema.optional(SendId),
  contactId: Schema.optional(SendId),
}).annotate({ identifier: "SendActivityQuery" });
export const FeedbackQuery = Schema.Struct({
  ...OperationQuery.fields,
  kind: Schema.optional(
    Schema.Literals([
      "bounces",
      "delivered",
      "hard_bounce",
      "soft_bounce",
      "complaint",
    ]),
  ),
  correlation: Schema.optional(Schema.Literals(["pending", "applied"])),
  deliveryId: Schema.optional(SendId),
}).annotate({ identifier: "SendFeedbackQuery" });
export const SuppressionQuery = Schema.Struct({
  ...OperationQuery.fields,
  state: Schema.optional(Schema.Literals(["active", "expired", "all"])),
}).annotate({ identifier: "SendSuppressionQuery" });
export const RecipientQuery = Schema.Struct({
  search: OperationQuery.fields.search,
  before: OperationQuery.fields.before,
  limit: OperationQuery.fields.limit,
  campaignId: SendId,
  status: Schema.optional(Schema.Literals(["pending", "queued", "skipped"])),
}).annotate({ identifier: "SendRecipientQuery" });
export const DeliveryActivity = Schema.Struct({
  id: SendId,
  contactId: SendId,
  email: ContactEmail,
  name: Schema.String,
  campaignId: Schema.NullOr(SendId),
  campaignName: Schema.NullOr(Schema.String),
  purpose: Schema.String,
  eventKey: Schema.String,
  subject: Schema.NullOr(Schema.String),
  status: NotificationDeliveryStatus,
  attempts: Count,
  maxAttempts: Count,
  provider: Schema.NullOr(Schema.String),
  providerMessageId: Schema.NullOr(Schema.String),
  errorMessage: Schema.NullOr(Schema.String),
  createdAt: NotificationDate,
  scheduledFor: NotificationDate,
  updatedAt: NotificationDate,
  sentAt: Schema.NullOr(NotificationDate),
  confirmed: Schema.Boolean,
  hardBounced: Schema.Boolean,
  softBounced: Schema.Boolean,
  complained: Schema.Boolean,
}).annotate({ identifier: "SendDeliveryActivity" });
export const FeedbackRecord = Schema.Struct({
  id: RequestId,
  provider: Schema.String,
  ...FeedbackPayload.fields,
  receivedAt: NotificationDate,
  checkedAt: Schema.NullOr(NotificationDate),
  appliedAt: Schema.NullOr(NotificationDate),
  deliveryId: Schema.NullOr(SendId),
  contactId: Schema.NullOr(SendId),
  campaignId: Schema.NullOr(SendId),
}).annotate({ identifier: "SendFeedbackRecord" });
export const SuppressionRecord = Schema.Struct({
  id: SendId,
  version: RequestId,
  email: ContactEmail,
  purpose: Schema.NullOr(Schema.String),
  reason: Schema.NullOr(Schema.String),
  expiresAt: Schema.NullOr(NotificationDate),
  createdAt: NotificationDate,
  active: Schema.Boolean,
}).annotate({ identifier: "SendSuppressionRecord" });
export const SuppressionReason = Schema.Trim.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(500),
).annotate({ identifier: "SendSuppressionReason" });
export const AddSuppression = Schema.Struct({
  requestId: RequestId,
  email: ContactEmail,
  reason: SuppressionReason,
}).annotate({ identifier: "SendAddSuppression" });
export const RemoveSuppression = Schema.Struct({
  requestId: RequestId,
  version: RequestId,
  reason: SuppressionReason,
}).annotate({ identifier: "SendRemoveSuppression" });
export const SuppressionForm = Schema.Struct({
  email: ContactEmail,
  reason: SuppressionReason,
}).annotate({ identifier: "SendSuppressionForm" });
export const AddSuppressionRequest = Schema.Struct({
  payload: AddSuppression,
  actor: RecordEmailConsent.fields.actor,
}).annotate({ identifier: "SendAddSuppressionRequest" });
export const RemoveSuppressionRequest = Schema.Struct({
  ...ContactParams.fields,
  payload: RemoveSuppression,
  actor: RecordEmailConsent.fields.actor,
}).annotate({ identifier: "SendRemoveSuppressionRequest" });
export const SuppressionChange = Schema.Struct({
  suppressionId: SendId,
}).annotate({ identifier: "SendSuppressionChange" });
export const SuppressionAudit = Schema.Struct({
  requestId: RequestId,
  suppressionId: SendId,
  email: ContactEmail,
  action: Schema.Literals(["add", "remove"]),
  reason: Schema.String,
  previousReason: Schema.NullOr(Schema.String),
  actor: Schema.String,
  occurredAt: NotificationDate,
}).annotate({ identifier: "SendSuppressionAudit" });
export const StoredSuppressionChange = Schema.Struct({
  ...SuppressionChange.fields,
  matches: Schema.Boolean,
}).annotate({ identifier: "SendStoredSuppressionChange" });
export const CampaignRecipient = Schema.Struct({
  id: SendId,
  email: ContactEmail,
  name: Schema.String,
  status: Schema.Literals(["pending", "queued", "skipped"]),
  reason: Schema.NullOr(Schema.String),
  deliveryId: Schema.NullOr(SendId),
}).annotate({ identifier: "SendCampaignRecipient" });
export const ActivityPage = Schema.Struct({
  items: Schema.Array(DeliveryActivity),
  nextCursor: Schema.NullOr(RequestId),
}).annotate({ identifier: "SendActivityPage" });
export const FeedbackPage = Schema.Struct({
  items: Schema.Array(FeedbackRecord),
  nextCursor: Schema.NullOr(RequestId),
}).annotate({ identifier: "SendFeedbackPage" });
export const SuppressionPage = Schema.Struct({
  items: Schema.Array(SuppressionRecord),
  nextCursor: Schema.NullOr(RequestId),
}).annotate({ identifier: "SendSuppressionPage" });
export const SuppressionAuditPage = Schema.Struct({
  items: Schema.Array(SuppressionAudit),
  nextCursor: Schema.NullOr(RequestId),
}).annotate({ identifier: "SendSuppressionAuditPage" });
export const RecipientPage = Schema.Struct({
  items: Schema.Array(CampaignRecipient),
  nextCursor: Schema.NullOr(RequestId),
}).annotate({ identifier: "SendRecipientPage" });
export const DeliveryInspection = Schema.Struct({
  delivery: DeliveryActivity,
  attempts: Schema.Array(NotificationDeliveryAttempt),
}).annotate({ identifier: "SendDeliveryInspection" });
export const SendingOverview = Schema.Struct({
  total: Count,
  queued: Count,
  processing: Count,
  retrying: Count,
  accepted: Count,
  failed: Count,
  suppressed: Count,
  cancelled: Count,
  confirmed: Count,
  hardBounced: Count,
  softBounced: Count,
  complained: Count,
  pendingFeedback: Count,
  activeSuppressions: Count,
}).annotate({ identifier: "SendSendingOverview" });
export const SequenceCursor = Schema.String.check(
  Schema.isPattern(/^[1-9][0-9]{0,17}$/),
).annotate({ identifier: "SendSequenceCursor" });
export const OperationsView = Schema.Literals([
  "overview",
  "activity",
  "feedback",
  "suppressions",
  "audit",
  "recipients",
]).annotate({ identifier: "SendOperationsView" });
export const OperationsFilters = Schema.Struct({
  ...OperationWindow.fields,
  search: Schema.optional(OperationSearch),
  status: ActivityQuery.fields.status,
  campaignId: Schema.optional(SendId),
  contactId: Schema.optional(SendId),
  deliveryId: Schema.optional(SendId),
  kind: FeedbackQuery.fields.kind,
  correlation: FeedbackQuery.fields.correlation,
  state: SuppressionQuery.fields.state,
  recipientStatus: RecipientQuery.fields.status,
}).annotate({ identifier: "SendOperationsFilters" });
export const OperationsFilterForm = Schema.Struct({
  search: OperationSearch,
  since: Schema.Union([Schema.Literal(""), Schema.DateFromString]),
  until: Schema.Union([Schema.Literal(""), Schema.DateFromString]),
  campaignId: Schema.Union([Schema.Literal(""), SendId]),
  status: Schema.Union([Schema.Literal(""), NotificationDeliveryStatus]),
  kind: Schema.Literals([
    "",
    "bounces",
    "delivered",
    "hard_bounce",
    "soft_bounce",
    "complaint",
  ]),
  correlation: Schema.Union([
    Schema.Literal(""),
    Schema.Literals(["pending", "applied"]),
  ]),
  state: Schema.Literals(["active", "expired", "all"]),
  recipientStatus: Schema.Union([
    Schema.Literal(""),
    Schema.Literals(["pending", "queued", "skipped"]),
  ]),
}).annotate({ identifier: "SendOperationsFilterForm" });
