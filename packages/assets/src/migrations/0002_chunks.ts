import { Effect } from "effect";
import { SqlClient } from "effect/sql";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  yield* sql`CREATE TABLE public.asset_chunks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    processing_id uuid NOT NULL REFERENCES public.asset_processings(id) ON DELETE CASCADE,
    ordinal integer NOT NULL CHECK (ordinal >= 0),
    content text NOT NULL,
    heading_path text NOT NULL,
    byte_start integer NOT NULL, byte_end integer NOT NULL,
    first_page integer, last_page integer,
    search_en tsvector GENERATED ALWAYS AS (
      to_tsvector('english', heading_path || ' ' || content)
    ) STORED,
    search_fr tsvector GENERATED ALWAYS AS (
      to_tsvector('french', heading_path || ' ' || content)
    ) STORED,
    UNIQUE (processing_id, ordinal)
  )`;
  yield* sql`CREATE INDEX asset_chunks_search_en_idx ON public.asset_chunks USING gin (search_en)`;
  yield* sql`CREATE INDEX asset_chunks_search_fr_idx ON public.asset_chunks USING gin (search_fr)`;
});
