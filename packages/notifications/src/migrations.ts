import { Effect, Layer } from "effect";
import { Migrator, SqlClient } from "effect/unstable/sql";

export const NOTIFICATION_MIGRATION_TABLE = "krakstack_notification_migrations";

export const notificationMigrations = Migrator.fromRecord({
  "0001_create_notification_tables": Effect.gen(function* () {
    const sql = (yield* SqlClient.SqlClient).withoutTransforms();

    yield* sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY,
        idempotency_key TEXT NOT NULL,
        recipient_user_id TEXT NOT NULL,
        organization_id TEXT NULL,
        workspace_id TEXT NULL,
        event_key TEXT NOT NULL,
        event_version INTEGER NOT NULL DEFAULT 1,
        locale TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NULL,
        href TEXT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        read_at TIMESTAMPTZ NULL,
        archived_at TIMESTAMPTZ NULL
      )
    `;

    yield* sql`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id UUID PRIMARY KEY,
        recipient_user_id TEXT NOT NULL,
        organization_id TEXT NULL,
        workspace_id TEXT NULL,
        event_key TEXT NULL,
        channel TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    yield* sql`
      CREATE TABLE IF NOT EXISTS notification_deliveries (
        id UUID PRIMARY KEY,
        notification_id UUID NULL REFERENCES notifications(id) ON DELETE SET NULL,
        idempotency_key TEXT NOT NULL,
        recipient_user_id TEXT NULL,
        organization_id TEXT NULL,
        workspace_id TEXT NULL,
        event_key TEXT NOT NULL,
        event_version INTEGER NOT NULL DEFAULT 1,
        channel TEXT NOT NULL,
        purpose TEXT NOT NULL,
        template TEXT NULL,
        recipient_address TEXT NOT NULL,
        recipient_name TEXT NULL,
        payload_version INTEGER NOT NULL DEFAULT 1,
        payload JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        provider TEXT NULL,
        provider_message_id TEXT NULL,
        error_message TEXT NULL,
        scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
        processing_at TIMESTAMPTZ NULL,
        last_attempt_at TIMESTAMPTZ NULL,
        lease_expires_at TIMESTAMPTZ NULL,
        claimed_by TEXT NULL,
        current_job_id UUID NULL,
        job_generation INTEGER NOT NULL DEFAULT 0,
        queued_at TIMESTAMPTZ NULL,
        expires_at TIMESTAMPTZ NULL,
        sent_at TIMESTAMPTZ NULL,
        failed_at TIMESTAMPTZ NULL,
        suppressed_at TIMESTAMPTZ NULL,
        cancelled_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (purpose IN ('transactional', 'notification')),
        CHECK (status IN ('queued', 'processing', 'sent', 'retrying', 'failed', 'suppressed', 'cancelled')),
        CHECK (attempts >= 0 AND max_attempts > 0 AND attempts <= max_attempts),
        CHECK ((claimed_by IS NULL AND lease_expires_at IS NULL) OR (claimed_by IS NOT NULL AND lease_expires_at IS NOT NULL))
      )
    `;

    yield* sql`
      CREATE TABLE IF NOT EXISTS notification_delivery_attempts (
        id UUID PRIMARY KEY,
        delivery_id UUID NOT NULL REFERENCES notification_deliveries(id) ON DELETE CASCADE,
        job_id UUID NOT NULL,
        generation INTEGER NOT NULL,
        attempt INTEGER NOT NULL,
        outcome TEXT NULL,
        provider TEXT NULL,
        provider_message_id TEXT NULL,
        error_message TEXT NULL,
        retry_after TIMESTAMPTZ NULL,
        queued_at TIMESTAMPTZ NOT NULL,
        started_at TIMESTAMPTZ NULL,
        completed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (generation > 0 AND attempt > 0),
        CHECK (outcome IS NULL OR outcome IN ('sent', 'retryable', 'permanent', 'unavailable', 'skipped'))
      )
    `;

    yield* sql`
      CREATE TABLE IF NOT EXISTS notification_delivery_references (
        delivery_id UUID NOT NULL REFERENCES notification_deliveries(id) ON DELETE CASCADE,
        namespace TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (delivery_id, namespace, value)
      )
    `;

    yield* sql`
      CREATE TABLE IF NOT EXISTS notification_suppressions (
        id UUID PRIMARY KEY,
        recipient_user_id TEXT NULL,
        organization_id TEXT NULL,
        workspace_id TEXT NULL,
        channel TEXT NOT NULL,
        recipient_address TEXT NOT NULL,
        reason TEXT NULL,
        expires_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    yield* sql`
      CREATE TABLE IF NOT EXISTS notification_reminders (
        id UUID PRIMARY KEY,
        idempotency_key TEXT NOT NULL,
        recipient_user_id TEXT NULL,
        organization_id TEXT NULL,
        workspace_id TEXT NULL,
        handler_key TEXT NOT NULL,
        handler_version INTEGER NOT NULL,
        payload JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        scheduled_for TIMESTAMPTZ NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        current_job_id UUID NULL,
        job_generation INTEGER NOT NULL DEFAULT 0,
        queued_at TIMESTAMPTZ NULL,
        expires_at TIMESTAMPTZ NULL,
        last_error TEXT NULL,
        completed_at TIMESTAMPTZ NULL,
        failed_at TIMESTAMPTZ NULL,
        cancelled_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (handler_version > 0),
        CHECK (attempts >= 0 AND max_attempts > 0 AND attempts <= max_attempts),
        CHECK (status IN ('scheduled', 'queued', 'processing', 'retrying', 'completed', 'failed', 'cancelled'))
      )
    `;
  }),

  "0002_adopt_existing_delivery_queue_state": Effect.gen(function* () {
    const sql = (yield* SqlClient.SqlClient).withoutTransforms();

    yield* sql`
      ALTER TABLE notification_deliveries
      ADD COLUMN IF NOT EXISTS current_job_id UUID NULL
    `;
    yield* sql`
      ALTER TABLE notification_deliveries
      ADD COLUMN IF NOT EXISTS job_generation INTEGER NOT NULL DEFAULT 0
    `;
    yield* sql`
      ALTER TABLE notification_deliveries
      ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ NULL
    `;
    yield* sql`
      ALTER TABLE notification_deliveries
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL
    `;
  }),

  "0003_add_notification_indexes": Effect.gen(function* () {
    const sql = (yield* SqlClient.SqlClient).withoutTransforms();

    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notifications_idempotency_key_uidx
      ON notifications (idempotency_key)
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notifications_recipient_inbox_created_idx
      ON notifications (recipient_user_id, organization_id, workspace_id, archived_at, created_at DESC, id DESC)
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
      ON notifications (recipient_user_id, organization_id, workspace_id, read_at)
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_settings_scope_channel_uidx
      ON notification_settings (
        recipient_user_id,
        COALESCE(organization_id, ''),
        COALESCE(workspace_id, ''),
        COALESCE(event_key, ''),
        channel
      )
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_settings_recipient_channel_idx
      ON notification_settings (recipient_user_id, channel)
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_deliveries_idempotency_key_uidx
      ON notification_deliveries (idempotency_key)
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_deliveries_due_idx
      ON notification_deliveries (status, scheduled_for, current_job_id)
      WHERE status IN ('queued', 'retrying')
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_deliveries_scope_created_idx
      ON notification_deliveries (recipient_user_id, organization_id, workspace_id, created_at DESC, id DESC)
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_deliveries_notification_id_idx
      ON notification_deliveries (notification_id)
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_delivery_attempts_job_uidx
      ON notification_delivery_attempts (job_id)
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_delivery_attempts_number_uidx
      ON notification_delivery_attempts (delivery_id, attempt)
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_delivery_attempts_delivery_idx
      ON notification_delivery_attempts (delivery_id, attempt)
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_suppressions_scope_endpoint_uidx
      ON notification_suppressions (
        COALESCE(recipient_user_id, ''),
        COALESCE(organization_id, ''),
        COALESCE(workspace_id, ''),
        channel,
        recipient_address
      )
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_suppressions_lookup_idx
      ON notification_suppressions (channel, recipient_address, expires_at)
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_reminders_idempotency_key_uidx
      ON notification_reminders (idempotency_key)
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_reminders_due_idx
      ON notification_reminders (status, scheduled_for, current_job_id)
      WHERE status IN ('scheduled', 'retrying')
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_reminders_scope_created_idx
      ON notification_reminders (recipient_user_id, organization_id, workspace_id, created_at DESC, id DESC)
    `;
  }),

  "0004_adopt_nullable_recipient_scopes": Effect.gen(function* () {
    const sql = (yield* SqlClient.SqlClient).withoutTransforms();

    yield* sql`
      ALTER TABLE notification_deliveries
      ALTER COLUMN recipient_user_id DROP NOT NULL
    `;
    yield* sql`
      ALTER TABLE notification_suppressions
      ALTER COLUMN recipient_user_id DROP NOT NULL
    `;
    yield* sql`
      ALTER TABLE notification_reminders
      ALTER COLUMN recipient_user_id DROP NOT NULL
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_suppressions_scope_endpoint_uidx
      ON notification_suppressions (
        COALESCE(recipient_user_id, ''),
        COALESCE(organization_id, ''),
        COALESCE(workspace_id, ''),
        channel,
        recipient_address
      )
    `;
  }),

  "0005_add_replay_and_suppression_metadata": Effect.gen(function* () {
    const sql = (yield* SqlClient.SqlClient).withoutTransforms();

    yield* sql`
      CREATE TABLE IF NOT EXISTS notification_publications (
        idempotency_key TEXT PRIMARY KEY,
        recipient_user_id TEXT NULL,
        organization_id TEXT NULL,
        workspace_id TEXT NULL,
        event_key TEXT NOT NULL,
        event_version INTEGER NOT NULL,
        request_fingerprint TEXT NOT NULL,
        notification_id UUID NULL REFERENCES notifications(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (event_version > 0),
        CHECK (length(request_fingerprint) = 64)
      )
    `;
    yield* sql`
      ALTER TABLE notification_reminders
      ADD COLUMN IF NOT EXISTS request_fingerprint TEXT NULL
    `;
    yield* sql`
      ALTER TABLE notification_suppressions
      ADD COLUMN IF NOT EXISTS purpose TEXT NULL
    `;
    yield* sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'notification_reminders_fingerprint_v2_check'
            AND conrelid = 'notification_reminders'::regclass
        ) THEN
          ALTER TABLE notification_reminders
          ADD CONSTRAINT notification_reminders_fingerprint_v2_check
          CHECK (request_fingerprint IS NULL OR length(request_fingerprint) = 64);
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'notification_suppressions_purpose_v2_check'
            AND conrelid = 'notification_suppressions'::regclass
        ) THEN
          ALTER TABLE notification_suppressions
          ADD CONSTRAINT notification_suppressions_purpose_v2_check
          CHECK (purpose IS NULL OR purpose IN ('transactional', 'notification'));
        END IF;
      END
      $$
    `;
  }),

  "0006_add_corrected_notification_indexes": Effect.gen(function* () {
    const sql = (yield* SqlClient.SqlClient).withoutTransforms();

    yield* sql`DROP INDEX IF EXISTS notification_delivery_attempts_number_uidx`;
    yield* sql`DROP INDEX IF EXISTS notification_suppressions_scope_endpoint_uidx`;

    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notifications_idempotency_key_v2_uidx
      ON notifications (idempotency_key)
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notifications_inbox_scope_v2_idx
      ON notifications (
        recipient_user_id,
        organization_id,
        workspace_id,
        archived_at,
        created_at DESC,
        id DESC
      )
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notifications_unread_scope_v2_idx
      ON notifications (
        recipient_user_id,
        organization_id,
        workspace_id,
        read_at
      )
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_settings_scope_channel_v2_uidx
      ON notification_settings (
        recipient_user_id,
        COALESCE(organization_id, ''),
        COALESCE(workspace_id, ''),
        COALESCE(event_key, ''),
        channel
      )
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_deliveries_idempotency_key_v2_uidx
      ON notification_deliveries (idempotency_key)
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_deliveries_due_v2_idx
      ON notification_deliveries (scheduled_for, id)
      WHERE status IN ('queued', 'retrying') AND current_job_id IS NULL
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_deliveries_current_job_v2_idx
      ON notification_deliveries (current_job_id, status)
      WHERE current_job_id IS NOT NULL
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_deliveries_scope_v2_idx
      ON notification_deliveries (
        recipient_user_id,
        organization_id,
        workspace_id,
        created_at DESC,
        id DESC
      )
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_delivery_attempts_generation_v2_uidx
      ON notification_delivery_attempts (delivery_id, generation)
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_delivery_attempts_delivery_v2_idx
      ON notification_delivery_attempts (delivery_id, generation)
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_delivery_references_lookup_v2_idx
      ON notification_delivery_references (namespace, value, delivery_id)
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_suppressions_endpoint_purpose_v2_uidx
      ON notification_suppressions (
        COALESCE(recipient_user_id, ''),
        COALESCE(organization_id, ''),
        COALESCE(workspace_id, ''),
        channel,
        COALESCE(purpose, ''),
        recipient_address
      )
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_suppressions_lookup_v2_idx
      ON notification_suppressions (
        channel,
        recipient_address,
        purpose,
        recipient_user_id,
        organization_id,
        workspace_id,
        expires_at
      )
    `;
    yield* sql`
      CREATE UNIQUE INDEX IF NOT EXISTS notification_reminders_idempotency_key_v2_uidx
      ON notification_reminders (idempotency_key)
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_reminders_due_v2_idx
      ON notification_reminders (scheduled_for, id)
      WHERE status IN ('scheduled', 'retrying') AND current_job_id IS NULL
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_reminders_current_job_v2_idx
      ON notification_reminders (current_job_id, status)
      WHERE current_job_id IS NOT NULL
    `;
    yield* sql`
      CREATE INDEX IF NOT EXISTS notification_reminders_scope_v2_idx
      ON notification_reminders (
        recipient_user_id,
        organization_id,
        workspace_id,
        created_at DESC,
        id DESC
      )
    `;
  }),

  "0007_reconcile_legacy_notification_state": Effect.gen(function* () {
    const sql = (yield* SqlClient.SqlClient).withoutTransforms();

    yield* sql`
      UPDATE notification_deliveries
      SET recipient_address = lower(btrim(recipient_address))
      WHERE channel = 'email'
        AND recipient_address IS DISTINCT FROM lower(btrim(recipient_address))
    `;

    yield* sql`
      UPDATE notification_deliveries
      SET
        status = CASE WHEN attempts < max_attempts THEN 'retrying' ELSE 'failed' END,
        current_job_id = NULL,
        queued_at = NULL,
        processing_at = NULL,
        claimed_by = NULL,
        lease_expires_at = NULL,
        scheduled_for = CASE WHEN attempts < max_attempts THEN now() ELSE scheduled_for END,
        error_message = CASE
          WHEN attempts < max_attempts THEN 'legacy_processing_job_missing'
          ELSE 'application_attempt_budget_exhausted'
        END,
        failed_at = CASE WHEN attempts < max_attempts THEN NULL ELSE now() END,
        updated_at = now()
      WHERE status = 'processing'
        AND current_job_id IS NULL
    `;

    yield* sql`
      DO $$
      DECLARE
        recipient_expression TEXT := 'NULL::text';
        organization_expression TEXT := 'NULL::text';
        workspace_expression TEXT := 'NULL::text';
        address_expression TEXT;
        disabled_expression TEXT;
        created_expression TEXT := 'now()';
      BEGIN
        IF to_regclass('email_preferences') IS NULL THEN
          RETURN;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'recipient_user_id'
        ) THEN
          recipient_expression := 'p.recipient_user_id::text';
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'user_id'
        ) THEN
          recipient_expression := 'p.user_id::text';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'organization_id'
        ) THEN
          organization_expression := 'p.organization_id::text';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'workspace_id'
        ) THEN
          workspace_expression := 'p.workspace_id::text';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'recipient_address'
        ) THEN
          address_expression := 'lower(btrim(p.recipient_address::text))';
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'recipient_email'
        ) THEN
          address_expression := 'lower(btrim(p.recipient_email::text))';
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'email_address'
        ) THEN
          address_expression := 'lower(btrim(p.email_address::text))';
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'email'
        ) THEN
          address_expression := 'lower(btrim(p.email::text))';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'enabled'
        ) THEN
          disabled_expression := 'p.enabled = FALSE';
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'notification_email_enabled'
        ) THEN
          disabled_expression := 'p.notification_email_enabled = FALSE';
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'email_enabled'
        ) THEN
          disabled_expression := 'p.email_enabled = FALSE';
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'disabled'
        ) THEN
          disabled_expression := 'p.disabled = TRUE';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'email_preferences'
            AND column_name = 'created_at'
        ) THEN
          created_expression := 'COALESCE(p.created_at, now())';
        END IF;

        IF address_expression IS NULL OR disabled_expression IS NULL THEN
          RAISE EXCEPTION
            'Cannot safely migrate email_preferences: address or enabled/disabled column is unknown';
        END IF;

        EXECUTE format(
          $migration$
            INSERT INTO notification_suppressions (
              id,
              recipient_user_id,
              organization_id,
              workspace_id,
              channel,
              purpose,
              recipient_address,
              reason,
              expires_at,
              created_at
            )
            SELECT
              overlay(
                overlay(
                  md5(concat_ws('|',
                    'legacy-email-preference',
                    COALESCE((%1$s)::text, ''),
                    COALESCE((%2$s)::text, ''),
                    COALESCE((%3$s)::text, ''),
                    (%4$s)::text
                  ))
                  placing '4' from 13
                )
                placing '8' from 17
              )::uuid,
              %1$s,
              %2$s,
              %3$s,
              'email',
              'notification',
              %4$s,
              'legacy_email_preference_disabled',
              NULL,
              %6$s
            FROM email_preferences p
            WHERE %5$s
              AND %4$s IS NOT NULL
              AND length((%4$s)::text) > 0
            ON CONFLICT DO NOTHING
          $migration$,
          recipient_expression,
          organization_expression,
          workspace_expression,
          address_expression,
          disabled_expression,
          created_expression
        );
      END
      $$
    `;

    yield* sql`
      DO $$
      BEGIN
        IF to_regclass('notification_delivery_correlations') IS NULL THEN
          RETURN;
        END IF;

        EXECUTE $migration$
          INSERT INTO notification_delivery_references (
            delivery_id,
            namespace,
            value,
            created_at
          )
          SELECT notification_delivery_id, 'application', application_id::text, now()
          FROM notification_delivery_correlations
          WHERE application_id IS NOT NULL
          UNION ALL
          SELECT notification_delivery_id, 'opportunity', opportunity_id::text, now()
          FROM notification_delivery_correlations
          WHERE opportunity_id IS NOT NULL
          UNION ALL
          SELECT notification_delivery_id, 'organization', organization_id::text, now()
          FROM notification_delivery_correlations
          WHERE organization_id IS NOT NULL
          ON CONFLICT (delivery_id, namespace, value) DO NOTHING
        $migration$;
      END
      $$
    `;
  }),
});

export const runNotificationMigrations = Migrator.make({})({
  loader: notificationMigrations,
  table: NOTIFICATION_MIGRATION_TABLE,
});

export const notificationMigrationsLayer = Layer.effectDiscard(
  runNotificationMigrations,
);
