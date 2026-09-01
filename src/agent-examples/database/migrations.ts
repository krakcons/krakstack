import { PgMigrator } from "@effect/sql-pg";
import { Effect } from "effect";
import { Migrator, SqlClient } from "effect/unstable/sql";

const initial = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS examples (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL,
      name text NOT NULL,
      description text,
      active boolean DEFAULT true NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
});

export const migrations = Migrator.fromRecord({
  "1_initial": initial,
});

export const migrate = PgMigrator.run({
  loader: migrations,
});
