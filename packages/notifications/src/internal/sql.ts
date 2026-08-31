import { Effect, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";

import {
  NotificationDataError,
  NotificationStorageError,
  NotificationValidationError,
  type NotificationScope,
} from "../schema.js";

export const inboxColumns = (sql: SqlClient.SqlClient) =>
  sql.literal(`
    id,
    idempotency_key AS "idempotencyKey",
    jsonb_build_object(
      'recipientUserId', recipient_user_id,
      'organizationId', organization_id,
      'workspaceId', workspace_id
    ) AS scope,
    event_key AS "eventKey",
    event_version AS "eventVersion",
    locale,
    title,
    description,
    href,
    metadata,
    created_at AS "createdAt",
    read_at AS "readAt",
    archived_at AS "archivedAt"
  `);

export const preferenceColumns = (sql: SqlClient.SqlClient) =>
  sql.literal(`
    id,
    jsonb_build_object(
      'recipientUserId', recipient_user_id,
      'organizationId', organization_id,
      'workspaceId', workspace_id
    ) AS scope,
    event_key AS "eventKey",
    channel,
    enabled,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  `);

export const deliveryColumns = (sql: SqlClient.SqlClient, alias?: "d") => {
  const prefix = alias === undefined ? "" : `${alias}.`;
  return sql.literal(`
    ${prefix}id,
    ${prefix}notification_id AS "notificationId",
    ${prefix}idempotency_key AS "idempotencyKey",
    jsonb_build_object(
      'recipientUserId', ${prefix}recipient_user_id,
      'organizationId', ${prefix}organization_id,
      'workspaceId', ${prefix}workspace_id
    ) AS scope,
    ${prefix}event_key AS "eventKey",
    ${prefix}event_version AS "eventVersion",
    ${prefix}channel,
    ${prefix}purpose,
    ${prefix}template,
    ${prefix}recipient_address AS "recipientAddress",
    ${prefix}recipient_name AS "recipientName",
    ${prefix}payload_version AS "payloadVersion",
    ${prefix}payload,
    ${prefix}status,
    ${prefix}attempts,
    ${prefix}max_attempts AS "maxAttempts",
    ${prefix}provider,
    ${prefix}provider_message_id AS "providerMessageId",
    ${prefix}error_message AS "errorMessage",
    ${prefix}scheduled_for AS "scheduledFor",
    ${prefix}processing_at AS "processingAt",
    ${prefix}last_attempt_at AS "lastAttemptAt",
    ${prefix}lease_expires_at AS "leaseExpiresAt",
    ${prefix}claimed_by AS "claimedBy",
    ${prefix}current_job_id AS "currentJobId",
    ${prefix}job_generation AS "jobGeneration",
    ${prefix}queued_at AS "queuedAt",
    ${prefix}expires_at AS "expiresAt",
    ${prefix}sent_at AS "sentAt",
    ${prefix}failed_at AS "failedAt",
    ${prefix}suppressed_at AS "suppressedAt",
    ${prefix}cancelled_at AS "cancelledAt",
    ${prefix}created_at AS "createdAt",
    ${prefix}updated_at AS "updatedAt"
  `);
};

export const attemptColumns = (sql: SqlClient.SqlClient) =>
  sql.literal(`
    id,
    delivery_id AS "deliveryId",
    job_id AS "jobId",
    generation,
    attempt,
    CASE outcome
      WHEN 'sent' THEN jsonb_build_object(
        '_tag', 'Sent',
        'provider', provider,
        'providerMessageId', provider_message_id
      )
      WHEN 'retryable' THEN jsonb_build_object(
        '_tag', 'RetryableFailure',
        'message', error_message,
        'retryAfter', retry_after
      )
      WHEN 'permanent' THEN jsonb_build_object(
        '_tag', 'PermanentFailure',
        'message', error_message
      )
      WHEN 'unavailable' THEN jsonb_build_object(
        '_tag', 'Unavailable',
        'message', error_message,
        'retryAfter', retry_after
      )
      WHEN 'skipped' THEN jsonb_build_object(
        '_tag', 'Skipped',
        'reason', error_message
      )
      ELSE NULL
    END AS outcome,
    queued_at AS "queuedAt",
    started_at AS "startedAt",
    completed_at AS "completedAt",
    created_at AS "createdAt"
  `);

export const reminderColumns = (sql: SqlClient.SqlClient, alias?: "r") => {
  const prefix = alias === undefined ? "" : `${alias}.`;
  return sql.literal(`
    ${prefix}id,
    ${prefix}idempotency_key AS "idempotencyKey",
    jsonb_build_object(
      'recipientUserId', ${prefix}recipient_user_id,
      'organizationId', ${prefix}organization_id,
      'workspaceId', ${prefix}workspace_id
    ) AS scope,
    ${prefix}handler_key AS "handlerKey",
    ${prefix}handler_version AS "handlerVersion",
    ${prefix}payload,
    ${prefix}status,
    ${prefix}scheduled_for AS "scheduledFor",
    ${prefix}attempts,
    ${prefix}max_attempts AS "maxAttempts",
    ${prefix}current_job_id AS "currentJobId",
    ${prefix}job_generation AS "jobGeneration",
    ${prefix}queued_at AS "queuedAt",
    ${prefix}expires_at AS "expiresAt",
    ${prefix}last_error AS "lastError",
    ${prefix}completed_at AS "completedAt",
    ${prefix}failed_at AS "failedAt",
    ${prefix}cancelled_at AS "cancelledAt",
    ${prefix}created_at AS "createdAt",
    ${prefix}updated_at AS "updatedAt"
  `);
};

export const referenceColumns = (sql: SqlClient.SqlClient) =>
  sql.literal(`
    delivery_id AS "deliveryId",
    namespace,
    value,
    created_at AS "createdAt"
  `);

export const suppressionColumns = (sql: SqlClient.SqlClient) =>
  sql.literal(`
    id,
    jsonb_build_object(
      'recipientUserId', recipient_user_id,
      'organizationId', organization_id,
      'workspaceId', workspace_id
    ) AS scope,
    channel,
    purpose,
    recipient_address AS "recipientAddress",
    reason,
    expires_at AS "expiresAt",
    created_at AS "createdAt"
  `);

export const exactScope = (
  sql: SqlClient.SqlClient,
  alias: "n" | "s" | "d" | "r" | "x",
  scope: NotificationScope,
) => {
  const recipient = sql.literal(`${alias}.recipient_user_id`);
  const organization = sql.literal(`${alias}.organization_id`);
  const workspace = sql.literal(`${alias}.workspace_id`);

  return sql`
    ${recipient} IS NOT DISTINCT FROM ${scope.recipientUserId}
    AND ${organization} IS NOT DISTINCT FROM ${scope.organizationId}
    AND ${workspace} IS NOT DISTINCT FROM ${scope.workspaceId}
  `;
};

export const wildcardScope = (
  sql: SqlClient.SqlClient,
  alias: "x",
  scope: NotificationScope,
) => {
  const recipient = sql.literal(`${alias}.recipient_user_id`);
  const organization = sql.literal(`${alias}.organization_id`);
  const workspace = sql.literal(`${alias}.workspace_id`);

  return sql`
    (${recipient} IS NULL OR ${recipient} IS NOT DISTINCT FROM ${scope.recipientUserId})
    AND (${organization} IS NULL OR ${organization} IS NOT DISTINCT FROM ${scope.organizationId})
    AND (${workspace} IS NULL OR ${workspace} IS NOT DISTINCT FROM ${scope.workspaceId})
  `;
};

export const decodeInput = <S extends Schema.Constraint>(
  operation: string,
  schema: S,
  input: S["Type"],
) =>
  Schema.decodeUnknownEffect(schema)(input).pipe(
    Effect.mapError(
      (cause) =>
        new NotificationValidationError({
          operation,
          message: `Invalid input for ${operation}`,
          cause,
        }),
    ),
  );

export const decodeRows = <S extends Schema.Constraint>(
  entity: string,
  schema: S,
  rows: ReadonlyArray<unknown>,
) =>
  Schema.decodeUnknownEffect(Schema.Array(schema))(rows).pipe(
    Effect.mapError(
      (cause) =>
        new NotificationDataError({
          entity,
          message: `Could not decode persisted ${entity}`,
          cause,
        }),
    ),
  );

export const storageError = (operation: string, cause: unknown) =>
  new NotificationStorageError({
    operation,
    message: `Notification storage operation failed: ${operation}`,
    cause,
  });
