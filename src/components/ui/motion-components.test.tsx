// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, vi } from "vitest";
import { AnimatedList } from "./animated-list";
import { AnimatedNumber } from "./animated-number";
import { AutoHeight } from "./auto-height";
import { PresenceTransition } from "./presence-transition";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("motion component contracts", () => {
  it("retains the last measured height when a parent hides the content", async () => {
    let deliver = () => {};
    class Observer implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        deliver = () => callback([], this);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", Observer);
    render(<AutoHeight>Measured content</AutoHeight>);
    const inner = screen.getByText("Measured content");
    const rect = new DOMRect(0, 0, 100, 60);
    const boxes = vi
      .spyOn(inner, "getClientRects")
      .mockReturnValue(Object.assign([rect], { item: () => rect }));
    const bounds = vi
      .spyOn(inner, "getBoundingClientRect")
      .mockReturnValue(rect);
    act(deliver);
    await waitFor(() => expect(inner.parentElement?.style.height).toBe("60px"));
    boxes.mockReturnValue(Object.assign([], { item: () => null }));
    bounds.mockReturnValue(new DOMRect());
    act(deliver);
    expect(inner.parentElement?.style.height).toBe("60px");
  });
  it("renders meaningful SSR content without waiting for browser APIs", () => {
    const html = renderToString(
      <>
        <PresenceTransition open>
          <button>Available</button>
        </PresenceTransition>
        <AutoHeight>Content</AutoHeight>
        <AnimatedNumber value={1234} locale="en" />
      </>,
    );
    expect(html).toContain("Available");
    expect(html).toContain("Content");
    expect(html).toContain("1,234");
    expect(html).not.toContain("opacity:0");
    expect(
      renderToString(
        <PresenceTransition open={false}>Hidden</PresenceTransition>,
      ),
    ).not.toContain("Hidden");
  });

  it("preserves keyed input state when items reorder", () => {
    const a = { id: "a" },
      b = { id: "b" };
    const content = (items: readonly { id: string }[]) => (
      <AnimatedList items={items} getKey={(item) => item.id}>
        {(item) => <input aria-label={item.id} defaultValue={item.id} />}
      </AnimatedList>
    );
    const { rerender } = render(content([a, b]));
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "a" });
    input.value = "local draft";
    rerender(content([b, a]));
    expect(screen.getByRole("textbox", { name: "a" })).toBe(input);
    expect(input.value).toBe("local draft");
  });

  it("exposes final localized targets to assistive technology", () => {
    const { container, rerender } = render(
      <AnimatedNumber value={1200} locale="en" />,
    );
    rerender(<AnimatedNumber value={2400} locale="fr" />);
    expect(container.querySelector(".sr-only")?.textContent).toBe(
      new Intl.NumberFormat("fr").format(2400),
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
