// Persisted workflow and activity names must remain stable.
import { Effect, Layer, Schedule } from "effect";
import { Activity, DurableClock, Workflow } from "effect/workflow";
import { SendCampaigns } from "./campaign.js";
import {
  CampaignBatch,
  CampaignBatchResult,
  CampaignExecutionError,
} from "./schema.js";

// One bounded activity per durable generation. The SQL generation advances only
// with the recipient publications, so retries and concurrent schedulers are safe.
export const DispatchSendCampaignBatchV1 = Workflow.make(
  "DispatchSendCampaignBatchV1",
  {
    payload: CampaignBatch.fields,
    success: CampaignBatchResult,
    error: CampaignExecutionError,
    idempotencyKey: ({ id, batchNumber }) => `${id}:${batchNumber}`,
  },
);
export const campaignWorkflowLayer = DispatchSendCampaignBatchV1.toLayer(
  (input) =>
    Effect.gen(function* () {
      const campaigns = yield* SendCampaigns;
      let retry = 0;
      return yield* Activity.make({
        name: "PublishSendCampaignBatchV1",
        success: CampaignBatchResult,
        error: CampaignExecutionError,
        execute: campaigns.processBatch(input).pipe(
          Effect.mapError(
            () =>
              new CampaignExecutionError({
                message: "Campaign batch could not be published",
              }),
          ),
        ),
      }).pipe(
        Activity.retry({
          while: () =>
            DurableClock.sleep({
              name: `RetrySendCampaignBatchV1-${retry++}`,
              duration: "10 seconds",
              inMemoryThreshold: "0 millis",
            }).pipe(Effect.as(true)),
        }),
      );
    }),
);

export const campaignSchedulerLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const campaigns = yield* SendCampaigns;
    const tick = Effect.gen(function* () {
      const due = yield* campaigns.due(undefined);
      for (const input of due)
        yield* DispatchSendCampaignBatchV1.execute(input, { discard: true });
    }).pipe(
      Effect.catch(() =>
        Effect.logWarning(
          "Campaign scheduling failed; due campaigns will be retried",
        ),
      ),
    );
    yield* Effect.forkScoped(
      tick.pipe(Effect.repeat(Schedule.spaced("10 seconds"))),
    );
  }),
);
