import { Context, Effect, Layer, Option, Schema, Semaphore } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { extract, ExtractInputKind } from "@xberg-io/xberg";
import { S3Service } from "@krak-stack/registry/service-s3";

import {
  AssetInUse,
  AssetExtractionFailed,
  AssetNotFound,
  AssetUploadInvalid,
  type AssetUploadCompletionPayload,
  type AssetUploadPayload,
  AssetRowSchema,
  AssetOrganizationRequestSchema,
  AssetRequestSchema,
  AssetProcessingSchema,
  AssetProcessingIdSchema,
  PostgresForeignKeyViolationSchema,
  AssetIndexedTextSchema,
} from "./schema.js";
import {
  defaultAssetProcessingOptions,
  PROCESSABLE_MIME_TYPES,
  type AssetProcessingOptions,
  AssetProcessingLimitsSchema,
} from "./processing.js";
import { ProcessAssetDocumentV2 } from "./workflow.js";
import { makeRetrieval } from "./retrieval.js";
import { contextualizeChunks } from "./chunks.js";
import { limitTextBytes } from "./text.js";
import { migrateAssets } from "./migrations.js";

const migrationsLayer = Layer.effectDiscard(migrateAssets);

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "text/vtt",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/rtf",
  "text/rtf",
]);

const validateUpload = (payload: AssetUploadPayload) => {
  if (payload.byteSize <= 0 || payload.byteSize > MAX_FILE_SIZE) {
    return Effect.fail(
      new AssetUploadInvalid({
        message: "File size must be between 1 byte and 100 MiB",
      }),
    );
  }
  if (!ALLOWED_MIME_TYPES.has(payload.mimeType)) {
    return Effect.fail(
      new AssetUploadInvalid({ message: "Unsupported file type" }),
    );
  }
  if (!/^[a-f\d]{64}$/i.test(payload.checksum)) {
    return Effect.fail(
      new AssetUploadInvalid({
        message: "Checksum must be a SHA-256 hex digest",
      }),
    );
  }
  return Effect.void;
};

const sha256 = (bytes: Uint8Array) =>
  Effect.promise(() =>
    crypto.subtle.digest("SHA-256", Uint8Array.from(bytes)),
  ).pipe(
    Effect.map((digest) =>
      Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join(""),
    ),
  );

