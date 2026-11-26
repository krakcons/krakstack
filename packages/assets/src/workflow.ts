import { Schema } from "effect";
import { Workflow } from "effect/workflow";
import {
  AssetUploadFinalization,
  AssetUploadScanKey,
  AssetUploadScanStatus,
} from "./schema.js";

// Persisted names and payloads are compatibility boundaries.
export const ProcessAssetDocumentV1 = Workflow.make("ProcessAssetDocumentV1", {
  payload: { processingId: Schema.String.check(Schema.isUUID()) },
  idempotencyKey: ({ processingId }) => processingId,
});

export const ProcessAssetDocumentV2 = Workflow.make("ProcessAssetDocumentV2", {
  payload: { processingId: Schema.String.check(Schema.isUUID()) },
  idempotencyKey: ({ processingId }) => processingId,
});

export const FinalizeAssetUploadV1 = Workflow.make("FinalizeAssetUploadV1", {
  payload: {
    ...AssetUploadScanKey.fields,
    // Status lookups compute the same ID from the key alone.
    request: Schema.optional(AssetUploadFinalization),
  },
  success: AssetUploadScanStatus,
  idempotencyKey: ({ organizationId, createdBy, uploadToken }) =>
    JSON.stringify([organizationId, createdBy, uploadToken]),
});
