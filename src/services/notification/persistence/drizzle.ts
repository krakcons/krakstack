import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { Json } from "effect/Schema";

import {
  NOTIFICATION_DELIVERY_PURPOSES,
  NOTIFICATION_DELIVERY_STATUSES,
} from "./schema";

const timestampWithTimezone = (name: string) =>
  timestamp(name, { withTimezone: true });

const nonEmpty = (column: { getSQL(): unknown }) =>
  sql`length(btrim(${column})) > 0`;

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    recipientUserId: text("recipient_user_id").notNull(),
    organizationId: text("organization_id"),
    workspaceId: text("workspace_id"),
    eventKey: text("event_key").notNull(),
    eventVersion: integer("event_version").default(1).notNull(),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    href: text("href"),
    metadata: jsonb("metadata").$type<Json>().default({}).notNull(),
    createdAt: timestampWithTimezone("created_at").defaultNow().notNull(),
    readAt: timestampWithTimezone("read_at"),
    archivedAt: timestampWithTimezone("archived_at"),
  },
  (table) => [
    uniqueIndex("notifications_idempotency_key_uidx").on(table.idempotencyKey),
    index("notifications_recipient_inbox_created_idx").on(
      table.recipientUserId,
      table.organizationId,
      table.workspaceId,
      table.archivedAt,
      table.createdAt,
    ),
    index("notifications_recipient_unread_idx").on(
      table.recipientUserId,
      table.organizationId,
      table.workspaceId,
      table.readAt,
    ),
    check(
      "notifications_non_empty_fields_check",
      sql`${nonEmpty(table.idempotencyKey)} and ${nonEmpty(table.recipientUserId)} and ${nonEmpty(table.eventKey)} and ${nonEmpty(table.locale)} and ${nonEmpty(table.title)} and (${table.organizationId} is null or ${nonEmpty(table.organizationId)}) and (${table.workspaceId} is null or ${nonEmpty(table.workspaceId)})`,
    ),
    check("notifications_event_version_check", sql`${table.eventVersion} > 0`),
  ],
);

export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientUserId: text("recipient_user_id").notNull(),
    organizationId: text("organization_id"),
    workspaceId: text("workspace_id"),
    eventKey: text("event_key"),
    channel: text("channel").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestampWithTimezone("created_at").defaultNow().notNull(),
    updatedAt: timestampWithTimezone("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_settings_scope_channel_uidx").on(
      table.recipientUserId,
      sql`coalesce(${table.organizationId}, '')`,
      sql`coalesce(${table.workspaceId}, '')`,
      sql`coalesce(${table.eventKey}, '')`,
      table.channel,
    ),
    index("notification_settings_recipient_channel_idx").on(
      table.recipientUserId,
      table.channel,
    ),
    check(
      "notification_settings_non_empty_fields_check",
      sql`${nonEmpty(table.recipientUserId)} and ${nonEmpty(table.channel)} and (${table.organizationId} is null or ${nonEmpty(table.organizationId)}) and (${table.workspaceId} is null or ${nonEmpty(table.workspaceId)}) and (${table.eventKey} is null or ${nonEmpty(table.eventKey)})`,
    ),
  ],
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    notificationId: uuid("notification_id").references(() => notifications.id, {
      onDelete: "set null",
    }),
    idempotencyKey: text("idempotency_key").notNull(),
    recipientUserId: text("recipient_user_id"),
    organizationId: text("organization_id"),
    workspaceId: text("workspace_id"),
    eventKey: text("event_key").notNull(),
    eventVersion: integer("event_version").default(1).notNull(),
    channel: text("channel").notNull(),
    purpose: text("purpose").notNull(),
    template: text("template"),
    recipientAddress: text("recipient_address").notNull(),
    recipientName: text("recipient_name"),
    payloadVersion: integer("payload_version").default(1).notNull(),
    payload: jsonb("payload").$type<Json>().notNull(),
    status: text("status").default("queued").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    provider: text("provider"),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    scheduledFor: timestampWithTimezone("scheduled_for").defaultNow().notNull(),
    processingAt: timestampWithTimezone("processing_at"),
    lastAttemptAt: timestampWithTimezone("last_attempt_at"),
    leaseExpiresAt: timestampWithTimezone("lease_expires_at"),
    claimedBy: text("claimed_by"),
    sentAt: timestampWithTimezone("sent_at"),
    failedAt: timestampWithTimezone("failed_at"),
    suppressedAt: timestampWithTimezone("suppressed_at"),
    cancelledAt: timestampWithTimezone("cancelled_at"),
    createdAt: timestampWithTimezone("created_at").defaultNow().notNull(),
    updatedAt: timestampWithTimezone("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_deliveries_idempotency_key_uidx").on(
      table.idempotencyKey,
    ),
    index("notification_deliveries_claim_idx").on(
      table.channel,
      table.status,
      table.scheduledFor,
    ),
    index("notification_deliveries_notification_id_idx").on(
      table.notificationId,
    ),
    index("notification_deliveries_recipient_address_idx").on(
      table.recipientAddress,
    ),
    index("notification_deliveries_scope_created_idx").on(
      table.organizationId,
      table.workspaceId,
      table.createdAt,
    ),
    index("notification_deliveries_template_idx").on(table.template),
    check(
      "notification_deliveries_non_empty_fields_check",
      sql`${nonEmpty(table.idempotencyKey)} and ${nonEmpty(table.eventKey)} and ${nonEmpty(table.channel)} and ${nonEmpty(table.recipientAddress)} and (${table.recipientUserId} is null or ${nonEmpty(table.recipientUserId)}) and (${table.organizationId} is null or ${nonEmpty(table.organizationId)}) and (${table.workspaceId} is null or ${nonEmpty(table.workspaceId)}) and (${table.template} is null or ${nonEmpty(table.template)}) and (${table.recipientName} is null or ${nonEmpty(table.recipientName)}) and (${table.provider} is null or ${nonEmpty(table.provider)}) and (${table.providerMessageId} is null or ${nonEmpty(table.providerMessageId)}) and (${table.claimedBy} is null or ${nonEmpty(table.claimedBy)})`,
    ),
    check(
      "notification_deliveries_purpose_check",
      sql`${table.purpose} in (${sql.join(
        NOTIFICATION_DELIVERY_PURPOSES.map((value) => sql`${value}`),
        sql`, `,
      )})`,
    ),
    check(
      "notification_deliveries_status_check",
      sql`${table.status} in (${sql.join(
        NOTIFICATION_DELIVERY_STATUSES.map((value) => sql`${value}`),
        sql`, `,
      )})`,
    ),
    check(
      "notification_deliveries_versions_check",
      sql`${table.eventVersion} > 0 and ${table.payloadVersion} > 0`,
    ),
    check(
      "notification_deliveries_attempts_check",
      sql`${table.attempts} >= 0 and ${table.maxAttempts} > 0 and ${table.attempts} <= ${table.maxAttempts}`,
    ),
    check(
      "notification_deliveries_lease_check",
      sql`(${table.claimedBy} is null and ${table.leaseExpiresAt} is null) or (${table.claimedBy} is not null and ${table.leaseExpiresAt} is not null)`,
    ),
  ],
);

export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
export type NotificationSettingRow = typeof notificationSettings.$inferSelect;
export type NewNotificationSettingRow =
  typeof notificationSettings.$inferInsert;
export type NotificationDeliveryRow =
  typeof notificationDeliveries.$inferSelect;
export type NewNotificationDeliveryRow =
  typeof notificationDeliveries.$inferInsert;