const make = (options: AssetProcessingOptions) =>
  Effect.gen(function* () {
    yield* Schema.decodeUnknownEffect(AssetProcessingLimitsSchema)(options);
    const sql = yield* SqlClient.SqlClient;
    const s3 = yield* S3Service;
    const semaphore = yield* Semaphore.make(options.concurrency);

    const list = Effect.fn("Assets.list")(
      SqlSchema.findAll({
        Request: AssetOrganizationRequestSchema,
        Result: AssetRowSchema,
        execute: ({ organizationId }) =>
          sql`SELECT * FROM assets WHERE organization_id = ${organizationId} ORDER BY updated_at DESC`,
      }),
    );

    const findAsset = (lock: boolean) =>
      SqlSchema.findOneOption({
        Request: AssetRequestSchema,
        Result: AssetRowSchema,
        execute: ({ organizationId, assetId }) =>
          sql`SELECT * FROM assets WHERE id = ${assetId} AND organization_id = ${organizationId} ${lock ? sql`FOR UPDATE` : sql``}`,
      });
    const readAsset = findAsset(false);
    const lockAsset = findAsset(true);
    const readProcessing = SqlSchema.findOneOption({
      Request: AssetProcessingIdSchema,
      Result: AssetProcessingSchema,
      execute: ({ processingId }) =>
        sql`SELECT * FROM asset_processings WHERE id = ${processingId}`,
    });

    const stats = Effect.fn("Assets.stats")(function* ({
      organizationId,
    }: {
      organizationId: string;
    }) {
      const rows = yield* list({ organizationId });
      return {
        assetCount: rows.length,
        storageUsedBytes: rows.reduce(
          (total, asset) => total + asset.byteSize,
          0,
        ),
      };
    });

    const failProcessing = Effect.fn("Assets.failProcessing")(function* (
      processingId: string,
      failure: string,
    ) {
      yield* sql`UPDATE asset_processings SET status = 'failed', failure = ${failure}, completed_at = ${new Date()} WHERE id = ${processingId} AND status IN ('pending', 'running')`;
    });

    const startProcessing = Effect.fn("Assets.startProcessing")(function* (
      asset: typeof AssetRowSchema.Type,
    ) {
      if (!PROCESSABLE_MIME_TYPES.has(asset.mimeType)) return;
      const candidateId = crypto.randomUUID();
      const processing = yield* SqlSchema.findOne({
        Request: AssetRowSchema,
        Result: AssetProcessingSchema,
        execute: (asset) => sql`
          INSERT INTO asset_processings (id, asset_id, checksum, filename, mime_type, processor_version)
          VALUES (${candidateId}, ${asset.id}, ${asset.checksum}, ${asset.name}, ${asset.mimeType}, ${options.processorVersion})
          ON CONFLICT (asset_id, checksum, filename, mime_type, processor_version)
          DO UPDATE SET status = asset_processings.status RETURNING *
        `,
      })(asset);
      if (processing.status !== "pending") return;

      yield* ProcessAssetDocumentV2.execute(
        { processingId: processing.id },
        { discard: true },
      ).pipe(
        Effect.catchCause((cause) =>
          failProcessing(processing.id, String(cause)).pipe(
            Effect.andThen(
              Effect.logError("Failed to enqueue asset processing", {
                assetId: asset.id,
                processingId: processing.id,
              }),
            ),
          ),
        ),
      );
    });

    const createUpload = Effect.fn("Assets.createUpload")(function* ({
      organizationId,
      payload,
    }: {
      organizationId: string;
      payload: AssetUploadPayload;
    }) {
      yield* validateUpload(payload);
      if (payload.assetId) {
        const asset = yield* readAsset({
          organizationId,
          assetId: payload.assetId,
        });
        if (Option.isNone(asset))
          return yield* new AssetNotFound({ assetId: payload.assetId });
      }

      const uploadToken = crypto.randomUUID();
      const objectKey = `organizations/${organizationId}/uploads/${uploadToken}`;
      return {
        uploadToken,
        uploadUrl: yield* s3.presign(objectKey, {
          method: "PUT",
          type: payload.mimeType,
          expiresIn: 900,
        }),
        contentType: payload.mimeType,
      };
    });

    const completeUpload = Effect.fn("Assets.completeUpload")(function* ({
      organizationId,
      createdBy,
      payload,
    }: {
      organizationId: string;
      createdBy: string;
      payload: AssetUploadCompletionPayload;
    }) {
      yield* validateUpload(payload);
      const objectKey = `organizations/${organizationId}/uploads/${payload.uploadToken}`;
      const bytes = yield* s3.bytes(objectKey);
      if (bytes.byteLength !== payload.byteSize) {
        yield* s3.delete(objectKey).pipe(Effect.ignore);
        return yield* new AssetUploadInvalid({
          message: `Uploaded file size mismatch: expected ${payload.byteSize} bytes, stored ${bytes.byteLength} bytes`,
        });
      }
      const checksum = yield* sha256(bytes);
      if (checksum !== payload.checksum.toLowerCase()) {
        yield* s3.delete(objectKey).pipe(Effect.ignore);
        return yield* new AssetUploadInvalid({
          message: `Uploaded file checksum mismatch: expected ${payload.checksum.toLowerCase()}, stored ${checksum}`,
        });
      }

      const values = {
        objectKey,
        name: payload.name,
        mimeType: payload.mimeType,
        byteSize: payload.byteSize,
        checksum: payload.checksum.toLowerCase(),
        updatedAt: new Date(),
      };
      const replacementAssetId = payload.assetId;
      const completion = replacementAssetId
        ? yield* sql.withTransaction(
            Effect.gen(function* () {
              const existing = yield* lockAsset({
                organizationId,
                assetId: replacementAssetId,
              });
              if (Option.isNone(existing)) return undefined;
              const completed = yield* SqlSchema.findOne({
                Request: AssetRequestSchema,
                Result: AssetRowSchema,
                execute: ({ organizationId, assetId }) =>
                  sql`UPDATE assets SET ${sql.update(values)} WHERE id = ${assetId} AND organization_id = ${organizationId} RETURNING *`,
              })({ organizationId, assetId: replacementAssetId });
              return { completed, previousObjectKey: existing.value.objectKey };
            }),
          )
        : yield* SqlSchema.findOne({
            Request: AssetOrganizationRequestSchema,
            Result: AssetRowSchema,
            execute: ({ organizationId }) =>
              sql`INSERT INTO assets ${sql.insert({ ...values, organizationId, createdBy })} RETURNING *`,
          })({ organizationId }).pipe(
            Effect.map((completed) => ({
              completed,
              previousObjectKey: undefined,
            })),
          );
      if (!completion) {
        yield* s3.delete(objectKey).pipe(Effect.ignore);
        return payload.assetId
          ? yield* new AssetNotFound({ assetId: payload.assetId })
          : yield* Effect.die("Asset completion returned no row");
      }
      if (
        completion.previousObjectKey &&
        completion.previousObjectKey !== objectKey
      ) {
        yield* s3.delete(completion.previousObjectKey).pipe(Effect.ignore);
      }
      yield* startProcessing(completion.completed);
      return completion.completed;
    });

    const download = Effect.fn("Assets.download")(function* ({
      organizationId,
      assetId,
    }: {
      organizationId: string;
      assetId: string;
    }) {
      const found = yield* readAsset({ organizationId, assetId });
      if (Option.isNone(found)) return yield* new AssetNotFound({ assetId });
      const asset = found.value;
      return {
        url: yield* s3.presign(asset.objectKey, {
          method: "GET",
          expiresIn: 900,
        }),
      };
    });

    const readText = Effect.fn("Assets.readText")(function* ({
      organizationId,
      assetId,
      maxBytes,
    }: {
      organizationId: string;
      assetId: string;
      maxBytes: number;
    }) {
      const found = yield* readAsset({ organizationId, assetId });
      if (Option.isNone(found) || maxBytes <= 0) return undefined;
      const asset = found.value;
      const foundProcessing = yield* SqlSchema.findOneOption({
        Request: AssetRowSchema,
        Result: AssetProcessingSchema,
        execute: (asset) =>
          sql`SELECT * FROM asset_processings WHERE asset_id = ${asset.id} AND checksum = ${asset.checksum} AND filename = ${asset.name} AND mime_type = ${asset.mimeType} AND processor_version = ${options.processorVersion} LIMIT 1`,
      })(asset);
      if (
        Option.isNone(foundProcessing) ||
        foundProcessing.value.status === "pending"
      ) {
        yield* startProcessing(asset);
        return undefined;
      }
      const processing = foundProcessing.value;
      if (processing.status !== "completed") return undefined;
      if (processing.content === null) return undefined;
      return {
        id: asset.id,
        name: asset.name,
        mimeType: asset.mimeType,
        ...limitTextBytes(processing.content, maxBytes),
      };
    });

    const retrieval = yield* makeRetrieval({
      processorVersion: options.processorVersion,
      startProcessing,
    });

    const extractForWorkflow = Effect.fn("Assets.extractForWorkflow")(
      function* (processingId: string) {
        const processing = yield* readProcessing({ processingId });
        if (Option.isNone(processing))
          return yield* Effect.fail("Asset processing not found");
        const asset = yield* SqlSchema.findOneOption({
          Request: AssetProcessingSchema,
          Result: AssetRowSchema,
          execute: ({ assetId }) =>
            sql`SELECT * FROM assets WHERE id = ${assetId}`,
        })(processing.value);
        if (Option.isNone(asset))
          return yield* Effect.fail("Asset processing not found");
        const row = { processing: processing.value, asset: asset.value };
        if (
          row.asset.checksum !== row.processing.checksum ||
          row.asset.name !== row.processing.filename ||
          row.asset.mimeType !== row.processing.mimeType ||
          row.processing.processorVersion !== options.processorVersion
        ) {
          return yield* Effect.fail("Asset changed before processing started");
        }
        const running = yield* SqlSchema.findOneOption({
          Request: AssetProcessingIdSchema,
          Result: AssetProcessingSchema,
          execute: ({ processingId }) =>
            sql`UPDATE asset_processings SET status = 'running', started_at = ${new Date()}, failure = NULL WHERE id = ${processingId} AND status = 'pending' RETURNING *`,
        })({ processingId });
        if (Option.isNone(running) && row.processing.status !== "running") {
          return yield* Effect.fail(
            `Cannot process an asset in ${row.processing.status} state`,
          );
        }
        if (row.asset.byteSize > options.maxInputBytes) {
          return yield* Effect.fail(
            "Document exceeds the extraction size limit",
          );
        }
        const bytes = yield* s3
          .bytes(row.asset.objectKey)
          .pipe(Effect.mapError((error) => error.message));
        if (bytes.byteLength > options.maxInputBytes)
          return yield* Effect.fail(
            "Document exceeds the extraction size limit",
          );

        const output = yield* semaphore.withPermit(
          Effect.tryPromise({
            try: () =>
              extract(
                {
                  kind: ExtractInputKind.Bytes,
                  bytes,
                  filename: row.asset.name,
                  mimeType: row.asset.mimeType,
                },
                options.extraction,
              ),
            catch: (cause) =>
              new AssetExtractionFailed({
                message:
                  cause instanceof Error
                    ? cause.message
                    : "Document extraction failed",
              }),
          }),
        );
        const document = output.results?.[0];
        if (!document?.content)
          return yield* new AssetExtractionFailed({
            message:
              output.errors?.[0]?.message ??
              "Document extraction returned no readable content",
          });
        const extracted = {
          content: document.content,
          contentByteSize: new TextEncoder().encode(document.content)
            .byteLength,
          truncated: false,
        };
        if (extracted.contentByteSize > options.maxOutputBytes)
          return yield* new AssetExtractionFailed({
            message:
              "Extracted document exceeds the output size limit; no partial text was stored",
          });
        const chunks = contextualizeChunks(document.chunks ?? []);
        return yield* Schema.decodeUnknownEffect(AssetIndexedTextSchema)({
          ...extracted,
          chunks,
        }).pipe(
          Effect.mapError(
            () =>
              new AssetExtractionFailed({
                message:
                  "Extraction did not produce valid bounded searchable chunks",
              }),
          ),
        );
      },
    );

    const persistProcessing = Effect.fn("Assets.persistProcessing")(function* (
      processingId: string,
      extracted: typeof AssetIndexedTextSchema.Type,
    ) {
      const found = yield* readProcessing({ processingId });
      if (Option.isNone(found))
        return yield* Effect.fail("Asset processing not found");
      const asset = yield* SqlSchema.findOneOption({
        Request: AssetProcessingSchema,
        Result: AssetRowSchema,
        execute: ({ assetId }) =>
          sql`SELECT * FROM assets WHERE id = ${assetId}`,
      })(found.value);
      if (Option.isNone(asset))
        return yield* Effect.fail("Asset processing not found");
      const processing = {
        processing: found.value,
        checksum: asset.value.checksum,
      };
      if (processing.processing.status === "completed") return;
      if (extracted.truncated)
        return yield* Effect.fail(
          "Refusing to persist incomplete extracted text",
        );
      if (
        processing.processing.status !== "running" ||
        processing.checksum !== processing.processing.checksum
      ) {
        return yield* Effect.fail("Asset changed while processing");
      }
      yield* sql.withTransaction(
        Effect.gen(function* () {
          // Lock the asset before the processing record, matching replacement's lock order.
          const [asset] = yield* sql`SELECT id FROM assets
          WHERE id = ${processing.processing.assetId} AND checksum = ${processing.processing.checksum}
            AND name = ${processing.processing.filename} AND mime_type = ${processing.processing.mimeType}
          FOR UPDATE`;
          if (
            !asset ||
            processing.processing.processorVersion !== options.processorVersion
          )
            return yield* Effect.fail("Asset changed while processing");
          const [current] =
            yield* sql`SELECT id FROM asset_processings WHERE id = ${processingId} AND status = 'running' FOR UPDATE`;
          if (!current) return;
          const validated = yield* Schema.decodeUnknownEffect(
            AssetIndexedTextSchema,
          )(extracted);
          yield* sql`DELETE FROM asset_chunks WHERE processing_id = ${processingId}`;
          for (
            let offset = 0;
            offset < validated.chunks.length;
            offset += 100
          ) {
            yield* sql`INSERT INTO asset_chunks ${sql.insert(validated.chunks.slice(offset, offset + 100).map((chunk) => ({ ...chunk, processingId })))}`;
          }
          yield* sql`UPDATE asset_processings SET status = 'completed', content = ${validated.content}, content_byte_size = ${validated.contentByteSize}, truncated = false, failure = NULL, completed_at = ${new Date()} WHERE id = ${processingId} AND status = 'running'`;
        }),
      );
    });

    const remove = Effect.fn("Assets.remove")(function* ({
      organizationId,
      assetId,
    }: {
      organizationId: string;
      assetId: string;
    }) {
      const asset = yield* sql.withTransaction(
        Effect.gen(function* () {
          const asset = yield* lockAsset({ organizationId, assetId });
          if (Option.isNone(asset))
            return yield* new AssetNotFound({ assetId });
          yield* sql`DELETE FROM assets WHERE id = ${assetId} AND organization_id = ${organizationId}`.pipe(
            Effect.mapError((error) =>
              error.reason._tag === "ConstraintError" &&
              Schema.is(PostgresForeignKeyViolationSchema)(error.reason.cause)
                ? new AssetInUse({ assetId })
                : error,
            ),
          );
          return asset.value;
        }),
      );
      yield* s3.delete(asset.objectKey);
      return asset;
    });

    return {
      list,
      stats,
      createUpload,
      completeUpload,
      download,
      readText,
      ...retrieval,
      remove,
      extractForWorkflow: (processingId: string) =>
        extractForWorkflow(processingId).pipe(
          Effect.mapError((error) => String(error)),
        ),
      persistProcessing: (
        processingId: string,
        extracted: typeof AssetIndexedTextSchema.Type,
      ) =>
        persistProcessing(processingId, extracted).pipe(
          Effect.mapError((error) => String(error)),
        ),
      failProcessing: (processingId: string, failure: string) =>
        failProcessing(processingId, failure).pipe(
          Effect.mapError((error) => String(error)),
        ),
    };
  });

export class Assets extends Context.Service<
  Assets,
  Effect.Success<ReturnType<typeof make>>
>()("Assets") {
  static readonly layerWithoutMigrations = Layer.effect(
    this,
    make(defaultAssetProcessingOptions),
  );
  static readonly layerWithoutMigrationsWith = (
    options: Partial<AssetProcessingOptions>,
  ) =>
    Layer.effect(
      this,
      make({
        ...defaultAssetProcessingOptions,
        ...options,
        extraction: {
          ...defaultAssetProcessingOptions.extraction,
          ...options.extraction,
          chunking: {
            ...defaultAssetProcessingOptions.extraction.chunking,
            ...options.extraction?.chunking,
          },
        },
      }),
    );

  static readonly layer = this.layerWithoutMigrations.pipe(
    Layer.provide(migrationsLayer),
  );
  static readonly layerWith = (options: Partial<AssetProcessingOptions>) =>
    this.layerWithoutMigrationsWith(options).pipe(
      Layer.provide(migrationsLayer),
    );
}
