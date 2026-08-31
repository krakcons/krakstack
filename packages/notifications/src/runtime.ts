import { Cause, Context, DateTime, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";

import { allocateDeliveryJob, allocateReminderJob } from "./internal/jobs.js";
import { canonicalRecipientAddress } from "./internal/idempotency.js";
import {
  deliveryWorkDecision,
  queueReconciliationDecision,
  reminderWorkDecision,
  selectPreference,
} from "./internal/policy.js";
import {
  DELIVERY_QUEUE_NAME,
  NOTIFICATION_QUEUE_LOCK_EXPIRATION_MILLIS,
  NOTIFICATION_QUEUE_TABLE,
  NotificationQueueService,
  REMINDER_QUEUE_NAME,
  notificationQueueLayer,
} from "./internal/queue.js";
import {
  decodeRows,
  deliveryColumns,
  preferenceColumns,
  reminderColumns,
  storageError,
  wildcardScope,
} from "./internal/sql.js";
import {
  EnqueueDueInput,
  EnqueueDueResult,
  NotificationDataError,
  NotificationDate,
  NotificationDelivery,
  NotificationPreference,
  NotificationQueueError,
  NotificationReminder,
  NotificationRuntimeOptions,
  ReminderHandlerConfigurationError,
  ReminderHandlerInput,
  ReminderHandlerUnavailable,
  RetryPolicy,
  type NotificationDataError as NotificationDataErrorType,
  type NotificationDelivery as NotificationDeliveryType,
  type NotificationReminder as NotificationReminderType,
  type NotificationStorageError,
  type ReminderHandlerFailure,
} from "./schema.js";
import {
  NotificationTransportInput,
  NotificationTransportRegistry,
  type NotificationTransportFailure,
  type NotificationTransportRegistryContract,
  type NotificationTransportResult,
} from "./transport.js";

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  baseDelayMillis: 30_000,
  maxDelayMillis: 3_600_000,
};

export const nextRetryAt = (
  input: {
    readonly now: Date;
    readonly attempt: number;
    readonly retryAfter?: Date | undefined;
  },
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): Date => {
  const exponent = Math.max(0, Math.min(input.attempt - 1, 30));
  const delay = Math.min(
    policy.maxDelayMillis,
    policy.baseDelayMillis * 2 ** exponent,
  );
  const retryAt = input.now.getTime() + delay;
  return new Date(
    input.retryAfter === undefined
      ? retryAt
      : Math.max(retryAt, input.retryAfter.getTime()),
  );
};

export const deliveryFailureDecision = (input: {
  readonly errorTag: NotificationTransportFailure["_tag"];
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly now: Date;
  readonly retryAfter?: Date | undefined;
  readonly policy?: RetryPolicy | undefined;
}) => {
  const canRetry =
    input.errorTag !== "NotificationTransportPermanent" &&
    input.attempts < input.maxAttempts;
  return {
    canRetry,
    persistedAttempts: input.attempts,
    scheduledFor: canRetry
      ? nextRetryAt(
          {
            now: input.now,
            attempt: input.attempts,
            retryAfter: input.retryAfter,
          },
          input.policy,
        )
      : null,
  };
};

const QueueReconciliationObservation = Schema.Struct({
  queue: Schema.NullOr(
    Schema.Struct({
      completed: Schema.Boolean,
      attempts: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
      acquiredAt: Schema.NullOr(NotificationDate),
    }),
  ),
}).annotate({ identifier: "NotificationQueueReconciliationObservation" });

export interface ReminderHandler {
  readonly key: string;
  readonly version: number;
  readonly handle: (
    input: ReminderHandlerInput,
  ) => Effect.Effect<void, ReminderHandlerFailure>;
}

export interface ReminderHandlerRegistryContract {
  readonly get: (
    key: string,
    version: number,
  ) => Effect.Effect<ReminderHandler, ReminderHandlerUnavailable>;
  readonly handlers: ReadonlyArray<{
    readonly key: string;
    readonly version: number;
  }>;
}

const reminderHandlerId = (key: string, version: number) => `${key}@${version}`;

export class ReminderHandlerRegistry extends Context.Service<
  ReminderHandlerRegistry,
  ReminderHandlerRegistryContract
