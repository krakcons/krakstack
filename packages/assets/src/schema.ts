import { Schema } from "effect";

export const PostgresForeignKeyViolationSchema = Schema.Struct({
  // Postgres reports RESTRICT as 23001 and other FK violations as 23503.
  code: Schema.Literals(["23001", "23503"]),
}).annotate({ identifier: "PostgresForeignKeyViolation" });

export const AssetSchema = Schema.Struct({
  id: Schema.String.check(Schema.isUUID()),
  organizationId: Schema.String,
  name: Schema.NonEmptyString,
  mimeType: Schema.NonEmptyString,
  byteSize: Schema.Int,
  checksum: Schema.NonEmptyString,
  metadata: Schema.Record(Schema.String, Schema.Unknown),
  createdBy: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "Asset" });

export const AssetUploadPayloadSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  mimeType: Schema.NonEmptyString,
  byteSize: Schema.Int,
  checksum: Schema.NonEmptyString,
  assetId: Schema.optional(Schema.String.check(Schema.isUUID())),
}).annotate({ identifier: "AssetUploadPayload" });

export const AssetUploadSchema = Schema.Struct({
  uploadToken: Schema.String.check(Schema.isUUID()),
  uploadUrl: Schema.String,
  contentType: Schema.NonEmptyString,
}).annotate({ identifier: "AssetUpload" });

export const AssetUploadCompletionPayloadSchema = Schema.Struct({
  ...AssetUploadPayloadSchema.fields,
  uploadToken: Schema.String.check(Schema.isUUID()),
}).annotate({ identifier: "AssetUploadCompletionPayload" });

export const AssetParamsSchema = Schema.Struct({
  assetId: Schema.String.check(Schema.isUUID()),
}).annotate({ identifier: "AssetParams" });

export const AssetIdsPayloadSchema = Schema.Struct({
  ids: Schema.Array(Schema.String.check(Schema.isUUID())).check(
    Schema.isMinLength(1),
  ),
}).annotate({ identifier: "AssetIdsPayload" });

export type AssetIdsPayload = typeof AssetIdsPayloadSchema.Type;
export type Asset = typeof AssetSchema.Type;

export const AssetDeleteResultSchema = Schema.Struct({
  deletedIds: Schema.Array(Schema.String.check(Schema.isUUID())),
  failures: Schema.Array(
    Schema.Struct({
      id: Schema.String.check(Schema.isUUID()),
      reason: Schema.Union([
        Schema.Literal("not_found"),
        Schema.Literal("in_use"),
      ]),
    }),
  ),
}).annotate({ identifier: "AssetDeleteResult" });

export const AssetDownloadSchema = Schema.Struct({
  url: Schema.String,
}).annotate({ identifier: "AssetDownload" });

export const AssetTextSchema = Schema.Struct({
  id: Schema.String.check(Schema.isUUID()),
  name: Schema.NonEmptyString,
  mimeType: Schema.NonEmptyString,
  byteSize: Schema.Int,
  content: Schema.String,
}).annotate({ identifier: "AssetText" });

export const AssetExtractedTextSchema = Schema.Struct({
  content: Schema.String,
  contentByteSize: Schema.Int,
  truncated: Schema.Boolean,
}).annotate({ identifier: "AssetExtractedText" });

const NonNegativeInt = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

export const AssetExtractedChunkSchema = Schema.Struct({
  ordinal: NonNegativeInt,
  content: Schema.NonEmptyString.check(Schema.isMaxLength(16384)),
  headingPath: Schema.String.check(Schema.isMaxLength(1000)),
  byteStart: NonNegativeInt,
  byteEnd: NonNegativeInt,
  firstPage: Schema.NullOr(Schema.Int),
  lastPage: Schema.NullOr(Schema.Int),
}).annotate({ identifier: "AssetExtractedChunk" });

