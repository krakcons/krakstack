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
import { AgentWidget } from "./widget";

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
