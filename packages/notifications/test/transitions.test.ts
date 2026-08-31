import { describe, expect, it } from "@effect/vitest";

import { deliveryWorkDecision, reminderWorkDecision } from "../src/runtime.js";
import type { DeliveryQueueJob, ReminderQueueJob } from "../src/schema.js";

const deliveryJob: DeliveryQueueJob = {
  _tag: "Delivery",
  deliveryId: "00000000-0000-4000-8000-000000000001",
  generation: 2,
  attempt: 3,
};

const reminderJob: ReminderQueueJob = {
  _tag: "Reminder",
  reminderId: "00000000-0000-4000-8000-000000000002",
  generation: 4,
  attempt: 1,
};

describe("queue transition guards", () => {
  it("processes only the current delivery generation, job, and attempt", () => {
    const process = deliveryWorkDecision({
      now: new Date("2026-01-01T00:00:00.000Z"),
      jobId: "00000000-0000-4000-8000-000000000003",
      job: deliveryJob,
      state: {
        status: "queued",
        currentJobId: "00000000-0000-4000-8000-000000000003",
        jobGeneration: 2,
        attempts: 3,
        expiresAt: null,
      },
    });
    const stale = deliveryWorkDecision({
      now: new Date("2026-01-01T00:00:00.000Z"),
      jobId: "00000000-0000-4000-8000-000000000003",
      job: deliveryJob,
      state: {
        status: "queued",
        currentJobId: "00000000-0000-4000-8000-000000000003",
        jobGeneration: 3,
        attempts: 3,
        expiresAt: null,
      },
    });

    expect(process).toEqual({ _tag: "Process" });
    expect(stale).toEqual({ _tag: "Acknowledge", reason: "stale" });
  });

  it("acknowledges terminal and expired delivery work without sending", () => {
    const terminal = deliveryWorkDecision({
      now: new Date("2026-01-01T00:00:00.000Z"),
      jobId: "job-1",
      job: deliveryJob,
      state: {
        status: "sent",
        currentJobId: "job-1",
        jobGeneration: 2,
        attempts: 3,
        expiresAt: null,
      },
    });
    const expired = deliveryWorkDecision({
      now: new Date("2026-01-01T00:00:00.000Z"),
      jobId: "job-1",
      job: deliveryJob,
      state: {
        status: "queued",
        currentJobId: "job-1",
        jobGeneration: 2,
        attempts: 3,
        expiresAt: new Date("2025-12-31T23:59:59.000Z"),
      },
    });

    expect(terminal).toEqual({
      _tag: "Acknowledge",
      reason: "terminal",
    });
    expect(expired).toEqual({ _tag: "Acknowledge", reason: "expired" });
  });

  it("applies the same generation guard to reminder jobs", () => {
    const stale = reminderWorkDecision({
      now: new Date("2026-01-01T00:00:00.000Z"),
      jobId: "job-2",
      job: reminderJob,
      state: {
        status: "queued",
        currentJobId: "job-2",
        jobGeneration: 4,
        attempts: 2,
        expiresAt: null,
      },
    });

    expect(stale).toEqual({ _tag: "Acknowledge", reason: "stale" });
  });
});