export const AssetIndexedTextSchema = Schema.Struct({
  ...AssetExtractedTextSchema.fields,
  chunks: Schema.Array(AssetExtractedChunkSchema).check(
    Schema.isMinLength(1),
    Schema.isMaxLength(100000),
  ),
}).annotate({ identifier: "AssetIndexedText" });

export const AssetChunkSchema = Schema.Struct({
  ...AssetExtractedChunkSchema.fields,
  id: Schema.String.check(Schema.isUUID()),
  processingId: Schema.String.check(Schema.isUUID()),
}).annotate({ identifier: "AssetChunk" });

export const AssetOutlineEntrySchema = Schema.Struct({
  headingPath: Schema.String,
  firstOrdinal: NonNegativeInt,
  lastOrdinal: NonNegativeInt,
}).annotate({ identifier: "AssetOutlineEntry" });

export const AssetOverviewSchema = Schema.Struct({
  id: Schema.String.check(Schema.isUUID()),
  name: Schema.String,
  mimeType: Schema.String,
  processingId: Schema.NullOr(Schema.String.check(Schema.isUUID())),
  status: Schema.Literals([
    "pending",
    "running",
    "completed",
    "failed",
    "unsupported",
  ]),
  totalBytes: NonNegativeInt,
  totalChunks: NonNegativeInt,
  failure: Schema.NullOr(Schema.String),
}).annotate({ identifier: "AssetOverview" });

export const AssetOverviewResponseSchema = Schema.Struct({
  ...AssetOverviewSchema.fields,
  outline: Schema.Array(AssetOutlineEntrySchema),
  nextOutlineOffset: Schema.NullOr(NonNegativeInt),
}).annotate({ identifier: "AssetOverviewResponse" });

export const AssetOverviewRequestSchema = Schema.Struct({
  organizationId: Schema.String,
  assetId: Schema.String.check(Schema.isUUID()),
  outlineOffset: Schema.optional(
    NonNegativeInt.check(Schema.isLessThanOrEqualTo(100000)),
  ),
}).annotate({ identifier: "AssetOverviewRequest" });

export const AssetSearchRequestSchema = Schema.Struct({
  assetId: Schema.String.check(Schema.isUUID()),
  processingId: Schema.String.check(Schema.isUUID()),
  query: Schema.NonEmptyString.check(Schema.isMaxLength(500)),
  language: Schema.Literals(["en", "fr"]),
  offset: Schema.optional(
    NonNegativeInt.check(Schema.isLessThanOrEqualTo(100000)),
  ),
  headingPath: Schema.optional(Schema.String.check(Schema.isMaxLength(1000))),
}).annotate({ identifier: "AssetSearchRequest" });

export const AssetScopedSearchRequestSchema = Schema.Struct({
  ...AssetSearchRequestSchema.fields,
  organizationId: Schema.String,
}).annotate({ identifier: "AssetScopedSearchRequest" });

export const AssetSearchHitSchema = Schema.Struct({
  id: AssetChunkSchema.fields.id,
  processingId: AssetChunkSchema.fields.processingId,
  ordinal: AssetChunkSchema.fields.ordinal,
  headingPath: AssetChunkSchema.fields.headingPath,
  byteStart: AssetChunkSchema.fields.byteStart,
  byteEnd: AssetChunkSchema.fields.byteEnd,
  firstPage: AssetChunkSchema.fields.firstPage,
  lastPage: AssetChunkSchema.fields.lastPage,
  snippet: Schema.String,
  score: Schema.Number,
}).annotate({ identifier: "AssetSearchHit" });

export const AssetSearchResponseSchema = Schema.Struct({
  assetId: Schema.String.check(Schema.isUUID()),
  processingId: Schema.String.check(Schema.isUUID()),
  hits: Schema.Array(AssetSearchHitSchema),
  nextOffset: Schema.NullOr(NonNegativeInt),
}).annotate({ identifier: "AssetSearchResponse" });

