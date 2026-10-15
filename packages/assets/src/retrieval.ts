import { Effect, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import {
  AssetChunkSchema,
  AssetNotFound,
  AssetOverviewSchema,
  AssetOutlineEntrySchema,
  AssetScopedReadChunksRequestSchema,
  AssetRequestSchema,
  AssetRowSchema,
  AssetSearchHitSchema,
  AssetScopedSearchRequestSchema,
  AssetOverviewRequestSchema,
  AssetTextChunkInvalid,
  AssetTextVersionChanged,
} from "./schema.js";
import { PROCESSABLE_MIME_TYPES } from "./processing.js";

// Internal service implementation, not a separate service or auth boundary.
export const makeRetrieval = <E, R>({
  processorVersion,
  startProcessing,
}: {
  processorVersion: number;
  startProcessing: (
    asset: typeof AssetRowSchema.Type,
  ) => Effect.Effect<void, E, R>;
}) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const readCurrent = (lock: boolean) =>
      SqlSchema.findOneOption({
        Request: AssetRequestSchema,
        Result: AssetOverviewSchema,
        execute: ({ organizationId, assetId }) => sql`
      SELECT a.id, a.name, a.mime_type, p.id AS processing_id,
        CASE WHEN p.status = 'completed' AND p.truncated IS DISTINCT FROM false THEN 'failed'
          ELSE COALESCE(p.status, 'pending') END AS status,
        COALESCE(p.content_byte_size, 0) AS total_bytes,
        (SELECT count(*)::integer FROM asset_chunks c WHERE c.processing_id = p.id) AS total_chunks,
        CASE WHEN p.status = 'completed' AND p.truncated IS DISTINCT FROM false
          THEN 'Incomplete extraction requires reprocessing' ELSE p.failure END AS failure
      FROM assets a LEFT JOIN asset_processings p ON p.asset_id = a.id
        AND p.checksum = a.checksum AND p.filename = a.name AND p.mime_type = a.mime_type
        AND p.processor_version = ${processorVersion}
      WHERE a.id = ${assetId} AND a.organization_id = ${organizationId}
      ${lock ? sql`FOR SHARE OF a` : sql``}
    `,
      });
    const current = readCurrent(true);
    const inspectCurrent = readCurrent(false);
    const overview = Effect.fn("Assets.getOverview")(
      (input: typeof AssetOverviewRequestSchema.Type) =>
        Effect.gen(function* () {
          const request = yield* Schema.decodeUnknownEffect(
            AssetOverviewRequestSchema,
          )(input);
          const { outlineOffset = 0 } = request;
          let found = yield* inspectCurrent(request);
          if (Option.isNone(found))
            return yield* new AssetNotFound({ assetId: request.assetId });
          if (!PROCESSABLE_MIME_TYPES.has(found.value.mimeType))
            return {
              ...found.value,
              status: "unsupported" as const,
              outline: [],
              nextOutlineOffset: null,
            };
          if (!found.value.processingId || found.value.status === "pending") {
            const asset = yield* SqlSchema.findOne({
              Request: AssetRequestSchema,
              Result: AssetRowSchema,
              execute: ({ assetId, organizationId }) =>
                sql`SELECT * FROM assets WHERE id = ${assetId} AND organization_id = ${organizationId}`,
            })(request);
            yield* startProcessing(asset);
            found = yield* inspectCurrent(request);
          }
          if (Option.isNone(found))
            return yield* new AssetNotFound({ assetId: request.assetId });
          const row = found.value;
          const outline =
            row.status !== "completed"
              ? []
              : yield* SqlSchema.findAll({
                  Request: Schema.Void,
                  Result: AssetOutlineEntrySchema,
                  execute: () => sql`
          WITH sections AS (
            SELECT heading_path, ordinal,
              ordinal - row_number() OVER (PARTITION BY heading_path ORDER BY ordinal)::integer AS section_group
            FROM asset_chunks WHERE processing_id = ${row.processingId}
          )
          SELECT heading_path, min(ordinal)::integer AS first_ordinal, max(ordinal)::integer AS last_ordinal
          FROM sections GROUP BY heading_path, section_group ORDER BY min(ordinal)
          LIMIT 51 OFFSET ${outlineOffset}
        `,
                })();
          return {
            ...row,
            outline: outline.slice(0, 50),
            nextOutlineOffset: outline.length > 50 ? outlineOffset + 50 : null,
          };
        }),
    );
    const requireCurrent = Effect.fn("Assets.requireCurrentIndex")(function* (
      input: typeof AssetRequestSchema.Type & { processingId: string },
    ) {
      const found = yield* current(input);
      if (Option.isNone(found))
        return yield* new AssetNotFound({ assetId: input.assetId });
      if (found.value.processingId !== input.processingId)
        return yield* new AssetTextVersionChanged({ assetId: input.assetId });
      if (found.value.status !== "completed" || found.value.totalChunks === 0)
        return yield* new AssetTextChunkInvalid({
          message: "Asset index is not ready; inspect its overview",
        });
      return found.value;
    });
    const searchChunks = Effect.fn("Assets.searchChunks")(
      (input: typeof AssetScopedSearchRequestSchema.Type) =>
        sql.withTransaction(
          Effect.gen(function* () {
            const request = yield* Schema.decodeUnknownEffect(
              AssetScopedSearchRequestSchema,
            )(input);
            yield* requireCurrent(request);
            const offset = request.offset ?? 0;
            const vector =
              request.language === "fr" ? sql`c.search_fr` : sql`c.search_en`;
            const config =
              request.language === "fr"
                ? sql`'french'::regconfig`
                : sql`'english'::regconfig`;
            const hits = yield* SqlSchema.findAll({
              Request: Schema.Void,
              Result: AssetSearchHitSchema,
              execute: () => sql`
        WITH raw_matches AS (
          SELECT c.*, ts_rank_cd(${vector}, q.query)::float8 AS score
          FROM asset_chunks c, websearch_to_tsquery(${config}, ${request.query}) AS q(query)
          WHERE c.processing_id = ${request.processingId} AND ${vector} @@ q.query
            ${request.headingPath === undefined ? sql`` : sql`AND c.heading_path = ${request.headingPath}`}
        ), matches AS (
          SELECT DISTINCT ON (heading_path, md5(content)) * FROM raw_matches
          ORDER BY heading_path, md5(content), score DESC, ordinal
        ), diverse AS (
          SELECT *, row_number() OVER (PARTITION BY heading_path ORDER BY score DESC, ordinal) AS section_rank
          FROM matches
        )
        SELECT id, processing_id, ordinal, heading_path, byte_start, byte_end, first_page, last_page, score,
          substring(ts_headline(${config}, content, websearch_to_tsquery(${config}, ${request.query}),
            'StartSel=, StopSel=, MaxWords=60, MinWords=15, MaxFragments=2') FROM 1 FOR 1600) AS snippet
        FROM diverse ORDER BY section_rank, score DESC, ordinal LIMIT 9 OFFSET ${offset}
      `,
            })();
            return {
              assetId: request.assetId,
              processingId: request.processingId,
              hits: hits.slice(0, 8),
              nextOffset: hits.length > 8 ? offset + 8 : null,
            };
          }),
        ),
    );
    const readChunks = Effect.fn("Assets.readChunks")(
      (input: typeof AssetScopedReadChunksRequestSchema.Type) =>
        sql.withTransaction(
          Effect.gen(function* () {
            const request = yield* Schema.decodeUnknownEffect(
              AssetScopedReadChunksRequestSchema,
            )(input);
            const overview = yield* requireCurrent(request);
            if (
              request.ordinals.some(
                (ordinal) => ordinal >= overview.totalChunks,
              )
            )
              return yield* new AssetTextChunkInvalid({
                message: "Chunk ordinal is beyond the document",
              });
            const ordinals = [
              ...new Set(
                request.ordinals.flatMap((ordinal) =>
                  request.includeNeighbors
                    ? [ordinal - 1, ordinal, ordinal + 1]
                    : [ordinal],
                ),
              ),
            ].filter(
              (ordinal) => ordinal >= 0 && ordinal < overview.totalChunks,
            );
            const chunks = yield* SqlSchema.findAll({
              Request: Schema.Void,
              Result: AssetChunkSchema,
              execute:
                () => sql`SELECT id, processing_id, ordinal, content, heading_path, byte_start, byte_end, first_page, last_page
        FROM asset_chunks WHERE processing_id = ${request.processingId} AND ${sql.in("ordinal", ordinals)} ORDER BY ordinal`,
            })();
            if (
              chunks.reduce(
                (size, chunk) =>
                  size + new TextEncoder().encode(chunk.content).byteLength,
                0,
              ) >
              128 * 1024
            )
              return yield* new AssetTextChunkInvalid({
                message:
                  "Passage response exceeds the budget; request fewer chunks or omit neighbors",
              });
            return {
              assetId: request.assetId,
              processingId: request.processingId,
              chunks,
            };
          }),
        ),
    );
    return { getOverview: overview, searchChunks, readChunks };
  });
