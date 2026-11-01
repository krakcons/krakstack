import { Effect, Layer } from "effect";
import { Migrator, SqlClient } from "effect/sql";

// Existing Kokobi tables are adopted in place; secrets, IDs and pending work survive.
export const webhookMigrations = Migrator.fromRecord({
  "1_webhooks_initial": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`CREATE TABLE IF NOT EXISTS webhooks (
      id text PRIMARY KEY, organization_id text NOT NULL, url text NOT NULL,
      description text, headers jsonb, events jsonb, secret text NOT NULL,
      enabled boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
    )`;
    yield* sql`CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id text PRIMARY KEY, webhook_id text NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
      event text NOT NULL, data jsonb NOT NULL DEFAULT '{}', status text NOT NULL DEFAULT 'pending',
      completed_at timestamp, retry_at timestamp NOT NULL DEFAULT now(), retries integer NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
    )`;
    yield* sql`ALTER TABLE webhook_deliveries ADD COLUMN IF NOT EXISTS event_id text`;
    yield* sql`CREATE UNIQUE INDEX IF NOT EXISTS krakstack_webhook_event_endpoint ON webhook_deliveries (webhook_id, event_id) WHERE event_id IS NOT NULL`;
    yield* sql`CREATE INDEX IF NOT EXISTS krakstack_webhook_pending ON webhook_deliveries (retry_at) WHERE status = 'pending'`;
    yield* sql`CREATE INDEX IF NOT EXISTS krakstack_webhook_organization ON webhooks (organization_id)`;
    yield* sql`CREATE TABLE IF NOT EXISTS webhook_publications (
      organization_id text NOT NULL, event_id text NOT NULL, event text NOT NULL, data jsonb NOT NULL,
      PRIMARY KEY (organization_id, event_id)
    )`;
  }),
  "2_webhook_names": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`ALTER TABLE webhooks ADD COLUMN name text`;
    yield* sql`UPDATE webhooks SET name = url WHERE name IS NULL`;
    yield* sql`ALTER TABLE webhook_deliveries ADD COLUMN error text`;
  }),
});
export const migrateWebhooks = Migrator.make({})({
  loader: webhookMigrations,
  table: "krakstack_webhook_migrations",
});
export const webhookMigrationsLayer = Layer.effectDiscard(migrateWebhooks);

// Receiver-only applications do not need endpoint, publication, or delivery tables.
export const webhookReceiverMigrations = Migrator.fromRecord({
  "1_webhook_receipts": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`CREATE TABLE webhook_receipts (
      receiver text NOT NULL, event_id text NOT NULL, body_hash text NOT NULL,
      completed_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (receiver, event_id)
    )`;
    yield* sql`CREATE INDEX webhook_receipts_completed ON webhook_receipts (completed_at)`;
  }),
});
export const migrateWebhookReceiver = Migrator.make({})({
  loader: webhookReceiverMigrations,
  table: "krakstack_webhook_receiver_migrations",
});
export const webhookReceiverMigrationsLayer = Layer.effectDiscard(
  migrateWebhookReceiver,
);
