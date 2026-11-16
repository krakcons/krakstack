// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { PresenceTransition } from "@/components/ui/presence-transition";
import { AnimatedList } from "@/components/ui/animated-list";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { animateElement } from "./krakmotion";

type Transition = { onfinish: (() => void) | null; cancel: () => void };
const pending: Transition[] = [];

beforeEach(() => {
  pending.length = 0;
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: vi.fn(() => {
      const transition: Transition = { onfinish: null, cancel: vi.fn() };
      pending.push(transition);
      return transition;
    }),
  });
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLElement.prototype, "animate");
  vi.unstubAllGlobals();
});

describe("KrakMotion lifecycle", () => {
  it("preserves initial content and makes exiting content inert until completion", () => {
    const content = (open: boolean) => (
      <PresenceTransition open={open}>
        <button>Details</button>
      </PresenceTransition>
    );
    const { rerender } = render(content(true));
    expect(pending).toHaveLength(0);
    rerender(content(false));
    const wrapper = screen.getByText("Details").parentElement;
    expect(wrapper?.hasAttribute("inert")).toBe(true);
    expect(wrapper?.getAttribute("aria-hidden")).toBe("true");
    expect(pending).toHaveLength(1);
    act(() => pending[0]?.onfinish?.());
    expect(screen.queryByText("Details")).toBeNull();
  });

  it("cancels an interrupted exit without unmounting reopened content", () => {
    const content = (open: boolean) => (
      <PresenceTransition open={open}>
        <input aria-label="Draft" defaultValue="Keep me" />
      </PresenceTransition>
    );
    const { rerender } = render(content(true));
    const draft = screen.getByRole("textbox");
    rerender(content(false));
    const exit = pending[0];
    rerender(content(true));
    expect(exit?.cancel).toHaveBeenCalledOnce();
    expect(exit?.onfinish).toBeNull();
    expect(screen.getByRole("textbox")).toBe(draft);
    act(() => pending.at(-1)?.onfinish?.());
    expect(screen.getByRole("textbox")).toBe(draft);
  });

  it("retains removed list children inertly and preserves keyed state across reordering", () => {
    const content = (items: string[]) => (
      <AnimatedList items={items} getKey={String}>
        {(item) => <input aria-label={item} defaultValue={item} />}
      </AnimatedList>
    );
    const { rerender } = render(content(["a", "b"]));
    const retained = screen.getByRole("textbox", { name: "b" });
    rerender(content(["b", "a"]));
    expect(screen.getByRole("textbox", { name: "b" })).toBe(retained);
    rerender(content(["b"]));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(document.querySelectorAll("li")).toHaveLength(2);
    act(() => {
      for (const transition of pending) transition.onfinish?.();
    });
    expect(document.querySelectorAll("li")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "b" })).toBe(retained);
  });

  it("settles without WAAPI and never calls obsolete completion after cancellation", () => {
    const element = document.createElement("div");
    const complete = vi.fn();
    const cancel = animateElement(
      element,
      [{ opacity: 0 }, { opacity: 1 }],
      100,
      complete,
    );
    cancel();
    expect(pending[0]?.onfinish).toBeNull();
    expect(complete).not.toHaveBeenCalled();
    Reflect.deleteProperty(HTMLElement.prototype, "animate");
    animateElement(element, [], 100, complete);
    expect(complete).toHaveBeenCalledOnce();
  });

  it("applies numeric targets immediately under reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { rerender } = render(<AnimatedNumber value={10} locale="en" />);
    rerender(<AnimatedNumber value={25} locale="en" />);
    expect(screen.getAllByText("25")).toHaveLength(2);
  });
});
