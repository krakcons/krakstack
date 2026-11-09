// Notifications administration schemas.
import { Schema } from "effect";
import {
  EmailPayloadV1,
  NotificationDate,
  EmailUnsubscribeOptions,
  EmailUnsubscribeTokenInput,
  EmailUnsubscribePost,
} from "@krak-stack/notifications/schema";

export const SendId = Schema.String.check(Schema.isUUID()).annotate({
  identifier: "SendId",
});
export const RequestId = Schema.NonEmptyString.check(
  Schema.isMaxLength(200),
).annotate({ identifier: "SendRequestId" });
export const ContactEmail = Schema.Trim.check(
  Schema.isPattern(/^[^\s<>@]+@[^\s<>@]+$/),
  Schema.isMaxLength(320),
).annotate({ identifier: "SendContactEmail" });
export const ContactName = Schema.Trim.check(
  Schema.isMaxLength(200),
  Schema.isPattern(/^[^\r\n]*$/),
).annotate({ identifier: "SendContactName" });
export const ContactLocale = Schema.Literals(["en", "fr"]).annotate({
  identifier: "SendContactLocale",
});
export const EmailConsentStatus = Schema.Literals([
  "unknown",
  "subscribed",
  "unsubscribed",
]).annotate({ identifier: "SendEmailConsentStatus" });

export const Contact = Schema.Struct({
  id: SendId,
  name: Schema.String,
  locale: ContactLocale,
  email: ContactEmail,
  emailConsent: EmailConsentStatus,
  createdAt: NotificationDate,
  updatedAt: NotificationDate,
}).annotate({ identifier: "SendContact" });
export type Contact = typeof Contact.Type;

export const CreateContact = Schema.Struct({
  email: ContactEmail,
  name: Schema.optional(ContactName),
  locale: Schema.optional(ContactLocale),
}).annotate({ identifier: "SendCreateContact" });
export type CreateContact = typeof CreateContact.Type;

export const ContactParams = Schema.Struct({ id: SendId }).annotate({
  identifier: "SendContactParams",
});
export const UpdateContact = Schema.Struct({
  name: ContactName,
  locale: ContactLocale,
}).annotate({ identifier: "SendUpdateContact" });
export const UpdateContactRequest = Schema.Struct({
  id: SendId,
  payload: UpdateContact,
}).annotate({ identifier: "SendUpdateContactRequest" });

export const ContactListQuery = Schema.Struct({
  after: Schema.optional(SendId),
  limit: Schema.optional(
    Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })),
  ),
}).annotate({ identifier: "SendContactListQuery" });
export const ContactPage = Schema.Struct({
  items: Schema.Array(Contact),
  nextCursor: Schema.NullOr(SendId),
}).annotate({ identifier: "SendContactPage" });

export const EmailConsentChange = Schema.Struct({
  requestId: RequestId,
  status: Schema.Literals(["subscribed", "unsubscribed"]),
  noticeVersion: Schema.NonEmptyString.check(Schema.isMaxLength(200)),
}).annotate({ identifier: "SendEmailConsentChange" });
export const RecordEmailConsent = Schema.Struct({
  ...EmailConsentChange.fields,
  contactId: SendId,
  source: Schema.NonEmptyString.check(Schema.isMaxLength(100)),
  actor: Schema.NonEmptyString.check(Schema.isMaxLength(200)),
}).annotate({ identifier: "SendRecordEmailConsent" });
export type RecordEmailConsent = typeof RecordEmailConsent.Type;
export const EmailConsentEvent = Schema.Struct({
  ...RecordEmailConsent.fields,
  occurredAt: NotificationDate,
}).annotate({ identifier: "SendEmailConsentEvent" });

export const QueueEmail = Schema.Struct({
  requestId: RequestId,
  contactId: SendId,
  purpose: Schema.Literals(["transactional", "notification", "marketing"]),
  eventKey: Schema.NonEmptyString.check(Schema.isMaxLength(200)),
  email: EmailPayloadV1,
  scheduledFor: Schema.optional(NotificationDate),
  expiresAt: Schema.optional(NotificationDate),
})
  .check(
    Schema.makeFilter((input) =>
      input.purpose === "transactional" ||
      input.email.unsubscribeUrl !== undefined
        ? undefined
        : "Optional email requires an unsubscribe URL",
    ),
  )
  .annotate({ identifier: "SendQueueEmail" });
export type QueueEmail = typeof QueueEmail.Type;

export const SendDelivery = Schema.Struct({
  deliveryId: SendId,
  contactId: SendId,
  purpose: QueueEmail.fields.purpose,
}).annotate({ identifier: "SendDelivery" });

