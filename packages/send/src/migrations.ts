import { PgMigrator } from "@effect/sql-pg";
import { Effect } from "effect";
import { Migrator, SqlClient } from "effect/sql";

export const sendMigrations = Migrator.fromRecord({
  "0001_contacts_email_consent": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      CREATE TABLE kraksend_contacts (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        locale TEXT NOT NULL CHECK (locale IN ('en', 'fr')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    yield* sql`
      CREATE TABLE kraksend_email_endpoints (
        id UUID PRIMARY KEY,
        contact_id UUID NOT NULL UNIQUE REFERENCES kraksend_contacts(id),
        address TEXT NOT NULL UNIQUE CHECK (address = lower(btrim(address))),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    yield* sql`
      CREATE TABLE kraksend_email_consent_events (
        request_id TEXT PRIMARY KEY,
        contact_id UUID NOT NULL REFERENCES kraksend_contacts(id),
        status TEXT NOT NULL CHECK (status IN ('subscribed', 'unsubscribed')),
        source TEXT NOT NULL,
        actor TEXT NOT NULL,
        notice_version TEXT NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    yield* sql`CREATE INDEX kraksend_email_consent_events_contact_idx ON kraksend_email_consent_events(contact_id, occurred_at DESC, request_id DESC)`;
    yield* sql`
      CREATE TABLE kraksend_email_consents (
        contact_id UUID PRIMARY KEY REFERENCES kraksend_contacts(id),
        status TEXT NOT NULL CHECK (status IN ('subscribed', 'unsubscribed')),
        event_id TEXT NOT NULL REFERENCES kraksend_email_consent_events(request_id)
      )
    `;
    yield* sql`
      CREATE TABLE kraksend_email_requests (
        request_id TEXT PRIMARY KEY,
        contact_id UUID NOT NULL REFERENCES kraksend_contacts(id),
        request JSONB NOT NULL,
        delivery_id UUID UNIQUE REFERENCES notification_deliveries(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  }),
  "0002_provider_feedback": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      CREATE TABLE kraksend_feedback_events (
        provider TEXT NOT NULL,
        event_id TEXT NOT NULL,
        provider_message_id TEXT NOT NULL,
        recipient_address TEXT NOT NULL CHECK (recipient_address = lower(btrim(recipient_address))),
        kind TEXT NOT NULL CHECK (kind IN ('delivered', 'hard_bounce', 'soft_bounce', 'complaint')),
        occurred_at TIMESTAMPTZ NOT NULL,
        received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        checked_at TIMESTAMPTZ,
        delivery_id UUID REFERENCES notification_deliveries(id),
        applied_at TIMESTAMPTZ,
        PRIMARY KEY (provider, event_id, recipient_address),
        CHECK ((delivery_id IS NULL) = (applied_at IS NULL))
      )
    `;
    yield* sql`CREATE INDEX kraksend_feedback_pending_idx ON kraksend_feedback_events(checked_at NULLS FIRST, received_at) WHERE applied_at IS NULL`;
  }),
  "0003_campaigns": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`CREATE TABLE kraksend_campaigns (
      id UUID PRIMARY KEY, request_id TEXT NOT NULL UNIQUE, actor TEXT NOT NULL,
      request JSONB NOT NULL, name TEXT NOT NULL, from_address TEXT NOT NULL,
      audience JSONB NOT NULL, content JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','running','paused','cancelled','completed')),
      scheduled_for TIMESTAMPTZ, snapshot_at TIMESTAMPTZ,
      batch_number INTEGER NOT NULL DEFAULT 0 CHECK (batch_number >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    yield* sql`CREATE TABLE kraksend_campaign_recipients (
      campaign_id UUID NOT NULL REFERENCES kraksend_campaigns(id),
      contact_id UUID NOT NULL REFERENCES kraksend_contacts(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','queued','skipped')),
      reason TEXT, delivery_id UUID UNIQUE REFERENCES notification_deliveries(id),
      PRIMARY KEY (campaign_id, contact_id)
    )`;
    yield* sql`CREATE INDEX kraksend_campaign_due_idx ON kraksend_campaigns(scheduled_for, id) WHERE status IN ('scheduled','running')`;
    yield* sql`CREATE INDEX kraksend_campaign_pending_idx ON kraksend_campaign_recipients(campaign_id, contact_id) WHERE status = 'pending'`;
  }),
});

export const runSendMigrations = PgMigrator.run({
  loader: sendMigrations,
  table: "kraksend_migrations",
});
