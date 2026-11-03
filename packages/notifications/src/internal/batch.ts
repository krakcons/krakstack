import { Clock, Deferred, Effect, Fiber, Schema } from "effect";

import {
  NotificationBatchOptions,
  NotificationBatchTimeoutError,
  NotificationDataError,
  type NotificationBatchResult,
} from "../schema.js";

export type DeliveryBatchOutcome =
  | "sent"
  | "retrying"
  | "failed"
  | "suppressed"
  | "skipped";

// The start gate closes before interrupting an idle take. A provider call that
// already started is joined, not cancelled by the empty-queue timeout.
export const takeBatchJob = <A, E>(
  take: (start: Effect.Effect<boolean>) => Effect.Effect<A, E>,
  idleMillis: number,
) =>
  Effect.scoped(
    Effect.gen(function* () {
      const started = yield* Deferred.make<void>();
      let closed = false;
      let claimed = false;
      const start = Effect.suspend(() => {
        if (closed) return Effect.succeed(false);
        claimed = true;
        return Deferred.succeed(started, undefined).pipe(Effect.as(true));
      });
      const fiber = yield* take(start).pipe(Effect.forkScoped);
      yield* Effect.raceFirst(Fiber.join(fiber), Deferred.await(started)).pipe(
        Effect.timeoutOrElse({
          duration: idleMillis,
          orElse: () => Effect.void,
        }),
      );
      closed = true;
      if (!claimed) {
        yield* Fiber.interrupt(fiber);
        return undefined;
      }
      return yield* Fiber.join(fiber);
    }),
  );

export const makeBatchRunner =
  <E>(workers: {
    readonly enqueueDue: Effect.Effect<unknown, E>;
    readonly delivery: (
      start: Effect.Effect<boolean>,
    ) => Effect.Effect<DeliveryBatchOutcome, E>;
    readonly reminder: (
      start: Effect.Effect<boolean>,
    ) => Effect.Effect<void, E>;
  }) =>
  (input: NotificationBatchOptions = {}) =>
    Effect.gen(function* () {
      const options = yield* Schema.decodeEffect(NotificationBatchOptions)(
        input,
      ).pipe(
        Effect.mapError(
          (cause) =>
            new NotificationDataError({
              entity: "notification batch options",
              message: "Invalid notification batch options",
              cause,
            }),
        ),
      );
      const passes = options.passes ?? 2;
      const intervalMillis = options.intervalMillis ?? 30_000;
      const maxRunMillis = options.maxRunMillis ?? 50_000;
      const shutdownGraceMillis = options.shutdownGraceMillis ?? 10_000;
      const idleMillis = options.idleMillis ?? 2_000;
      const startedAt = yield* Clock.currentTimeMillis;
      const deadline = startedAt + maxRunMillis;
      const outcomes = {
        sent: 0,
        retrying: 0,
        failed: 0,
        suppressed: 0,
        skipped: 0,
      };
      let completedPasses = 0;
      let completedReminderJobs = 0;

      const drain = <A>(
        take: (start: Effect.Effect<boolean>) => Effect.Effect<A, E>,
        completed: (value: A) => void,
      ) =>
        Effect.gen(function* () {
          while (true) {
            const remaining = deadline - (yield* Clock.currentTimeMillis);
            if (remaining <= 0) return;
            const result = yield* takeBatchJob(
              (start) => take(start).pipe(Effect.map((value) => ({ value }))),
              Math.min(idleMillis, remaining),
            );
            if (result === undefined) return;
            completed(result.value);
          }
        });

      const run = Effect.gen(function* () {
        for (let pass = 0; pass < passes; pass++) {
          const delay =
            startedAt +
            pass * intervalMillis -
            (yield* Clock.currentTimeMillis);
          if (delay > 0)
            yield* Effect.sleep(
              Math.min(
                delay,
                Math.max(0, deadline - (yield* Clock.currentTimeMillis)),
              ),
            );
          if ((yield* Clock.currentTimeMillis) >= deadline) break;
          yield* Effect.logInfo("Starting notification batch pass", {
            pass: pass + 1,
          });
          yield* workers.enqueueDue;
          yield* Effect.all(
            [
              ...Array.from({ length: options.deliveryConcurrency ?? 1 }, () =>
                drain(workers.delivery, (outcome) => {
                  outcomes[outcome]++;
                }),
              ),
              drain(workers.reminder, () => {
                completedReminderJobs++;
              }),
            ],
            { concurrency: "unbounded", discard: true },
          );
          completedPasses++;
        }
        const elapsedMillis = (yield* Clock.currentTimeMillis) - startedAt;
        return {
          passes: completedPasses,
          elapsedMillis,
          deliveries: outcomes,
          completedReminderJobs,
          stopReason:
            elapsedMillis >= maxRunMillis ? "time-limit" : "completed",
        } satisfies NotificationBatchResult;
      });
      return yield* run.pipe(
        Effect.timeoutOrElse({
          duration: maxRunMillis + shutdownGraceMillis,
          orElse: () =>
            Effect.fail(
              new NotificationBatchTimeoutError({
                message:
                  "Notification batch exceeded its runtime and shutdown grace; unfinished jobs remain recoverable",
              }),
            ),
        }),
      );
    });
