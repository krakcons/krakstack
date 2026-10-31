// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { initialAgentState } from "./atom";
import { AgentWidget, agentWidgetMessages } from "./widget";

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  vi.stubGlobal(
    "ResizeObserver",
    class {
      disconnect() {}
      observe() {}
      unobserve() {}
    },
  );
});

afterEach(() => {
  cleanup();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: undefined,
  });
  vi.unstubAllGlobals();
});

describe("agentWidgetMessages", () => {
  it("uses French defaults and supports custom base-language packs", () => {
    expect(agentWidgetMessages("fr-CA").send).toBe("Envoyer le message");
    expect(
      agentWidgetMessages("es-MX", {
        es: { send: "Enviar mensaje" },
      }).send,
    ).toBe("Enviar mensaje");
  });
});

const renderWidget = () => {
  render(
    <AgentWidget
      availableReferences={[
        {
          key: "course:one",
          label: "Course one",
          resource: { type: "course", id: "course-one" },
        },
      ]}
      state={initialAgentState}
      onInterrupt={vi.fn()}
      onReset={vi.fn()}
      onSubmit={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Open AI Assistant" }));
  return screen.getByRole("combobox", { name: "Ask a question..." });
};

describe("AgentWidget references", () => {
  it("inserts a reference at the caret without replacing trailing text", async () => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      return window.setTimeout(() => callback(0), 0);
    });
    const input = renderWidget();

    fireEvent.change(input, {
      target: { value: "Before @after", selectionStart: 8 },
    });
    fireEvent.click(screen.getByText("Course one"));

    expect(screen.getByDisplayValue("Before @Course one after")).toBe(input);
    await waitFor(() => expect(input).toHaveProperty("selectionStart", 19));

    fireEvent.change(input, {
      target: { value: "Before @Course one  after", selectionStart: 20 },
    });
    expect(screen.queryByText("References")).toBeNull();
    expect(screen.queryByText("No references found.")).toBeNull();
  });

  it("hides the reference group heading when no references match", () => {
    const input = renderWidget();

    fireEvent.change(input, {
      target: { value: "Before @missing after", selectionStart: 15 },
    });

    expect(screen.getByText("No references found.")).toBeTruthy();
    expect(screen.queryByText("References")).toBeNull();
  });
});

describe("AgentWidget tool activity", () => {
  it("shows every pending approval outside the collapsed trace", () => {
    const onSubmit = vi.fn();
    render(
      <AgentWidget
        state={{
          ...initialAgentState,
          messages: [
            {
              id: "assistant",
              role: "assistant",
              text: "",
              tools: ["first", "second"].map((id) => ({
                type: "tool-call",
                messageId: "assistant",
                toolCallId: id,
                approvalId: `approval:${id}`,
                name: id,
                input: {},
                metadata: { destructive: false },
                status: "approval-required",
              })),
            },
          ],
        }}
        onInterrupt={vi.fn()}
        onReset={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open AI Assistant" }));
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[1]);
    expect(onSubmit).toHaveBeenCalledWith({
      type: "approval",
      approvalId: "approval:second",
      toolCallId: "second",
      approved: false,
    });
  });

  it("keeps approvals actionable while previous tool activity is collapsed", () => {
    const onSubmit = vi.fn();
    render(
      <AgentWidget
        state={{
          ...initialAgentState,
          messages: [
            {
              id: "assistant",
              role: "assistant",
              text: "",
              tools: [
                {
                  type: "tool-call",
                  messageId: "assistant",
                  toolCallId: "search",
                  name: "Search documents",
                  input: {},
                  metadata: { destructive: false },
                  status: "completed",
                },
                {
                  type: "tool-call",
                  messageId: "assistant",
                  toolCallId: "delete",
                  approvalId: "approval",
                  name: "Delete draft",
                  input: { id: "draft" },
                  metadata: { destructive: true },
                  status: "approval-required",
                },
              ],
            },
          ],
        }}
        onInterrupt={vi.fn()}
        onReset={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open AI Assistant" }));
    expect(screen.queryByText("Search documents")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tool activity" }));
    expect(screen.getByText("Search documents")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: "approval",
      approvalId: "approval",
      toolCallId: "delete",
      approved: true,
    });
  });
});
