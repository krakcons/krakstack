import { PgMigrator } from "@effect/sql-pg";
import { Effect } from "effect";
import { SqlClient } from "effect/sql";

import initialMigration from "./migrations/0001_assets.js";
import chunksMigration from "./migrations/0002_chunks.js";

export const assetMigrations = PgMigrator.fromRecord({
  "1_assets": initialMigration,
  "2_chunks": chunksMigration,
});

// No schema dump is requested, so layer startup needs only the SQL client.
const runMigrations = PgMigrator.make({});

export const migrateAssets = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  return yield* sql.withTransaction(
    Effect.gen(function* () {
      yield* sql`SELECT pg_advisory_xact_lock(478341933)`;
      yield* sql`SET LOCAL search_path TO public`;
      // Create explicitly: a missing-ledger probe can abort an outer transaction.
      yield* sql`CREATE TABLE IF NOT EXISTS public.asset_migrations (
      migration_id integer PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      name text NOT NULL
    )`;
      return yield* runMigrations({
        table: "asset_migrations",
        loader: assetMigrations,
      });
    }),
  );
});
