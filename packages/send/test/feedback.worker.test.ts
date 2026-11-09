import { describe, expect, it } from "@effect/vitest";
import { Deferred, Effect } from "effect";
import * as TestClock from "effect/testing/TestClock";
import { SendFeedback, feedbackReconciliationLayer } from "../src/feedback.js";
import { SendStorageError } from "../src/schema.js";

describe("feedback reconciliation lifecycle", () => {
  it.effect("retries a failed batch and stops when its host scope closes", () =>
    Effect.gen(function* () {
      const started = yield* Deferred.make<void>();
      const retried = yield* Deferred.make<void>();
      let attempts = 0;
      const feedback = SendFeedback.of({
        record: () => Effect.die(new Error("Unexpected operation")),
        reconcile: () =>
          Effect.suspend(() => {
            attempts++;
            return attempts === 1
              ? Deferred.succeed(started, undefined).pipe(
                  Effect.andThen(
                    Effect.fail(
                      new SendStorageError({ message: "temporary outage" }),
                    ),
                  ),
                )
              : Deferred.succeed(retried, undefined).pipe(
                  Effect.as({ checked: 0, applied: 0, pending: 0 }),
                );
          }),
      });
      yield* Effect.gen(function* () {
        yield* Deferred.await(started);
        yield* TestClock.adjust("30 seconds");
        yield* Deferred.await(retried);
        expect(attempts).toBe(2);
      }).pipe(
        Effect.provide(feedbackReconciliationLayer),
        Effect.provideService(SendFeedback, feedback),
        Effect.scoped,
      );
      yield* TestClock.adjust("30 seconds");
      expect(attempts).toBe(2);
    }),
  );
});
