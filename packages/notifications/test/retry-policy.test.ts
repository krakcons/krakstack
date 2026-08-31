import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";

import {
  deliveryFailureDecision,
  nextRetryAt,
  NotificationRuntimeOptions,
  queueReconciliationDecision,
} from "../src/runtime.js";

describe("notification retry policy", () => {
  it("uses bounded exponential delays", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const policy = { baseDelayMillis: 1_000, maxDelayMillis: 8_000 };

    expect(nextRetryAt({ now, attempt: 1 }, policy).getTime()).toBe(
      now.getTime() + 1_000,
    );
    expect(nextRetryAt({ now, attempt: 4 }, policy).getTime()).toBe(
      now.getTime() + 8_000,
    );
    expect(nextRetryAt({ now, attempt: 20 }, policy).getTime()).toBe(
      now.getTime() + 8_000,
    );
  });

  it("honors a provider retry-after lower bound", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const retryAfter = new Date(now.getTime() + 60_000);

    expect(
      nextRetryAt(
        { now, attempt: 1, retryAfter },
        { baseDelayMillis: 1_000, maxDelayMillis: 8_000 },
      ),
    ).toEqual(retryAfter);
  });

  it("bounds transport failures by the application attempt budget", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const unavailableBelowBudget = deliveryFailureDecision({
      errorTag: "NotificationTransportUnavailable",
      attempts: 1,
      maxAttempts: 2,
      now,
      policy: { baseDelayMillis: 1_000, maxDelayMillis: 8_000 },
    });
    const unavailableAtBudget = deliveryFailureDecision({
      errorTag: "NotificationTransportUnavailable",
      attempts: 2,
      maxAttempts: 2,
      now,
      policy: { baseDelayMillis: 1_000, maxDelayMillis: 8_000 },
    });
    const retryable = deliveryFailureDecision({
      errorTag: "NotificationTransportRetryable",
      attempts: 1,
      maxAttempts: 1,
      now,
      policy: { baseDelayMillis: 1_000, maxDelayMillis: 8_000 },
    });

    expect(unavailableBelowBudget.canRetry).toBe(true);
    expect(unavailableBelowBudget.persistedAttempts).toBe(1);
    expect(unavailableAtBudget.canRetry).toBe(false);
    expect(unavailableAtBudget.persistedAttempts).toBe(2);
    expect(retryable.canRetry).toBe(false);
    expect(retryable.persistedAttempts).toBe(1);
  });

  it("keeps ordinary backlog and fresh Effect locks", () => {
    const now = new Date("2026-01-01T00:10:00.000Z");
    expect(
      queueReconciliationDecision({
        now,
        lockExpirationMillis: 120_000,
        queueMaxAttempts: 10,
        applicationAttempts: 1,
        applicationMaxAttempts: 5,
        queue: { completed: false, attempts: 0, acquiredAt: null },
      }),
    ).toBe("keep");
    expect(
      queueReconciliationDecision({
        now,
        lockExpirationMillis: 120_000,
        queueMaxAttempts: 10,
        applicationAttempts: 1,
        applicationMaxAttempts: 5,
        queue: {
          completed: true,
          attempts: 1,
          acquiredAt: new Date("2026-01-01T00:09:00.000Z"),
        },
      }),
    ).toBe("keep");
  });

  it("retries only missing, completed, or exhausted queue jobs", () => {
    const base = {
      now: new Date("2026-01-01T00:10:00.000Z"),
      lockExpirationMillis: 120_000,
      queueMaxAttempts: 10,
      applicationAttempts: 2,
      applicationMaxAttempts: 5,
    };

    expect(queueReconciliationDecision({ ...base, queue: null })).toBe("retry");
    expect(
      queueReconciliationDecision({
        ...base,
        queue: { completed: true, attempts: 1, acquiredAt: null },
      }),
    ).toBe("retry");
    expect(
      queueReconciliationDecision({
        ...base,
        queue: { completed: false, attempts: 10, acquiredAt: null },
      }),
    ).toBe("retry");
  });

  it("fails reconciliation when the application budget is exhausted", () => {
    expect(
      queueReconciliationDecision({
        now: new Date("2026-01-01T00:10:00.000Z"),
        lockExpirationMillis: 120_000,
        queueMaxAttempts: 10,
        applicationAttempts: 5,
        applicationMaxAttempts: 5,
        queue: null,
      }),
    ).toBe("fail");
  });

  it.effect("rejects non-positive scheduler durations", () =>
    Effect.gen(function* () {
      const result = yield* Schema.decodeUnknownEffect(
        NotificationRuntimeOptions,
      )({
        schedulerIntervalMillis: 0,
      }).pipe(Effect.exit);

      expect(result._tag).toBe("Failure");
    }),
  );
});
