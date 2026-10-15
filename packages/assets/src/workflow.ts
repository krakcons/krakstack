import { Schema } from "effect";
import { Workflow } from "effect/workflow";

// Persisted names and payloads are compatibility boundaries.
export const ProcessAssetDocumentV1 = Workflow.make("ProcessAssetDocumentV1", {
  payload: { processingId: Schema.String.check(Schema.isUUID()) },
  idempotencyKey: ({ processingId }) => processingId,
});

export const ProcessAssetDocumentV2 = Workflow.make("ProcessAssetDocumentV2", {
  payload: { processingId: Schema.String.check(Schema.isUUID()) },
  idempotencyKey: ({ processingId }) => processingId,
});