>()("@krak-stack/notifications/ReminderHandlerRegistry") {
  static readonly layer = (handlers: ReadonlyArray<ReminderHandler>) =>
    Layer.effect(
      this,
      Effect.gen(function* () {
        const registry = new Map<string, ReminderHandler>();
        for (const handler of handlers) {
          const descriptor = yield* Schema.decodeUnknownEffect(
            Schema.Struct({
              key: Schema.NonEmptyString,
              version: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0))),
            }),
          )({ key: handler.key, version: handler.version }).pipe(
            Effect.mapError(
              () =>
                new ReminderHandlerConfigurationError({
                  handlerKey: handler.key || "invalid",
                  handlerVersion: handler.version,
                  message: "Reminder handler keys and versions must be valid",
                }),
            ),
          );
          const id = reminderHandlerId(descriptor.key, descriptor.version);
          if (registry.has(id)) {
            return yield* new ReminderHandlerConfigurationError({
              handlerKey: descriptor.key,
              handlerVersion: descriptor.version,
              message: `Duplicate reminder handler: ${id}`,
            });
          }
          registry.set(id, handler);
        }

        const get = Effect.fn("ReminderHandlerRegistry.get")(function* (
          key: string,
          version: number,
        ) {
          const handler = registry.get(reminderHandlerId(key, version));
          if (handler === undefined) {
            return yield* new ReminderHandlerUnavailable({
              handlerKey: key,
              handlerVersion: version,
              message: `No reminder handler registered for ${key}@${version}`,
            });
          }
          return handler;
        });

        return {
          get,
          handlers: handlers.map(({ key, version }) => ({ key, version })),
        } satisfies ReminderHandlerRegistryContract;
      }),
    );

  static readonly emptyLayer = this.layer([]);
}

export type NotificationRuntimeError =
  | NotificationStorageError
  | NotificationQueueError
  | NotificationDataErrorType;

export interface NotificationRuntimeContract {
  readonly enqueueDue: (
    input?: EnqueueDueInput,
  ) => Effect.Effect<EnqueueDueResult, NotificationRuntimeError>;
  readonly runDeliveryWorkerOnce: Effect.Effect<void, NotificationRuntimeError>;
  readonly runReminderWorkerOnce: Effect.Effect<void, NotificationRuntimeError>;
  readonly runDeliveryWorker: Effect.Effect<never>;
  readonly runReminderWorker: Effect.Effect<never>;
  readonly runScheduler: Effect.Effect<never>;
}

