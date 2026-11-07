// Read-only staff access to existing engine email deliveries.
import { Schema } from "effect";
import {
  NotificationScope,
  NotificationDate,
  NotificationDeliveryStatus,
  NotificationDeliveryPurpose,
  NotificationDeliveryAttempt,
  NotificationRecipientAddress,
  NotificationDeliveryReference,
} from "../schema.js";
import { SendId } from "./schema.js";
import { OperationWindow } from "./operations.schema.js";
import { TableQuery, tablePage } from "./table.schema.js";

export const DeliveryScopeGrant = Schema.Union([
  Schema.TaggedStruct("Exact", { scope: NotificationScope }),
  Schema.TaggedStruct("Organization", {
    organizationId: Schema.NonEmptyString,
  }),
  Schema.TaggedStruct("Installation", {}),
]).annotate({ identifier: "NotificationDeliveryScopeGrant" });

// Supplied by trusted host middleware, never decoded from a browser query.
export const DeliveryAdminAccess = Schema.Struct({
  contactManaged: Schema.Boolean,
  engineScopes: Schema.Array(DeliveryScopeGrant),
  referenceNamespaces: Schema.Array(Schema.NonEmptyString),
}).annotate({ identifier: "NotificationDeliveryAdminAccess" });

export const DeliverySource = Schema.Literals([
  "contacts",
  "engine",
  "all",
]).annotate({ identifier: "NotificationAdminDeliverySource" });
export const DeliverySelectionInput = Schema.Struct({
  source: Schema.optional(DeliverySource),
  scope: Schema.optional(NotificationScope),
}).annotate({ identifier: "NotificationAdminDeliverySelectionInput" });
export const DeliverySelection = Schema.Struct({
  ...DeliverySelectionInput.fields,
  scope: Schema.optional(Schema.fromJsonString(NotificationScope)),
}).annotate({ identifier: "NotificationAdminDeliverySelection" });
export const DeliveryOverviewQuery = Schema.Struct({
  ...DeliverySelection.fields,
  ...OperationWindow.fields,
}).annotate({ identifier: "NotificationAdminDeliveryOverviewQuery" });
export const DeliveryTableQuery = Schema.Struct({
  ...DeliverySelection.fields,
  ...TableQuery.fields,
}).annotate({ identifier: "NotificationAdminDeliveryTableQuery" });
const Count = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).annotate({
  identifier: "NotificationAdminDeliveryCount",
});
export const AdminDelivery = Schema.Struct({
  id: SendId,
  source: Schema.Literals(["contacts", "engine"]),
  recipientUserId: NotificationScope.fields.recipientUserId,
  organizationId: NotificationScope.fields.organizationId,
  workspaceId: NotificationScope.fields.workspaceId,
  contactId: Schema.NullOr(SendId),
  campaignId: Schema.NullOr(SendId),
  campaignName: Schema.NullOr(Schema.String),
  recipientAddress: NotificationRecipientAddress,
  recipientName: Schema.NullOr(Schema.String),
  eventKey: Schema.String,
  purpose: NotificationDeliveryPurpose,
  template: Schema.NullOr(Schema.String),
  status: NotificationDeliveryStatus,
  attempts: Count,
  maxAttempts: Count,
  provider: Schema.NullOr(Schema.String),
  providerMessageId: Schema.NullOr(Schema.String),
  errorMessage: Schema.NullOr(Schema.String),
  createdAt: NotificationDate,
  updatedAt: NotificationDate,
  scheduledFor: NotificationDate,
  sentAt: Schema.NullOr(NotificationDate),
}).annotate({ identifier: "NotificationAdminDelivery" });
export const AdminDeliveryPage = tablePage(
  AdminDelivery,
  "NotificationAdminDeliveryPage",
);
export const AdminDeliveryInspection = Schema.Struct({
  delivery: AdminDelivery,
  attempts: Schema.Array(NotificationDeliveryAttempt),
  references: Schema.Array(NotificationDeliveryReference),
}).annotate({ identifier: "NotificationAdminDeliveryInspection" });
export const DeliveryOverview = Schema.Struct({
  total: Count,
  queued: Count,
  processing: Count,
  retrying: Count,
  accepted: Count,
  failed: Count,
  suppressed: Count,
  cancelled: Count,
  // Engine feedback reconciliation is not changed by read-only administration.
  feedbackCovered: Count,
  feedbackUnavailable: Count,
  confirmed: Count,
  hardBounced: Count,
  softBounced: Count,
  complained: Count,
}).annotate({ identifier: "NotificationAdminDeliveryOverview" });
