import { Schema } from "effect";
import { isAllowedWebhookUrlString, isPublicWebhookUrlString } from "./url";
import {
  ColumnFilter,
  ColumnFilters,
  PaginatedResponse,
  Query,
  SortParams,
} from "../../lib/query";

export const webhookColumns =
  'id, organization_id AS "organizationId", COALESCE(name, url) AS name, url, description, headers, events, secret, enabled, created_at AS "createdAt", updated_at AS "updatedAt"';
export const deliveryColumns =
  'd.id, d.webhook_id AS "webhookId", d.event, d.data, d.status, d.error, d.completed_at AS "completedAt", d.retry_at AS "retryAt", d.retries, d.created_at AS "createdAt", d.updated_at AS "updatedAt"';

export const WebhookScope = Schema.Struct({
  organizationId: Schema.NonEmptyString,
}).annotate({ identifier: "WebhookScope" });
export const WebhookRequest = Schema.Struct({
  organizationId: Schema.NonEmptyString,
  id: Schema.NonEmptyString,
}).annotate({ identifier: "WebhookRequest" });
export const WebhookStatisticsInterval = Schema.Literals([
  "hour",
  "day",
]).annotate({ identifier: "WebhookStatisticsInterval" });
export type WebhookStatisticsInterval = typeof WebhookStatisticsInterval.Type;
export const WebhookStatisticsRequest = Schema.Struct({
  ...WebhookRequest.fields,
  interval: WebhookStatisticsInterval,
}).annotate({ identifier: "WebhookStatisticsRequest" });
export const WebhookDeliveryCounts = Schema.Struct({
  total: Schema.Int,
  success: Schema.Int,
  failed: Schema.Int,
}).annotate({ identifier: "WebhookDeliveryCounts" });
export const WebhookEventCount = Schema.Struct({
  event: Schema.String,
  total: Schema.Int,
}).annotate({ identifier: "WebhookEventCount" });
export const WebhookDeliveryBucket = Schema.Struct({
  ...WebhookDeliveryCounts.fields,
  bucket: Schema.Date,
  events: Schema.Array(WebhookEventCount),
}).annotate({ identifier: "WebhookDeliveryBucket" });
export const WebhookStatistics = Schema.Struct({
  ...WebhookDeliveryCounts.fields,
  buckets: Schema.Array(WebhookDeliveryBucket),
}).annotate({ identifier: "WebhookStatistics" });
export const WebhookName = Schema.Trim.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(200),
).annotate({ identifier: "WebhookName" });
export const WebhookPayload = Schema.Struct({
  name: Schema.optional(WebhookName),
  url: Schema.String.check(
    Schema.makeFilter(isPublicWebhookUrlString, {
      expected: "a public HTTP or HTTPS URL without credentials",
    }),
  ),
  description: Schema.NullOr(Schema.String),
  enabled: Schema.Boolean,
  events: Schema.NullOr(Schema.Array(Schema.NonEmptyString)),
  customHeaders: Schema.NullOr(
    Schema.Record(Schema.String, Schema.String),
  ).check(
    Schema.makeFilter(
      (headers) =>
        Object.keys(headers ?? {}).every(
          (name) =>
            ![
              "content-type",
              "webhook-id",
              "webhook-timestamp",
              "webhook-signature",
            ].includes(name.toLowerCase()),
        ),
      { expected: "headers that do not override webhook protocol headers" },
    ),
  ),
}).annotate({ identifier: "WebhookPayload" });
export const webhookPayloadSchema = (allowLoopback: boolean) =>
  Schema.Struct({
    ...WebhookPayload.fields,
    url: Schema.String.check(
      Schema.makeFilter(
        (value) => isAllowedWebhookUrlString(value, allowLoopback),
        {
          expected:
            "a public HTTP(S) URL, or an explicitly enabled development loopback URL",
        },
      ),
    ),
  }).annotate({ identifier: "ConfiguredWebhookPayload" });
export const Webhook = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  organizationId: Schema.String,
  url: Schema.String,
  description: Schema.NullOr(Schema.String),
  headers: Schema.NullOr(Schema.Record(Schema.String, Schema.String)),
  events: Schema.NullOr(Schema.Array(Schema.String)),
  secret: Schema.String,
  enabled: Schema.Boolean,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "Webhook" });
export const WebhookDelivery = Schema.Struct({
  id: Schema.String,
  webhookId: Schema.String,
  event: Schema.String,
  data: Schema.Json,
  status: Schema.Literals(["pending", "success", "failed"]),
  error: Schema.NullOr(Schema.String),
  completedAt: Schema.NullOr(Schema.Date),
  retryAt: Schema.Date,
  retries: Schema.Int,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "WebhookDelivery" });
export const WebhookDeliverySortId = Schema.Literals([
  "id",
  "event",
  "status",
  "createdAt",
  "completedAt",
]).annotate({ identifier: "WebhookDeliverySortId" });
const DeliveryFilter = ColumnFilter.check(
  Schema.makeFilter((filter) =>
    filter.id === "id"
      ? filter.kind === "text"
      : filter.id === "event"
        ? filter.kind === "values"
        : filter.id === "status"
          ? filter.kind === "values" &&
            filter.values.every((value) =>
              ["pending", "success", "failed"].includes(value),
            )
          : ["createdAt", "completedAt"].includes(filter.id) &&
            filter.kind === "date",
  ),
).annotate({ identifier: "WebhookDeliveryFilter" });
export const WebhookDeliveriesQuery = Schema.Struct({
  ...Query.fields,
  filters: Schema.optional(
    ColumnFilters.check(
      Schema.makeFilter((filters) => filters.every(Schema.is(DeliveryFilter))),
    ),
  ),
  sort: Schema.optional(
    SortParams.check(
      Schema.makeFilter((sort) =>
        sort.every((part) => Schema.is(WebhookDeliverySortId)(part.id)),
      ),
    ),
  ),
}).annotate({ identifier: "WebhookDeliveriesQuery" });
export const ListWebhookDeliveries = Schema.Struct({
  ...WebhookRequest.fields,
  ...WebhookDeliveriesQuery.fields,
}).annotate({ identifier: "ListWebhookDeliveries" });
export const WebhookDeliveries = PaginatedResponse(WebhookDelivery).annotate({
  identifier: "WebhookDeliveries",
});
export const PublishWebhook = Schema.Struct({
  organizationId: Schema.NonEmptyString,
  eventId: Schema.NonEmptyString,
  event: Schema.NonEmptyString,
  data: Schema.Json,
}).annotate({ identifier: "PublishWebhook" });
export class WebhookError extends Schema.TaggedError<WebhookError>()(
  "WebhookError",
  {
    message: Schema.String,
  },
) {}
export type Webhook = typeof Webhook.Type;
export type WebhookDelivery = typeof WebhookDelivery.Type;
export type WebhookPayload = typeof WebhookPayload.Type;