export class SendNotFound extends Schema.TaggedError<
  SendNotFound,
  { readonly brand: unique symbol }
>()("SendNotFound", { id: SendId }, { httpApiStatus: 404 }) {}
export class SendConflict extends Schema.TaggedError<
  SendConflict,
  { readonly brand: unique symbol }
>()("SendConflict", { message: Schema.String }, { httpApiStatus: 409 }) {}
export class SendConsentRequired extends Schema.TaggedError<
  SendConsentRequired,
  { readonly brand: unique symbol }
>()("SendConsentRequired", { contactId: SendId }) {}
export class SendValidationError extends Schema.TaggedError<
  SendValidationError,
  { readonly brand: unique symbol }
>()(
  "SendValidationError",
  { message: Schema.String },
  { httpApiStatus: 400 },
) {}
export class SendStorageError extends Schema.TaggedError<
  SendStorageError,
  { readonly brand: unique symbol }
>()(
  "SendStorageError",
  { message: Schema.String, cause: Schema.optional(Schema.Defect()) },
  { httpApiStatus: 500 },
) {}

export const ContactRequest = Schema.Struct({ contactId: SendId }).annotate({
  identifier: "SendContactRequest",
});
export const ConsentEventListQuery = Schema.Struct({
  before: Schema.optional(RequestId),
  limit: Schema.optional(
    Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })),
  ),
}).annotate({ identifier: "SendConsentEventListQuery" });
export const ConsentEventPage = Schema.Struct({
  items: Schema.Array(EmailConsentEvent),
  nextCursor: Schema.NullOr(RequestId),
}).annotate({ identifier: "SendConsentEventPage" });
export const ConsentEventListRequest = Schema.Struct({
  contactId: SendId,
  query: ConsentEventListQuery,
}).annotate({ identifier: "SendConsentEventListRequest" });

export const StoredEmailRequest = Schema.Struct({
  request: Schema.toCodecJson(QueueEmail),
  deliveryId: Schema.NullOr(SendId),
  matches: Schema.Boolean,
}).annotate({ identifier: "SendStoredEmailRequest" });

export const QueuedEmail = Schema.Struct({
  deliveryId: SendId,
  idempotentReplay: Schema.Boolean,
}).annotate({ identifier: "SendQueuedEmail" });

export const DeliveryConsent = Schema.Struct({
  purpose: QueueEmail.fields.purpose,
  status: EmailConsentStatus,
}).annotate({ identifier: "SendDeliveryConsent" });

export const SendUnsubscribeOptions = EmailUnsubscribeOptions.annotate({
  identifier: "SendUnsubscribeOptions",
});
export type SendUnsubscribeOptions = typeof SendUnsubscribeOptions.Type;
export const SendUnsubscribeTokenInput = EmailUnsubscribeTokenInput.annotate({
  identifier: "SendUnsubscribeTokenInput",
});
export type SendUnsubscribeTokenInput = typeof SendUnsubscribeTokenInput.Type;
export const SendUnsubscribePost = EmailUnsubscribePost.annotate({
  identifier: "SendUnsubscribePost",
});
export const SendUnsubscribeSearch = Schema.Struct({
  ...SendUnsubscribeTokenInput.fields,
  locale: Schema.optional(ContactLocale),
}).annotate({ identifier: "SendUnsubscribeSearch" });
export const SendUnsubscribeClaims = Schema.Struct({
  version: Schema.Literal(1),
  purpose: Schema.Literal("kraksend-contact-email-unsubscribe"),
  audience: Schema.NonEmptyString,
  contactId: SendId,
  expiresAt: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
}).annotate({ identifier: "SendUnsubscribeClaimsV1" });
export class SendUnsubscribeTokenError extends Schema.TaggedError<
  SendUnsubscribeTokenError,
  { readonly brand: unique symbol }
>()("SendUnsubscribeTokenError", { message: Schema.String }) {}
export class SendUnsubscribeConfigurationError extends Schema.TaggedError<
  SendUnsubscribeConfigurationError,
  { readonly brand: unique symbol }
>()("SendUnsubscribeConfigurationError", { message: Schema.String }) {}
export class SendUnsubscribeCryptoError extends Schema.TaggedError<
  SendUnsubscribeCryptoError,
  { readonly brand: unique symbol }
>()("SendUnsubscribeCryptoError", { message: Schema.String }) {}