const makeNotificationRuntime = (options: NotificationRuntimeOptions = {}) =>
  Effect.gen(function* () {
    const runtimeOptions = yield* Schema.decodeUnknownEffect(
      NotificationRuntimeOptions,
    )(options).pipe(
      Effect.mapError(
        (cause) =>
          new NotificationDataError({
            entity: "notification runtime options",
            message: "Invalid notification runtime options",
            cause,
          }),
      ),
    );
    const sql = (yield* SqlClient.SqlClient).withoutTransforms();
    const notificationQueueTable = sql(NOTIFICATION_QUEUE_TABLE);
    const transports = yield* NotificationTransportRegistry;
    const reminderHandlers = yield* ReminderHandlerRegistry;
    const queues = yield* NotificationQueueService;
    const retryPolicy = runtimeOptions.retryPolicy ?? DEFAULT_RETRY_POLICY;
    const dueBatchSize = runtimeOptions.dueBatchSize ?? 100;
    const queueMaxAttempts = runtimeOptions.queueMaxAttempts ?? 10;
    const schedulerIntervalMillis =
      runtimeOptions.schedulerIntervalMillis ?? 10_000;

    const markAttemptSkipped = Effect.fn(
      "NotificationRuntime.markAttemptSkipped",
    )(function* (input: {
      readonly deliveryId: string;
      readonly jobId: string;
      readonly reason:
        | "cancelled"
        | "expired"
        | "stale"
        | "terminal"
        | "suppressed";
      readonly now: Date;
    }) {
      yield* sql`
        UPDATE notification_delivery_attempts
        SET
          outcome = 'skipped',
          error_message = ${input.reason},
          completed_at = ${input.now}
        WHERE delivery_id = ${input.deliveryId}
          AND job_id = ${input.jobId}
          AND outcome IS NULL
      `;
    });

    const deliverySuppressionReason = Effect.fn(
      "NotificationRuntime.deliverySuppressionReason",
    )(function* (input: {
      readonly delivery: NotificationDeliveryType;
      readonly now: Date;
    }) {
      const recipientAddress = canonicalRecipientAddress(
        input.delivery.channel,
        input.delivery.recipientAddress,
      );
      const endpointRows = yield* sql`
        SELECT x.id
        FROM notification_suppressions x
        WHERE ${wildcardScope(sql, "x", input.delivery.scope)}
          AND x.channel = ${input.delivery.channel}
          AND (x.purpose IS NULL OR x.purpose = ${input.delivery.purpose})
          AND x.recipient_address = ${recipientAddress}
          AND (x.expires_at IS NULL OR x.expires_at > ${input.now})
        LIMIT 1
      `;
      if (endpointRows.length > 0) return "endpoint_suppressed" as const;

      const recipientUserId = input.delivery.scope.recipientUserId;
      if (
        input.delivery.purpose !== "notification" ||
        recipientUserId === null
      ) {
        return null;
      }
      const preferenceRows = yield* sql`
        SELECT ${preferenceColumns(sql)}
        FROM notification_settings s
        WHERE s.recipient_user_id = ${recipientUserId}
          AND s.channel = ${input.delivery.channel}
          AND (
            s.organization_id IS NULL
            OR s.organization_id IS NOT DISTINCT FROM ${input.delivery.scope.organizationId}
          )
          AND (
            s.workspace_id IS NULL
            OR s.workspace_id IS NOT DISTINCT FROM ${input.delivery.scope.workspaceId}
          )
          AND (s.event_key IS NULL OR s.event_key = ${input.delivery.eventKey})
        ORDER BY s.updated_at DESC, s.id ASC
      `;
      const preferences = yield* decodeRows(
        "notification preferences before dispatch",
        NotificationPreference,
        preferenceRows,
      );
      const preference = selectPreference(preferences, {
        scope: {
          recipientUserId,
          organizationId: input.delivery.scope.organizationId,
          workspaceId: input.delivery.scope.workspaceId,
        },
        eventKey: input.delivery.eventKey,
      });
      return preference?.enabled === false ? "preference_disabled" : null;
    });

    const persistDeliverySuccess = Effect.fn(
      "NotificationRuntime.persistDeliverySuccess",
    )(function* (input: {
      readonly delivery: NotificationDeliveryType;
      readonly jobId: string;
      readonly result: NotificationTransportResult;
      readonly now: Date;
    }) {
      yield* sql.withTransaction(
        Effect.gen(function* () {
          yield* sql`
            UPDATE notification_delivery_attempts
            SET
              outcome = 'sent',
              provider = ${input.result.provider},
              provider_message_id = ${input.result.providerMessageId},
              completed_at = ${input.now}
            WHERE delivery_id = ${input.delivery.id}
              AND job_id = ${input.jobId}
              AND outcome IS NULL
          `;
          yield* sql`
            UPDATE notification_deliveries
            SET
              status = 'sent',
              current_job_id = NULL,
              processing_at = NULL,
              provider = ${input.result.provider},
              provider_message_id = ${input.result.providerMessageId},
              error_message = NULL,
              sent_at = ${input.now},
              updated_at = ${input.now}
            WHERE id = ${input.delivery.id}
              AND current_job_id = ${input.jobId}
              AND job_generation = ${input.delivery.jobGeneration}
          `;
        }),
      );
    });

    const persistDeliveryFailure = Effect.fn(
      "NotificationRuntime.persistDeliveryFailure",
    )(function* (input: {
      readonly delivery: NotificationDeliveryType;
      readonly jobId: string;
      readonly error: NotificationTransportFailure;
      readonly now: Date;
    }) {
      const outcome =
        input.error._tag === "NotificationTransportPermanent"
          ? "permanent"
          : input.error._tag === "NotificationTransportUnavailable"
            ? "unavailable"
            : "retryable";
      const retryAfter =
        input.error._tag === "NotificationTransportPermanent"
          ? undefined
          : input.error.retryAfter;
      const decision = deliveryFailureDecision({
        errorTag: input.error._tag,
        attempts: input.delivery.attempts,
        maxAttempts: input.delivery.maxAttempts,
        now: input.now,
        retryAfter,
        policy: retryPolicy,
      });

      yield* sql.withTransaction(
        Effect.gen(function* () {
          yield* sql`
            UPDATE notification_delivery_attempts
            SET
              outcome = ${outcome},
              error_message = ${input.error.message},
              retry_after = ${retryAfter ?? null},
              completed_at = ${input.now}
            WHERE delivery_id = ${input.delivery.id}
              AND job_id = ${input.jobId}
              AND outcome IS NULL
          `;
          yield* sql`
            UPDATE notification_deliveries
            SET
              status = ${decision.canRetry ? "retrying" : "failed"},
              attempts = ${decision.persistedAttempts},
              current_job_id = NULL,
              processing_at = NULL,
              error_message = ${input.error.message},
              scheduled_for = COALESCE(${decision.scheduledFor}, scheduled_for),
              failed_at = ${decision.canRetry ? null : input.now},
              updated_at = ${input.now}
            WHERE id = ${input.delivery.id}
              AND current_job_id = ${input.jobId}
              AND job_generation = ${input.delivery.jobGeneration}
          `;
        }),
      );
    });

    const processDelivery = Effect.fn("NotificationRuntime.processDelivery")(
      function* (
        job: {
          readonly _tag: "Delivery";
          readonly deliveryId: string;
          readonly generation: number;
          readonly attempt: number;
        },
        metadata: { readonly id: string; readonly attempts: number },
      ) {
        const now = yield* DateTime.nowAsDate;
        const rows = yield* sql`
          SELECT ${deliveryColumns(sql)}
          FROM notification_deliveries
          WHERE id = ${job.deliveryId}
          LIMIT 1
        `;
        const decoded = yield* decodeRows(
          "notification delivery",
          NotificationDelivery,
          rows,
        );
        const delivery = decoded.at(0);
        if (delivery === undefined) return;

        const decision = deliveryWorkDecision({
          now,
          jobId: metadata.id,
          job,
          state: delivery,
        });
        if (decision._tag === "Acknowledge") {
          yield* sql.withTransaction(
            Effect.gen(function* () {
              yield* markAttemptSkipped({
                deliveryId: delivery.id,
                jobId: metadata.id,
                reason: decision.reason,
                now,
              });
              if (decision.reason === "expired") {
                yield* sql`
                  UPDATE notification_deliveries
                  SET
                    status = 'cancelled',
                    current_job_id = NULL,
                    processing_at = NULL,
                    error_message = 'expired_before_delivery',
                    cancelled_at = ${now},
                    updated_at = ${now}
                  WHERE id = ${delivery.id}
                    AND current_job_id = ${metadata.id}
                    AND job_generation = ${job.generation}
                `;
              }
            }),
          );
          return;
        }

        const claimed = yield* sql.withTransaction(
          Effect.gen(function* () {
            const updated = yield* sql`
              UPDATE notification_deliveries
              SET
                status = 'processing',
                processing_at = COALESCE(processing_at, ${now}),
                last_attempt_at = ${now},
                updated_at = ${now}
              WHERE id = ${delivery.id}
                AND current_job_id = ${metadata.id}
                AND job_generation = ${job.generation}
                AND attempts = ${job.attempt}
                AND status IN ('queued', 'processing')
              RETURNING id
            `;
            if (updated.length > 0) {
              yield* sql`
                UPDATE notification_delivery_attempts
                SET started_at = COALESCE(started_at, ${now})
                WHERE delivery_id = ${delivery.id}
                  AND job_id = ${metadata.id}
                  AND outcome IS NULL
              `;
            }
            return updated.length > 0;
          }),
        );
        if (!claimed) {
          yield* markAttemptSkipped({
            deliveryId: delivery.id,
            jobId: metadata.id,
            reason: "stale",
            now,
          });
          return;
        }

        const transportInput = yield* Schema.decodeUnknownEffect(
          NotificationTransportInput,
        )({
          dispatchId: metadata.id,
          deliveryId: delivery.id,
          attempt: job.attempt,
          scope: delivery.scope,
          eventKey: delivery.eventKey,
          eventVersion: delivery.eventVersion,
          channel: delivery.channel,
          template: delivery.template,
          recipientAddress: canonicalRecipientAddress(
            delivery.channel,
            delivery.recipientAddress,
          ),
          recipientName: delivery.recipientName,
          payloadVersion: delivery.payloadVersion,
          payload: delivery.payload,
        }).pipe(
          Effect.mapError(
            (cause) =>
              new NotificationDataError({
                entity: "notification transport input",
                message: "Could not decode persisted transport payload",
                cause,
              }),
          ),
        );

        const dispatchCheckedAt = yield* DateTime.nowAsDate;
        const suppressionReason = yield* deliverySuppressionReason({
          delivery,
          now: dispatchCheckedAt,
        });
        if (suppressionReason !== null) {
          yield* sql.withTransaction(
            Effect.gen(function* () {
              yield* markAttemptSkipped({
                deliveryId: delivery.id,
                jobId: metadata.id,
                reason: "suppressed",
                now: dispatchCheckedAt,
              });
              yield* sql`
                UPDATE notification_deliveries
                SET
                  status = 'suppressed',
                  current_job_id = NULL,
                  processing_at = NULL,
                  error_message = ${suppressionReason},
                  suppressed_at = ${dispatchCheckedAt},
                  updated_at = ${dispatchCheckedAt}
                WHERE id = ${delivery.id}
                  AND current_job_id = ${metadata.id}
                  AND job_generation = ${job.generation}
              `;
            }),
          );
          return;
        }

        yield* registrySend(transports, transportInput).pipe(
          Effect.matchEffect({
            onFailure: (error) =>
              DateTime.nowAsDate.pipe(
                Effect.flatMap((completedAt) =>
                  persistDeliveryFailure({
                    delivery,
                    jobId: metadata.id,
                    error,
                    now: completedAt,
                  }),
                ),
              ),
            onSuccess: (result) =>
              DateTime.nowAsDate.pipe(
                Effect.flatMap((completedAt) =>
                  persistDeliverySuccess({
                    delivery,
                    jobId: metadata.id,
                    result,
                    now: completedAt,
                  }),
                ),
              ),
          }),
        );
      },
    );

    const persistReminderFailure = Effect.fn(
      "NotificationRuntime.persistReminderFailure",
    )(function* (input: {
      readonly reminder: NotificationReminderType;
      readonly jobId: string;
      readonly error: ReminderHandlerFailure;
      readonly now: Date;
    }) {
      const retryAfter =
        input.error._tag === "ReminderHandlerPermanent"
          ? undefined
          : input.error.retryAfter;
      const canRetry =
        input.error._tag !== "ReminderHandlerPermanent" &&
        input.reminder.attempts < input.reminder.maxAttempts;
      const scheduledFor = canRetry
        ? nextRetryAt(
            {
              now: input.now,
              attempt: input.reminder.attempts,
              retryAfter,
            },
            retryPolicy,
          )
        : null;
      yield* sql`
        UPDATE notification_reminders
        SET
          status = ${canRetry ? "retrying" : "failed"},
          current_job_id = NULL,
          last_error = ${input.error.message},
          scheduled_for = COALESCE(${scheduledFor}, scheduled_for),
          failed_at = ${canRetry ? null : input.now},
          updated_at = ${input.now}
        WHERE id = ${input.reminder.id}
          AND current_job_id = ${input.jobId}
          AND job_generation = ${input.reminder.jobGeneration}
      `;
    });

    const processReminder = Effect.fn("NotificationRuntime.processReminder")(
      function* (
        job: {
          readonly _tag: "Reminder";
          readonly reminderId: string;
          readonly generation: number;
          readonly attempt: number;
        },
        metadata: { readonly id: string; readonly attempts: number },
      ) {
        const now = yield* DateTime.nowAsDate;
        const rows = yield* sql`
          SELECT ${reminderColumns(sql)}
          FROM notification_reminders
          WHERE id = ${job.reminderId}
          LIMIT 1
        `;
        const decoded = yield* decodeRows(
          "notification reminder",
          NotificationReminder,
          rows,
        );
        const reminder = decoded.at(0);
        if (reminder === undefined) return;

        const decision = reminderWorkDecision({
          now,
          jobId: metadata.id,
          job,
          state: reminder,
        });
        if (decision._tag === "Acknowledge") {
          if (decision.reason === "expired") {
            yield* sql`
              UPDATE notification_reminders
              SET
                status = 'cancelled',
                current_job_id = NULL,
                last_error = 'expired_before_handler',
                cancelled_at = ${now},
                updated_at = ${now}
              WHERE id = ${reminder.id}
                AND current_job_id = ${metadata.id}
                AND job_generation = ${job.generation}
            `;
          }
          return;
        }

        const claimed = yield* sql`
          UPDATE notification_reminders
          SET
            status = 'processing',
            updated_at = ${now}
          WHERE id = ${reminder.id}
            AND current_job_id = ${metadata.id}
            AND job_generation = ${job.generation}
            AND attempts = ${job.attempt}
            AND status IN ('queued', 'processing')
          RETURNING id
        `;
        if (claimed.length === 0) return;

        const handlerInput = yield* Schema.decodeUnknownEffect(
          ReminderHandlerInput,
        )({
          reminderId: reminder.id,
          jobId: metadata.id,
          attempt: job.attempt,
          scope: reminder.scope,
          handlerKey: reminder.handlerKey,
          handlerVersion: reminder.handlerVersion,
          payload: reminder.payload,
        }).pipe(
          Effect.mapError(
            (cause) =>
              new NotificationDataError({
                entity: "reminder handler input",
                message: "Could not decode persisted reminder payload",
                cause,
              }),
          ),
        );

        yield* reminderHandlers
          .get(reminder.handlerKey, reminder.handlerVersion)
          .pipe(
            Effect.flatMap((handler) => handler.handle(handlerInput)),
            Effect.matchEffect({
              onFailure: (error) =>
                DateTime.nowAsDate.pipe(
                  Effect.flatMap((completedAt) =>
                    persistReminderFailure({
                      reminder,
                      jobId: metadata.id,
                      error,
                      now: completedAt,
                    }),
                  ),
                ),
              onSuccess: () =>
                DateTime.nowAsDate.pipe(
                  Effect.flatMap(
                    (completedAt) => sql`
                      UPDATE notification_reminders
                      SET
                        status = 'completed',
                        current_job_id = NULL,
                        last_error = NULL,
                        completed_at = ${completedAt},
                        updated_at = ${completedAt}
                      WHERE id = ${reminder.id}
                        AND current_job_id = ${metadata.id}
                        AND job_generation = ${reminder.jobGeneration}
                    `,
                  ),
                ),
            }),
          );
      },
    );

    const enqueueDue = Effect.fn("NotificationRuntime.enqueueDue")(
      function* (rawInput: EnqueueDueInput = { limit: dueBatchSize }) {
        const input = yield* Schema.decodeUnknownEffect(EnqueueDueInput)(
          rawInput,
        ).pipe(
          Effect.mapError(
            (cause) =>
              new NotificationDataError({
                entity: "enqueue due input",
                message: "Invalid enqueueDue input",
                cause,
              }),
          ),
        );
        const now = yield* DateTime.nowAsDate;
        const queueLockCutoff = new Date(
          now.getTime() - NOTIFICATION_QUEUE_LOCK_EXPIRATION_MILLIS,
        );

        return yield* sql.withTransaction(
          Effect.gen(function* () {
            const reconciledDeliveryRows = yield* sql`
              SELECT
                ${deliveryColumns(sql, "d")},
                CASE
                  WHEN q.sequence IS NULL THEN NULL
                  ELSE jsonb_build_object(
                    'completed', q.completed,
                    'attempts', q.attempts,
                    'acquiredAt', q.acquired_at
                  )
                END AS queue
              FROM notification_deliveries d
              LEFT JOIN ${notificationQueueTable} q
                ON q.id = d.current_job_id::text
                AND q.queue_name = ${DELIVERY_QUEUE_NAME}
              WHERE d.current_job_id IS NOT NULL
                AND d.status IN ('queued', 'processing')
                AND (
                  q.sequence IS NULL
                  OR (
                    (q.completed = TRUE OR q.attempts >= ${queueMaxAttempts})
                    AND (
                      q.acquired_at IS NULL
                      OR q.acquired_at < ${queueLockCutoff}
                    )
                  )
                )
              ORDER BY d.updated_at ASC, d.id ASC
              LIMIT ${input.limit}
              FOR UPDATE OF d SKIP LOCKED
            `;
            const reconciledDeliveries = yield* decodeRows(
              "reconcilable notification deliveries",
              NotificationDelivery,
              reconciledDeliveryRows,
            );
            const deliveryQueueObservations = yield* decodeRows(
              "notification delivery queue observations",
              QueueReconciliationObservation,
              reconciledDeliveryRows,
            );
            let reconciledDeliveryCount = 0;
            for (const [index, delivery] of reconciledDeliveries.entries()) {
              const currentJobId = delivery.currentJobId;
              const observation = deliveryQueueObservations.at(index);
              if (currentJobId === null || observation === undefined) continue;
              const decision = queueReconciliationDecision({
                now,
                lockExpirationMillis: NOTIFICATION_QUEUE_LOCK_EXPIRATION_MILLIS,
                queueMaxAttempts,
                applicationAttempts: delivery.attempts,
                applicationMaxAttempts: delivery.maxAttempts,
                queue: observation.queue,
              });
              if (decision === "keep") continue;
              yield* markAttemptSkipped({
                deliveryId: delivery.id,
                jobId: currentJobId,
                reason: "stale",
                now,
              });
              yield* sql`
                UPDATE notification_deliveries
                SET
                  status = ${decision === "retry" ? "retrying" : "failed"},
                  current_job_id = NULL,
                  queued_at = NULL,
                  processing_at = NULL,
                  claimed_by = NULL,
                  lease_expires_at = NULL,
                  error_message = ${
                    decision === "retry"
                      ? "queue_job_reconciled"
                      : "application_attempt_budget_exhausted"
                  },
                  scheduled_for = ${
                    decision === "retry" ? now : delivery.scheduledFor
                  },
                  failed_at = ${decision === "fail" ? now : null},
                  updated_at = ${now}
                WHERE id = ${delivery.id}
                  AND current_job_id = ${currentJobId}
              `;
              reconciledDeliveryCount += 1;
            }

            const reconciledReminderRows = yield* sql`
              SELECT
                ${reminderColumns(sql, "r")},
                CASE
                  WHEN q.sequence IS NULL THEN NULL
                  ELSE jsonb_build_object(
                    'completed', q.completed,
                    'attempts', q.attempts,
                    'acquiredAt', q.acquired_at
                  )
                END AS queue
              FROM notification_reminders r
              LEFT JOIN ${notificationQueueTable} q
                ON q.id = r.current_job_id::text
                AND q.queue_name = ${REMINDER_QUEUE_NAME}
              WHERE r.current_job_id IS NOT NULL
                AND r.status IN ('queued', 'processing')
                AND (
                  q.sequence IS NULL
                  OR (
                    (q.completed = TRUE OR q.attempts >= ${queueMaxAttempts})
                    AND (
                      q.acquired_at IS NULL
                      OR q.acquired_at < ${queueLockCutoff}
                    )
                  )
                )
              ORDER BY r.updated_at ASC, r.id ASC
              LIMIT ${input.limit}
              FOR UPDATE OF r SKIP LOCKED
            `;
            const reconciledReminders = yield* decodeRows(
              "reconcilable notification reminders",
              NotificationReminder,
              reconciledReminderRows,
            );
            const reminderQueueObservations = yield* decodeRows(
              "notification reminder queue observations",
              QueueReconciliationObservation,
              reconciledReminderRows,
            );
            let reconciledReminderCount = 0;
            for (const [index, reminder] of reconciledReminders.entries()) {
              const currentJobId = reminder.currentJobId;
              const observation = reminderQueueObservations.at(index);
              if (currentJobId === null || observation === undefined) continue;
              const decision = queueReconciliationDecision({
                now,
                lockExpirationMillis: NOTIFICATION_QUEUE_LOCK_EXPIRATION_MILLIS,
                queueMaxAttempts,
                applicationAttempts: reminder.attempts,
                applicationMaxAttempts: reminder.maxAttempts,
                queue: observation.queue,
              });
              if (decision === "keep") continue;
              yield* sql`
                UPDATE notification_reminders
                SET
                  status = ${decision === "retry" ? "retrying" : "failed"},
                  current_job_id = NULL,
                  queued_at = NULL,
                  last_error = ${
                    decision === "retry"
                      ? "queue_job_reconciled"
                      : "application_attempt_budget_exhausted"
                  },
                  scheduled_for = ${
                    decision === "retry" ? now : reminder.scheduledFor
                  },
                  failed_at = ${decision === "fail" ? now : null},
                  updated_at = ${now}
                WHERE id = ${reminder.id}
                  AND current_job_id = ${currentJobId}
              `;
              reconciledReminderCount += 1;
            }

            const deliveryRows = yield* sql`
              SELECT ${deliveryColumns(sql)}
              FROM notification_deliveries
              WHERE status IN ('queued', 'retrying')
                AND current_job_id IS NULL
                AND (claimed_by IS NULL OR lease_expires_at <= ${now})
                AND scheduled_for <= ${now}
                AND attempts < max_attempts
              ORDER BY scheduled_for ASC, id ASC
              LIMIT ${input.limit}
              FOR UPDATE SKIP LOCKED
            `;
            const deliveries = yield* decodeRows(
              "due notification deliveries",
              NotificationDelivery,
              deliveryRows,
            );
            let enqueuedDeliveries = 0;
            let expiredDeliveries = 0;
            for (const delivery of deliveries) {
              if (
                delivery.expiresAt !== null &&
                delivery.expiresAt.getTime() <= now.getTime()
              ) {
                yield* sql`
                  UPDATE notification_deliveries
                  SET
                    status = 'cancelled',
                    error_message = 'expired_before_enqueue',
                    cancelled_at = ${now},
                    updated_at = ${now}
                  WHERE id = ${delivery.id}
                    AND current_job_id IS NULL
                `;
                expiredDeliveries += 1;
                continue;
              }
              yield* allocateDeliveryJob({
                sql,
                queues,
                deliveryId: delivery.id,
                attempts: delivery.attempts,
                jobGeneration: delivery.jobGeneration,
                now,
              });
              enqueuedDeliveries += 1;
            }

            const reminderRows = yield* sql`
              SELECT ${reminderColumns(sql)}
              FROM notification_reminders
              WHERE status IN ('scheduled', 'retrying')
                AND current_job_id IS NULL
                AND scheduled_for <= ${now}
                AND attempts < max_attempts
              ORDER BY scheduled_for ASC, id ASC
              LIMIT ${input.limit}
              FOR UPDATE SKIP LOCKED
            `;
            const reminders = yield* decodeRows(
              "due notification reminders",
              NotificationReminder,
              reminderRows,
            );
            let enqueuedReminders = 0;
            let expiredReminders = 0;
            for (const reminder of reminders) {
              if (
                reminder.expiresAt !== null &&
                reminder.expiresAt.getTime() <= now.getTime()
              ) {
                yield* sql`
                  UPDATE notification_reminders
                  SET
                    status = 'cancelled',
                    last_error = 'expired_before_enqueue',
                    cancelled_at = ${now},
                    updated_at = ${now}
                  WHERE id = ${reminder.id}
                    AND current_job_id IS NULL
                `;
                expiredReminders += 1;
                continue;
              }
              yield* allocateReminderJob({
                sql,
                queues,
                reminderId: reminder.id,
                attempts: reminder.attempts,
                jobGeneration: reminder.jobGeneration,
                now,
              });
              enqueuedReminders += 1;
            }

            return {
              reconciledDeliveries: reconciledDeliveryCount,
              reconciledReminders: reconciledReminderCount,
              deliveries: enqueuedDeliveries,
              reminders: enqueuedReminders,
              expiredDeliveries,
              expiredReminders,
            };
          }),
        );
      },
      Effect.catchTag("SqlError", (cause) =>
        Effect.fail(storageError("enqueueDue", cause)),
      ),
    );

    const runDeliveryWorkerOnce = queues.deliveries
      .take(processDelivery, { maxAttempts: queueMaxAttempts })
      .pipe(
        Effect.mapError(
          (cause) =>
            new NotificationQueueError({
              operation: "runDeliveryWorkerOnce",
              message: "Notification delivery queue iteration failed",
              cause,
            }),
        ),
      );

    const runReminderWorkerOnce = queues.reminders
      .take(processReminder, { maxAttempts: queueMaxAttempts })
      .pipe(
        Effect.mapError(
          (cause) =>
            new NotificationQueueError({
              operation: "runReminderWorkerOnce",
              message: "Notification reminder queue iteration failed",
              cause,
            }),
        ),
      );

    const runDeliveryWorker = Effect.forever(
      runDeliveryWorkerOnce.pipe(
        Effect.catchCause((cause) =>
          Cause.hasInterruptsOnly(cause)
            ? Effect.interrupt
            : Effect.logError(
                "Notification delivery worker iteration failed",
              ).pipe(Effect.andThen(Effect.sleep(1_000))),
        ),
      ),
    );

    const runReminderWorker = Effect.forever(
      runReminderWorkerOnce.pipe(
        Effect.catchCause((cause) =>
          Cause.hasInterruptsOnly(cause)
            ? Effect.interrupt
            : Effect.logError(
                "Notification reminder worker iteration failed",
              ).pipe(Effect.andThen(Effect.sleep(1_000))),
        ),
      ),
    );

    const runScheduler = Effect.forever(
      enqueueDue().pipe(
        Effect.catchCause((cause) =>
          Cause.hasInterruptsOnly(cause)
            ? Effect.interrupt
            : Effect.logError("Notification scheduler iteration failed"),
        ),
        Effect.andThen(Effect.sleep(schedulerIntervalMillis)),
      ),
    );

    return {
      enqueueDue,
      runDeliveryWorkerOnce,
      runReminderWorkerOnce,
      runDeliveryWorker,
      runReminderWorker,
      runScheduler,
    } satisfies NotificationRuntimeContract;
  });

