import { Effect } from "effect";
import { SqlClient } from "effect/sql";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  yield* sql`CREATE TABLE public.assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id text NOT NULL, object_key text NOT NULL,
    name text NOT NULL, mime_type text NOT NULL, byte_size integer NOT NULL,
    checksum text NOT NULL, metadata jsonb DEFAULT '{}' NOT NULL,
    created_by text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT assets_pkey PRIMARY KEY (id)
  )`;
  yield* sql`CREATE TABLE public.asset_processings (
    id uuid DEFAULT gen_random_uuid() NOT NULL, asset_id uuid NOT NULL,
    checksum text NOT NULL, filename text NOT NULL, mime_type text NOT NULL,
    processor_version integer NOT NULL, status text DEFAULT 'pending' NOT NULL,
    content text, content_byte_size integer, truncated boolean, failure text,
    started_at timestamptz, completed_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT asset_processings_pkey PRIMARY KEY (id),
    CONSTRAINT asset_processings_status_check CHECK (status IN ('pending','running','completed','failed')),
    CONSTRAINT asset_processings_asset_id_assets_id_fkey
      FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE
  )`;
  yield* sql`CREATE UNIQUE INDEX assets_object_key_idx ON public.assets (object_key)`;
  yield* sql`CREATE INDEX assets_organization_id_idx ON public.assets (organization_id)`;
  yield* sql`CREATE INDEX asset_processings_asset_id_idx ON public.asset_processings (asset_id)`;
  yield* sql`CREATE UNIQUE INDEX asset_processings_reuse_idx ON public.asset_processings
    (asset_id, checksum, filename, mime_type, processor_version)`;
});
