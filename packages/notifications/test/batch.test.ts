import { describe, expect, it } from "@effect/vitest";
import { Clock, Effect, Fiber } from "effect";
import { TestClock } from "effect/testing";

import { makeBatchRunner, takeBatchJob } from "../src/internal/batch.js";

describe("notification batch runner", () => {
  it.effect("runs two passes 30 seconds apart and exits on empty queues", () =>
    Effect.gen(function* () {
      const times: number[] = [];
      const runBatch = makeBatchRunner({
        enqueueDue: Clock.currentTimeMillis.pipe(
          Effect.map((now) => {
            times.push(now);
          }),
        ),
        delivery: () => Effect.never,
        reminder: () => Effect.never,
      });
      const fiber = yield* runBatch().pipe(Effect.forkChild);
      yield* TestClock.adjust(32_000);
      const result = yield* Fiber.join(fiber);
      expect(times).toEqual([0, 30_000]);
      expect(result.passes).toBe(2);
      expect(result.deliveries.sent).toBe(0);
      expect(result.stopReason).toBe("completed");
    }),
  );

  it.effect("idle timeout never interrupts an acquired provider call", () =>
    Effect.gen(function* () {
      let finished = false;
      const fiber = yield* takeBatchJob(
        (start) =>
          Effect.gen(function* () {
            expect(yield* start).toBe(true);
            yield* Effect.sleep(5_000);
            finished = true;
            return "sent";
          }),
        100,
      ).pipe(Effect.forkChild);
      yield* TestClock.adjust(5_000);
      expect(yield* Fiber.join(fiber)).toBe("sent");
      expect(finished).toBe(true);
    }),
  );

  it.effect("counts outcomes and does not claim work after the deadline", () =>
    Effect.gen(function* () {
      let claims = 0;
      const runBatch = makeBatchRunner({
        enqueueDue: Effect.void,
        delivery: (start) =>
          Effect.gen(function* () {
            if (!(yield* start)) return yield* Effect.interrupt;
            claims++;
            yield* Effect.sleep(6_000);
            return "retrying" as const;
          }),
        reminder: () => Effect.never,
      });
      const fiber = yield* runBatch({ maxRunMillis: 5_000 }).pipe(
        Effect.forkChild,
      );
      yield* TestClock.adjust(6_000);
      const result = yield* Fiber.join(fiber);
      expect(claims).toBe(1);
      expect(result.deliveries.retrying).toBe(1);
      expect(result.stopReason).toBe("time-limit");
    }),
  );

  it.effect(
    "fails after shutdown grace rather than hiding a hung provider",
    () =>
      Effect.gen(function* () {
        const runBatch = makeBatchRunner({
          enqueueDue: Effect.void,
          delivery: (start) => Effect.flatMap(start, () => Effect.never),
          reminder: () => Effect.never,
        });
        const fiber = yield* runBatch({
          maxRunMillis: 100,
          shutdownGraceMillis: 100,
        }).pipe(Effect.result, Effect.forkChild);
        yield* TestClock.adjust(200);
        expect(yield* Fiber.join(fiber)).toMatchObject({
          _tag: "Failure",
          failure: { _tag: "NotificationBatchTimeoutError" },
        });
      }),
  );

  it.effect("rejects invalid options before enqueueing", () =>
    Effect.gen(function* () {
      let enqueued = false;
      const runBatch = makeBatchRunner({
        enqueueDue: Effect.sync(() => {
          enqueued = true;
        }),
        delivery: () => Effect.never,
        reminder: () => Effect.never,
      });
      const result = yield* runBatch({ passes: 0 }).pipe(Effect.result);
      expect(result._tag).toBe("Failure");
      expect(enqueued).toBe(false);
    }),
  );
});