export const AssetReadChunksRequestSchema = Schema.Struct({
  assetId: Schema.String.check(Schema.isUUID()),
  processingId: Schema.String.check(Schema.isUUID()),
  ordinals: Schema.Array(
    NonNegativeInt.check(Schema.isLessThanOrEqualTo(100000)),
  ).check(Schema.isMinLength(1), Schema.isMaxLength(4)),
  includeNeighbors: Schema.optional(Schema.Boolean),
}).annotate({ identifier: "AssetReadChunksRequest" });

export const AssetScopedReadChunksRequestSchema = Schema.Struct({
  ...AssetReadChunksRequestSchema.fields,
  organizationId: Schema.String,
}).annotate({ identifier: "AssetScopedReadChunksRequest" });

export const AssetReadChunksResponseSchema = Schema.Struct({
  assetId: Schema.String.check(Schema.isUUID()),
  processingId: Schema.String.check(Schema.isUUID()),
  chunks: Schema.Array(AssetChunkSchema),
}).annotate({ identifier: "AssetReadChunksResponse" });

export class AssetTextChunkInvalid extends Schema.TaggedError<AssetTextChunkInvalid>()(
  "AssetTextChunkInvalid",
  { message: Schema.String },
  { httpApiStatus: 400 },
) {}

export class AssetTextVersionChanged extends Schema.TaggedError<AssetTextVersionChanged>()(
  "AssetTextVersionChanged",
  { assetId: Schema.String },
  { httpApiStatus: 409 },
) {}

export class AssetExtractionFailed extends Schema.TaggedError<AssetExtractionFailed>()(
  "AssetExtractionFailed",
  { message: Schema.String },
) {}

export const AssetStatsSchema = Schema.Struct({
  assetCount: Schema.Int,
  storageUsedBytes: Schema.Int,
}).annotate({ identifier: "AssetStats" });

export class AssetNotFound extends Schema.TaggedError<AssetNotFound>()(
  "AssetNotFound",
  { assetId: Schema.String },
  { httpApiStatus: 404 },
) {}

export class AssetUploadInvalid extends Schema.TaggedError<AssetUploadInvalid>()(
  "AssetUploadInvalid",
  { message: Schema.String },
  { httpApiStatus: 400 },
) {}

export class AssetInUse extends Schema.TaggedError<AssetInUse>()(
  "AssetInUse",
  { assetId: Schema.String },
  { httpApiStatus: 409 },
) {}

export type AssetUploadPayload = typeof AssetUploadPayloadSchema.Type;
export type AssetUploadCompletionPayload =
  typeof AssetUploadCompletionPayloadSchema.Type;

export const AssetRowSchema = Schema.Struct({
  ...AssetSchema.fields,
  objectKey: Schema.String,
}).annotate({ identifier: "AssetRow" });

export const AssetOrganizationRequestSchema = Schema.Struct({
  organizationId: Schema.String,
}).annotate({ identifier: "AssetOrganizationRequest" });

export const AssetRequestSchema = Schema.Struct({
  ...AssetOrganizationRequestSchema.fields,
  ...AssetParamsSchema.fields,
}).annotate({ identifier: "AssetRequest" });

export const AssetProcessingSchema = Schema.Struct({
  id: Schema.String.check(Schema.isUUID()),
  assetId: Schema.String.check(Schema.isUUID()),
  checksum: Schema.String,
  filename: Schema.String,
  mimeType: Schema.String,
  processorVersion: Schema.Int,
  status: Schema.Literals(["pending", "running", "completed", "failed"]),
  content: Schema.NullOr(Schema.String),
  contentByteSize: Schema.NullOr(Schema.Int),
  truncated: Schema.NullOr(Schema.Boolean),
  failure: Schema.NullOr(Schema.String),
  startedAt: Schema.NullOr(Schema.Date),
  completedAt: Schema.NullOr(Schema.Date),
  createdAt: Schema.Date,
}).annotate({ identifier: "AssetProcessing" });

export const AssetProcessingIdSchema = Schema.Struct({
  processingId: Schema.String.check(Schema.isUUID()),
}).annotate({ identifier: "AssetProcessingId" });
