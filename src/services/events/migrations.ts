import { Effect } from "effect";
import { Migrator, SqlClient } from "effect/sql";

export const eventsMigrations = Migrator.fromRecord({
  "1_events_initial": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const payloadType = sql.onDialectOrElse({
      pg: () => sql.literal("jsonb"),
      orElse: () => sql.literal("text"),
    });
    yield* sql`CREATE TABLE events (
      service_name text NOT NULL,
      source text NOT NULL CHECK (source IN ('browser', 'server')),
      event_id text NOT NULL,
      event_name text NOT NULL,
      event_type text NOT NULL,
      occurred_at double precision NOT NULL,
      received_at double precision NOT NULL,
      organization_id text,
      user_id text,
      session_id text,
      anonymous_id text,
      payload_json ${payloadType} NOT NULL,
      PRIMARY KEY (service_name, source, event_id)
    )`;
    yield* sql`CREATE INDEX events_organization_time ON events (service_name, organization_id, occurred_at)`;
    yield* sql`CREATE INDEX events_visitor_time ON events (service_name, anonymous_id, received_at DESC, event_id DESC)`;
    yield* sql`CREATE INDEX events_session_time ON events (service_name, session_id, occurred_at, event_id)`;
    yield* sql.onDialectOrElse({
      pg: () =>
        sql`CREATE INDEX events_payload ON events USING gin (payload_json jsonb_path_ops)`,
      orElse: () => Effect.void,
    });
  }),
});

export const migrateEvents = Migrator.make({})({
  loader: eventsMigrations,
  table: "events_migrations",
});
