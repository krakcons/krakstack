import { Effect } from "effect";
import { SqlClient } from "effect/unstable/sql";

import { NotificationQueueError } from "../schema.js";
import type { NotificationQueues } from "./queue.js";

const queueError = (operation: string, cause: unknown) =>
  new NotificationQueueError({
    operation,
    message: `Notification queue operation failed: ${operation}`,
    cause,
  });

export const allocateDeliveryJob = Effect.fn(
  "NotificationJobs.allocateDeliveryJob",
)(function* (input: {
  readonly sql: SqlClient.SqlClient;
  readonly queues: NotificationQueues;
  readonly deliveryId: string;
  readonly attempts: number;
  readonly jobGeneration: number;
  readonly now: Date;
}) {
  const jobId = globalThis.crypto.randomUUID();
  const attemptId = globalThis.crypto.randomUUID();
  const attempt = input.attempts + 1;
  const generation = input.jobGeneration + 1;

  yield* input.sql`
    INSERT INTO notification_delivery_attempts (
      id,
      delivery_id,
      job_id,
      generation,
      attempt,
      queued_at,
      created_at
    ) VALUES (
      ${attemptId},
      ${input.deliveryId},
      ${jobId},
      ${generation},
      ${attempt},
      ${input.now},
      ${input.now}
    )
  `;

  yield* input.sql`
    UPDATE notification_deliveries
    SET
      status = 'queued',
      attempts = ${attempt},
      current_job_id = ${jobId},
      job_generation = ${generation},
      queued_at = ${input.now},
      processing_at = NULL,
      claimed_by = NULL,
      lease_expires_at = NULL,
      updated_at = ${input.now}
    WHERE id = ${input.deliveryId}
  `;

  yield* input.queues.deliveries
    .offer(
      {
        _tag: "Delivery",
        deliveryId: input.deliveryId,
        generation,
        attempt,
      },
      { id: jobId },
    )
    .pipe(
      Effect.mapError((cause) =>
        queueError("allocateDeliveryJob.offer", cause),
      ),
    );

  return { jobId, generation, attempt };
});

export const allocateReminderJob = Effect.fn(
  "NotificationJobs.allocateReminderJob",
)(function* (input: {
  readonly sql: SqlClient.SqlClient;
  readonly queues: NotificationQueues;
  readonly reminderId: string;
  readonly attempts: number;
  readonly jobGeneration: number;
  readonly now: Date;
}) {
  const jobId = globalThis.crypto.randomUUID();
  const attempt = input.attempts + 1;
  const generation = input.jobGeneration + 1;

  yield* input.sql`
    UPDATE notification_reminders
    SET
      status = 'queued',
      attempts = ${attempt},
      current_job_id = ${jobId},
      job_generation = ${generation},
      queued_at = ${input.now},
      updated_at = ${input.now}
    WHERE id = ${input.reminderId}
  `;

  yield* input.queues.reminders
    .offer(
      {
        _tag: "Reminder",
        reminderId: input.reminderId,
        generation,
        attempt,
      },
      { id: jobId },
    )
    .pipe(
      Effect.mapError((cause) =>
        queueError("allocateReminderJob.offer", cause),
      ),
    );

  return { jobId, generation, attempt };
});
