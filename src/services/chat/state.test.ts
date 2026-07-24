import { describe, expect, it } from "@effect/vitest";

import { reduceChatEvent, type ChatState } from "@/services/chat/state";

const initial: ChatState = {
  messages: [],
  pending: true,
};

describe("chat client state", () => {
  it("reduces streamed message and approval events", () => {
    const started = reduceChatEvent(initial, {
      type: "message-start",
      messageId: "message-1",
    });
    const called = reduceChatEvent(started, {
      type: "tool-call",
      messageId: "message-1",
      toolCallId: "tool-1",
      name: "courses_deleteCourse",
      input: { id: "course-1" },
      metadata: {
        destructive: true,
      },
    });
    const approval = reduceChatEvent(called, {
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
    const started = reduceChatEvent(initial, {
      type: "message-start",
      messageId: "message-1",
    });
    const first = reduceChatEvent(started, {
      type: "text-delta",
      messageId: "message-1",
      delta: "Hello ",
    });
    const second = reduceChatEvent(first, {
      type: "text-delta",
      messageId: "message-1",
      delta: "there",
    });
    const withHistory = reduceChatEvent(second, {
      type: "history",
      value: "chat-state",
    });

    expect(withHistory.messages[0]?.text).toBe("Hello there");
    expect(withHistory.history).toBe("chat-state");
  });

  it("removes an empty assistant placeholder when streaming fails", () => {
    const started = reduceChatEvent(initial, {
      type: "message-start",
      messageId: "message-1",
    });
    const failed = reduceChatEvent(started, {
      type: "error",
      code: "stream-failed",
    });

    expect(failed.messages).toEqual([]);
    expect(failed.error).toBe("stream-failed");
  });
});
