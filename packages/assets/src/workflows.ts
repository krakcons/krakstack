import { Cause, Effect, Layer, Schema } from "effect";
import { Activity } from "effect/workflow";
import { AssetExtractedTextSchema, AssetIndexedTextSchema } from "./schema.js";

import { Assets } from "./index.js";
import { ProcessAssetDocumentV1, ProcessAssetDocumentV2 } from "./workflow.js";

const failureMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : String(cause);

const legacyWorkflowLayer = ProcessAssetDocumentV1.toLayer(({ processingId }) =>
  Effect.gen(function* () {
    const assets = yield* Assets;
    yield* Effect.gen(function* () {
      yield* Activity.make({
        name: "ExtractAssetDocumentTextV1",
        success: AssetExtractedTextSchema,
        error: Schema.String,
        execute: assets.extractForWorkflow(processingId),
      });
      yield* Activity.make({
        name: "PersistAssetDocumentTextV1",
        error: Schema.String,
        // V1's cached result can contain clipped text and no index. Never mark
        // it searchable. Access schedules a new V2 run for processor version 4.
        execute: Effect.fail(
          "Legacy extraction requires reprocessing with the current processor",
        ),
      });
    }).pipe(
      Effect.catchCause((cause) =>
        Cause.hasInterruptsOnly(cause)
          ? Effect.interrupt
          : assets
              .failProcessing(processingId, failureMessage(cause))
              .pipe(Effect.orDie),
      ),
    );
  }),
);

const indexedWorkflowLayer = ProcessAssetDocumentV2.toLayer(
  ({ processingId }) =>
    Effect.gen(function* () {
      const assets = yield* Assets;
      yield* Effect.gen(function* () {
        const extracted = yield* Activity.make({
          name: "ExtractAssetDocumentChunksV2",
          success: AssetIndexedTextSchema,
          error: Schema.String,
          execute: assets.extractForWorkflow(processingId),
        });
        yield* Activity.make({
          name: "PersistAssetDocumentChunksV2",
          error: Schema.String,
          execute: assets.persistProcessing(processingId, extracted),
        });
      }).pipe(
        Effect.catchCause((cause) =>
          Cause.hasInterruptsOnly(cause)
            ? Effect.interrupt
            : assets
                .failProcessing(processingId, failureMessage(cause))
                .pipe(Effect.orDie),
        ),
      );
    }),
);

export const assetProcessingWorkflowLayer = Layer.merge(
  legacyWorkflowLayer,
  indexedWorkflowLayer,
);
