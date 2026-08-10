import { describe, expect, it } from "@effect/vitest";

import {
  reduceAgentEvent,
  type AgentState,
} from "@/services/agent/client/atom";

const initial: AgentState = {
  messages: [],
  pending: true,
};

describe("agent client state", () => {
  it("reduces streamed message and approval events", () => {
    const started = reduceAgentEvent(initial, {
      type: "message-start",
      messageId: "message-1",
    });
    const called = reduceAgentEvent(started, {
      type: "tool-call",
      messageId: "message-1",
      toolCallId: "tool-1",
      name: "courses_deleteCourse",
      input: { id: "course-1" },
      metadata: { destructive: true },
    });
    const approval = reduceAgentEvent(called, {
      type: "approval-required",
      approvalId: "approval-1",
      toolCallId: "tool-1",
    });

    expect(approval.messages[0]?.tools[0]).toMatchObject({
      toolCallId: "tool-1",
      approvalId: "approval-1",
      status: "approval-required",
    });
  });

  it("appends deltas and stores in-memory history", () => {
    const started = reduceAgentEvent(initial, {
      type: "message-start",
      messageId: "message-1",
    });
    const first = reduceAgentEvent(started, {
      type: "text-delta",
      messageId: "message-1",
      delta: "Hello ",
    });
    const second = reduceAgentEvent(first, {
      type: "text-delta",
      messageId: "message-1",
      delta: "there",
    });
    const withHistory = reduceAgentEvent(second, {
      type: "history",
      value: "agent-state",
    });

    expect(withHistory.messages[0]?.text).toBe("Hello there");
    expect(withHistory.history).toBe("agent-state");
  });

  it("removes an empty assistant placeholder when streaming fails", () => {
    const started = reduceAgentEvent(initial, {
      type: "message-start",
      messageId: "message-1",
    });
    const failed = reduceAgentEvent(started, {
      type: "error",
      code: "stream-failed",
    });

    expect(failed.messages).toEqual([]);
    expect(failed.error).toBe("stream-failed");
  });
});
