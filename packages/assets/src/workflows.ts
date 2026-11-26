import { Cause, Effect, Layer, Schedule, Schema } from "effect";
import { Activity, DurableClock } from "effect/workflow";
import {
  AssetExtractedTextSchema,
  AssetIndexedTextSchema,
  AssetUploadScanStatus,
} from "./schema.js";

import { Assets } from "./index.js";
import {
  FinalizeAssetUploadV1,
  ProcessAssetDocumentV1,
  ProcessAssetDocumentV2,
} from "./workflow.js";

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

export const assetUploadScanWorkflowLayer = FinalizeAssetUploadV1.toLayer(
  ({ request, ...key }, executionId) =>
    Effect.gen(function* () {
      const assets = yield* Assets;
      const failed = {
        uploadToken: key.uploadToken,
        status: "failed",
        assetId: null,
      } as const;
      if (!request) return failed;
      const retryDelays = [
        "15 seconds",
        "1 minute",
        "5 minutes",
        "15 minutes",
      ] as const;
      for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
        const delay = retryDelays[attempt];
        const result = yield* Activity.make({
          name: `ValidateAssetUploadV1-${attempt}`,
          success: AssetUploadScanStatus,
          error: Schema.String,
          execute: assets
            .validateAndPublishUpload(key, request, executionId)
            .pipe(
              Effect.mapError(
                () => "Could not validate and publish asset upload",
              ),
              Effect.tapError(Effect.logWarning),
            ),
        }).pipe(Effect.option);
        if (result._tag === "Some") {
          if (result.value.status === "published") {
            yield* Activity.make({
              name: "ProcessPublishedUploadV1",
              error: Schema.String,
              execute: assets
                .processScannedUpload(key.organizationId, request, executionId)
                .pipe(
                  Effect.mapError(
                    () => "Could not schedule extraction for scanned asset",
                  ),
                  Effect.tapError(Effect.logWarning),
                  Effect.retry(Schedule.spaced("30 seconds")),
                ),
            }).pipe(Effect.orDie);
          }
          return result.value;
        }
        if (!delay) break;
        yield* DurableClock.sleep({
          name: `AssetUploadScanRetryV1-${attempt}`,
          duration: delay,
          inMemoryThreshold: 0,
        });
      }
      return failed;
    }),
);
