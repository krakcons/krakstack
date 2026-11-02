// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import * as m from "@/paraglide/messages";
import { AgentPreview } from "./agent-preview";

beforeEach(() => {
  vi.useFakeTimers();
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
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AgentPreview", () => {
  it("shows tool traces inside the widget for an ordinary message", async () => {
    render(<AgentPreview />);
    fireEvent.click(screen.getByRole("button", { name: "Open AI Assistant" }));
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await act(() => vi.advanceTimersByTime(40));
    const widget = within(screen.getByRole("dialog"));
    expect(widget.getByText(m.agent_preview_search_tool())).toBeTruthy();
    const trace = widget.getByRole("button", { name: /Tool activity/ });
    expect(trace.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(trace);
    expect(trace.getAttribute("aria-expanded")).toBe("false");
    await act(() => vi.advanceTimersByTime(800));
    expect(trace.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trace);
    expect(trace.getAttribute("aria-expanded")).toBe("true");
    expect(widget.getByText(m.agent_preview_read_tool())).toBeTruthy();
    await act(() => vi.advanceTimersByTime(10_000));
    expect(widget.getByText(m.agent_preview_response_intro())).toBeTruthy();
  });

  const openDemo = (name: string) => {
    render(<AgentPreview />);
    fireEvent.click(screen.getByRole("button", { name }));
    fireEvent.click(screen.getByRole("button", { name: "Open AI Assistant" }));
  };

  it("runs multiple tools before streaming their simulated results", async () => {
    openDemo(m.agent_preview_tools());
    await act(() => vi.advanceTimersByTime(40));
    expect(screen.getByText(m.agent_preview_search_tool())).toBeTruthy();
    await act(() => vi.advanceTimersByTime(800));
    expect(screen.getByText(m.agent_preview_read_tool())).toBeTruthy();
    await act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText(m.agent_preview_tools_response())).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Worked for/ }));
    expect(screen.getByText(m.agent_preview_search_tool())).toBeTruthy();
    expect(screen.getByText(m.agent_preview_read_tool())).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: m.agent_preview_read_tool() }),
    );
    expect(screen.getByText(/customer-onboarding/)).toBeTruthy();
  });

  it.each([true, false])(
    "resumes after an approval decision: %s",
    async (approved) => {
      openDemo(m.agent_preview_destructive());
      await act(() => vi.advanceTimersByTime(600));
      expect(screen.getByText("Destructive")).toBeTruthy();
      expect(screen.getByRole("combobox")).toHaveProperty("disabled", true);
      fireEvent.click(screen.getByRole("button", { name: "View more" }));
      expect(screen.getByText(/customer-onboarding/)).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: approved ? "Approve" : "Cancel" }),
      );
      await act(() => vi.advanceTimersByTime(10_000));
      expect(
        screen.getByText(
          approved
            ? m.agent_preview_approved_response()
            : m.agent_preview_denied_response(),
        ),
      ).toBeTruthy();
      expect(screen.getByRole("combobox")).toHaveProperty("disabled", false);
    },
  );

  it("shows tool failures and lets another scenario recover from a service error", async () => {
    openDemo(m.agent_preview_failure());
    await act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(
      screen.getByText(m.agent_preview_tool_failure_response()),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: m.agent_preview_error() }),
    );
    await act(() => vi.advanceTimersByTime(600));
    expect(screen.getByRole("alert").textContent).toContain(
      "The assistant is currently unavailable.",
    );
    fireEvent.click(
      screen.getByRole("button", { name: m.agent_preview_tools() }),
    );
    await act(() => vi.advanceTimersByTime(10_000));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText(m.agent_preview_tools_response())).toBeTruthy();
  });

  it("renders formatted content and a copyable code example", async () => {
    openDemo(m.agent_preview_markdown());
    await act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText(m.agent_preview_markdown_item())).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy ts code" })).toBeTruthy();
    expect(
      within(screen.getByRole("dialog")).getByRole("code").textContent,
    ).toContain("const result = await agent.submit");
  });

  it("uses selected references and allows context removal", async () => {
    render(<AgentPreview />);
    fireEvent.click(screen.getByRole("button", { name: "Open AI Assistant" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: `Remove context: ${m.home_preview_template()}`,
      }),
    );
    expect(screen.queryByRole("button", { name: /Remove context/ })).toBeNull();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "@", selectionStart: 1 },
    });
    fireEvent.click(screen.getByText(m.home_nav_docs()));
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await act(() => vi.advanceTimersByTime(10_000));
    expect(
      screen.getByText(
        m.agent_preview_response_references({ references: m.home_nav_docs() }),
      ),
    ).toBeTruthy();
  });

  it("cancels a running scenario when another demo is selected", async () => {
    openDemo(m.agent_preview_tools());
    await act(() => vi.advanceTimersByTime(40));
    fireEvent.click(
      screen.getByRole("button", { name: m.agent_preview_destructive() }),
    );
    await act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole("button", { name: "Approve" })).toBeTruthy();
    expect(screen.queryByText(m.agent_preview_search_tool())).toBeNull();
    expect(screen.queryByText(m.agent_preview_tools_response())).toBeNull();
  });

  it("streams fake replies and cancels them when stopped or reset", async () => {
    render(<AgentPreview />);
    fireEvent.click(screen.getByRole("button", { name: "Open AI Assistant" }));

    const send = () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "Hello" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    };

    send();
    await act(() => vi.advanceTimersByTime(1720));
    const partial = m.agent_preview_response_intro().slice(0, 16);
    expect(screen.getByText(partial)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Stop response" }));
    await act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText(partial)).toBeTruthy();
    expect(screen.queryByText(m.agent_preview_response_intro())).toBeNull();

    send();
    await act(() => vi.advanceTimersByTime(10_000));
    expect(
      screen.getByText(m.agent_preview_response_plan().replace(/\s+/g, " ")),
    ).toBeTruthy();

    send();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await act(() => vi.advanceTimersByTime(10_000));
    fireEvent.click(screen.getByRole("button", { name: "Open AI Assistant" }));
    expect(screen.queryByText(partial)).toBeNull();
    send();
    await act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText(m.agent_preview_response_intro())).toBeTruthy();
  });
});
