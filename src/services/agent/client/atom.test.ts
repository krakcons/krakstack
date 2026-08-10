import { describe, expect, it } from "@effect/vitest";
import { Effect, Stream } from "effect";
import { AtomRegistry } from "effect/unstable/reactivity";

import {
  makeAgentAtoms,
  reduceAgentEvent,
  type AgentState,
} from "@/services/agent/client/atom";

const initial: AgentState = {
  context: undefined,
  contextLocked: false,
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

  it("locks the first conversation context until removal", () => {
    const atoms = makeAgentAtoms<{ readonly id: string }>({
      stream: () => Effect.succeed(Stream.empty),
    });
    const registry = AtomRegistry.make();
    const scope = "organization-1";

    registry.set(atoms.submit, {
      action: { type: "message", text: "First" },
      context: {
        key: "course:course-1",
        label: "First course",
        resource: { id: "course-1" },
      },
      scope,
    });
    registry.set(atoms.submit, {
      action: { type: "message", text: "Second" },
      context: {
        key: "course:course-2",
        label: "Second course",
        resource: { id: "course-2" },
      },
      scope,
    });

    expect(registry.get(atoms.state(scope)).context?.key).toBe(
      "course:course-1",
    );

    registry.set(atoms.removeContext, scope);
    expect(registry.get(atoms.state(scope)).context).toBeUndefined();
  });
});