export const FeedbackProvider = Schema.NonEmptyString.check(
  Schema.isMaxLength(64),
  Schema.isPattern(/^[a-z0-9_-]+$/),
).annotate({ identifier: "SendFeedbackProvider" });
export const FeedbackPayload = Schema.Struct({
  eventId: RequestId,
  providerMessageId: Schema.NonEmptyString.check(Schema.isMaxLength(512)),
  recipientAddress: ContactEmail,
  kind: Schema.Literals([
    "delivered",
    "hard_bounce",
    "soft_bounce",
    "complaint",
  ]),
  occurredAt: NotificationDate,
}).annotate({ identifier: "SendFeedbackPayload" });
export const RecordFeedback = Schema.Struct({
  provider: FeedbackProvider,
  ...FeedbackPayload.fields,
}).annotate({ identifier: "SendRecordFeedback" });
export type RecordFeedback = typeof RecordFeedback.Type;
export const StoredFeedback = Schema.Struct({
  ...RecordFeedback.fields,
  deliveryId: Schema.NullOr(SendId),
  appliedAt: Schema.NullOr(NotificationDate),
}).annotate({ identifier: "SendStoredFeedback" });
export const FeedbackReceipt = Schema.Struct({
  status: Schema.Literals(["pending", "applied"]),
  deliveryId: Schema.NullOr(SendId),
  idempotentReplay: Schema.Boolean,
}).annotate({ identifier: "SendFeedbackReceipt" });
export const ReconcileFeedback = Schema.Struct({
  limit: Schema.optional(
    Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })),
  ),
}).annotate({ identifier: "SendReconcileFeedback" });
export const ReconcileFeedbackResult = Schema.Struct({
  checked: Schema.Int,
  applied: Schema.Int,
  pending: Schema.Int,
}).annotate({ identifier: "SendReconcileFeedbackResult" });

const SesFeedbackMail = Schema.Struct({
  messageId: FeedbackPayload.fields.providerMessageId,
}).annotate({ identifier: "SendSesFeedbackMail" });
const SesFeedbackRecipients = Schema.Array(
  Schema.Struct({ emailAddress: ContactEmail }),
)
  .check(Schema.isMinLength(1), Schema.isMaxLength(100))
  .annotate({ identifier: "SendSesFeedbackRecipients" });
export const SesFeedbackNotification = Schema.Union([
  Schema.Struct({
    eventType: Schema.Literal("Bounce"),
    mail: SesFeedbackMail,
    bounce: Schema.Struct({
      bounceType: Schema.Literals(["Permanent", "Transient", "Undetermined"]),
      timestamp: NotificationDate,
      bouncedRecipients: SesFeedbackRecipients,
    }),
  }),
  Schema.Struct({
    eventType: Schema.Literal("Complaint"),
    mail: SesFeedbackMail,
    complaint: Schema.Struct({
      timestamp: NotificationDate,
      complainedRecipients: SesFeedbackRecipients,
    }),
  }),
  Schema.Struct({
    eventType: Schema.Literal("Delivery"),
    mail: SesFeedbackMail,
    delivery: Schema.Struct({
      timestamp: NotificationDate,
      recipients: Schema.Array(ContactEmail).check(
        Schema.isMinLength(1),
        Schema.isMaxLength(100),
      ),
    }),
  }),
]).annotate({ identifier: "SendSesFeedbackNotification" });
export const NormalizeSesFeedback = Schema.Struct({
  eventId: RequestId,
  notification: SesFeedbackNotification,
}).annotate({ identifier: "SendNormalizeSesFeedback" });

export const CampaignSafetyOptions = Schema.Struct({
  environment: Schema.Literals(["production", "development", "test"]),
  sendingEnabled: Schema.Boolean,
  allowedRecipients: Schema.Array(ContactEmail),
}).annotate({ identifier: "SendCampaignSafetyOptions" });
export class CampaignSafetyError extends Schema.TaggedError<
  CampaignSafetyError,
  { readonly brand: unique symbol }
>()(
  "CampaignSafetyError",
  { message: Schema.String },
  { httpApiStatus: 409 },
) {}

