import { Effect } from "effect";
import { SqlClient } from "effect/sql";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  // No FK: the receipt must survive deletion of the published asset.
  yield* sql`CREATE TABLE public.asset_upload_publications (
    organization_id text NOT NULL,
    upload_token uuid NOT NULL,
    execution_id text NOT NULL,
    asset_id uuid NOT NULL,
    PRIMARY KEY (organization_id, upload_token)
  )`;
});