const registrySend = (
  registry: NotificationTransportRegistryContract,
  input: NotificationTransportInput,
): Effect.Effect<NotificationTransportResult, NotificationTransportFailure> =>
  registry
    .get(input.channel)
    .pipe(Effect.flatMap((transport) => transport.send(input)));

export class NotificationRuntime extends Context.Service<
  NotificationRuntime,
  NotificationRuntimeContract
>()("@krak-stack/notifications/NotificationRuntime") {
  static readonly makeLayer = (options: NotificationRuntimeOptions = {}) =>
    Layer.effect(this, makeNotificationRuntime(options)).pipe(
      Layer.provide(notificationQueueLayer),
    );

  static readonly layer = this.makeLayer();
}

export const enqueueDue = (input?: EnqueueDueInput) =>
  NotificationRuntime.use((runtime) => runtime.enqueueDue(input));

export const runDeliveryWorker = NotificationRuntime.use(
  (runtime) => runtime.runDeliveryWorker,
);

export const runDeliveryWorkerOnce = NotificationRuntime.use(
  (runtime) => runtime.runDeliveryWorkerOnce,
);

export const runReminderWorker = NotificationRuntime.use(
  (runtime) => runtime.runReminderWorker,
);

export const runReminderWorkerOnce = NotificationRuntime.use(
  (runtime) => runtime.runReminderWorkerOnce,
);

export const runScheduler = NotificationRuntime.use(
  (runtime) => runtime.runScheduler,
);

export const deliveryWorkerLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const runtime = yield* NotificationRuntime;
    yield* Effect.forkScoped(runtime.runDeliveryWorker);
  }),
);

export const reminderWorkerLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const runtime = yield* NotificationRuntime;
    yield* Effect.forkScoped(runtime.runReminderWorker);
  }),
);

export const schedulerLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const runtime = yield* NotificationRuntime;
    yield* Effect.forkScoped(runtime.runScheduler);
  }),
);

export const notificationWorkersLayer = Layer.mergeAll(
  deliveryWorkerLayer,
  reminderWorkerLayer,
  schedulerLayer,
);

export {
  deliveryWorkDecision,
  queueReconciliationDecision,
  reminderWorkDecision,
};

export {
  EnqueueDueInput,
  EnqueueDueResult,
  NotificationRuntimeOptions,
  ReminderHandlerConfigurationError,
  ReminderHandlerInput,
  ReminderHandlerPermanent,
  ReminderHandlerRetryable,
  ReminderHandlerUnavailable,
  RetryPolicy,
} from "./schema.js";
export type { ReminderHandlerFailure } from "./schema.js";