export const CampaignCopy = Schema.Struct({
  subject: Schema.NonEmptyString.check(
    Schema.isMaxLength(998),
    Schema.isPattern(/^[^\r\n]+$/),
  ),
  text: Schema.NonEmptyString.check(Schema.isMaxLength(100_000)),
  unsubscribeText: Schema.NonEmptyString.check(Schema.isMaxLength(200)),
}).annotate({ identifier: "SendCampaignCopy" });
export const CampaignAudience = Schema.Union([
  Schema.TaggedStruct("AllSubscribed", {}),
  Schema.TaggedStruct("Contacts", {
    ids: Schema.Array(SendId).check(
      Schema.isMinLength(1),
      Schema.isMaxLength(1000),
    ),
  }),
]).annotate({ identifier: "SendCampaignAudience" });
export const CreateCampaign = Schema.Struct({
  requestId: RequestId,
  name: Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(200)),
  from: ContactEmail,
  audience: CampaignAudience,
  content: Schema.Struct({ en: CampaignCopy, fr: CampaignCopy }),
}).annotate({ identifier: "SendCreateCampaign" });
export const CreateCampaignRequest = Schema.Struct({
  payload: CreateCampaign,
  actor: RecordEmailConsent.fields.actor,
}).annotate({ identifier: "SendCreateCampaignRequest" });
export const CampaignStatus = Schema.Literals([
  "draft",
  "scheduled",
  "running",
  "paused",
  "cancelled",
  "completed",
]).annotate({ identifier: "SendCampaignStatus" });
export const Campaign = Schema.Struct({
  id: SendId,
  name: CreateCampaign.fields.name,
  from: ContactEmail,
  audience: CampaignAudience,
  content: CreateCampaign.fields.content,
  status: CampaignStatus,
  scheduledFor: Schema.NullOr(NotificationDate),
  snapshotAt: Schema.NullOr(NotificationDate),
  batchNumber: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  createdAt: NotificationDate,
}).annotate({ identifier: "SendCampaign" });
export const CampaignStored = Schema.Struct({
  ...Campaign.fields,
  matches: Schema.Boolean,
}).annotate({ identifier: "SendCampaignStored" });
export const ScheduleCampaign = Schema.Struct({
  id: SendId,
  scheduledFor: NotificationDate,
}).annotate({ identifier: "SendScheduleCampaign" });
export const CampaignAction = Schema.Struct({
  action: Schema.Literals(["pause", "resume", "cancel"]),
}).annotate({ identifier: "SendCampaignAction" });
export const CampaignTransition = Schema.Struct({
  id: SendId,
  ...CampaignAction.fields,
}).annotate({ identifier: "SendCampaignTransition" });
export const CampaignBatch = Schema.Struct({
  id: SendId,
  batchNumber: Campaign.fields.batchNumber,
  limit: Schema.optional(
    Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })),
  ),
}).annotate({ identifier: "SendCampaignBatch" });
export const CampaignBatchResult = Schema.Struct({
  queued: Schema.Int,
  skipped: Schema.Int,
  hasMore: Schema.Boolean,
}).annotate({ identifier: "SendCampaignBatchResult" });
export const CampaignWork = Schema.Struct({
  id: SendId,
  batchNumber: Campaign.fields.batchNumber,
}).annotate({ identifier: "SendCampaignWork" });
export const CampaignPage = Schema.Struct({
  items: Schema.Array(Campaign),
  nextCursor: Schema.NullOr(SendId),
}).annotate({ identifier: "SendCampaignPage" });
export const CampaignDeliveryPolicy = Schema.Struct({
  ...DeliveryConsent.fields,
  campaignStatus: Schema.NullOr(CampaignStatus),
  campaignFrom: Schema.NullOr(ContactEmail),
}).annotate({ identifier: "SendCampaignDeliveryPolicy" });
export class CampaignExecutionError extends Schema.TaggedError<
  CampaignExecutionError,
  { readonly brand: unique symbol }
>()("CampaignExecutionError", { message: Schema.String }) {}

export const CampaignSchedulePayload = Schema.Struct({
  scheduledFor: NotificationDate,
}).annotate({ identifier: "SendCampaignSchedulePayload" });
export const CampaignScheduleForm = Schema.Struct({
  scheduledFor: Schema.DateFromString,
}).annotate({ identifier: "SendCampaignScheduleForm" });
export const CampaignForm = Schema.Struct({
  name: CreateCampaign.fields.name,
  from: ContactEmail,
  enSubject: CampaignCopy.fields.subject,
  enText: CampaignCopy.fields.text,
  frSubject: CampaignCopy.fields.subject,
  frText: CampaignCopy.fields.text,
}).annotate({ identifier: "SendCampaignForm" });
const CampaignCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));
export const CampaignReport = Schema.Struct({
  audience: CampaignCount,
  pending: CampaignCount,
  published: CampaignCount,
  skipped: CampaignCount,
  accepted: CampaignCount,
  failed: CampaignCount,
  suppressed: CampaignCount,
  confirmed: CampaignCount,
  hardBounced: CampaignCount,
  complained: CampaignCount,
}).annotate({ identifier: "SendCampaignReport" });
