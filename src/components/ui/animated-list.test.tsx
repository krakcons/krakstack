// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useState } from "react";
import { AnimatedList } from "./animated-list";

afterEach(cleanup);

describe("AnimatedList reordering", () => {
  it("moves keyed items with keyboard handles, preserves focus and announces the accepted position", () => {
    const Example = () => {
      const [items, setItems] = useState(["Alpha", "Beta", "Gamma"]);
      return (
        <AnimatedList
          items={items}
          getKey={String}
          getItemLabel={String}
          onReorder={setItems}
        >
          {(item) => <span>{item}</span>}
        </AnimatedList>
      );
    };
    render(<Example />);
    const handle = screen.getByRole("button", { name: "Reorder: Alpha" });
    handle.focus();
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["Beta", "Alpha", "Gamma"]);
    expect(document.activeElement).toBe(handle);
    expect(screen.getByRole("status").textContent).toBe(
      "Alpha, position 2 of 3.",
    );
    fireEvent.keyDown(handle, { key: "End" });
    expect(screen.getAllByRole("listitem")[2]?.textContent).toBe("Alpha");
    fireEvent.keyDown(handle, { key: "Home" });
    expect(screen.getAllByRole("listitem")[0]?.textContent).toBe("Alpha");
    expect(
      document.getElementById(handle.getAttribute("aria-describedby") ?? "")
        ?.textContent,
    ).toContain("Arrow Up");
  });

  it("requests changes without inventing host state and ignores keyboard input within item controls", () => {
    const change = vi.fn();
    render(
      <AnimatedList items={["a", "b"]} getKey={String} onReorder={change}>
        {(item) => <input aria-label={item} defaultValue={item} />}
      </AnimatedList>,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Reorder: a" }), {
      key: "ArrowUp",
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "a" }), {
      key: "ArrowDown",
    });
    expect(change).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("button", { name: "Reorder: a" }), {
      key: "ArrowDown",
    });
    expect(change).toHaveBeenCalledWith(["b", "a"]);
    expect(screen.getAllByRole("textbox")[0]?.getAttribute("aria-label")).toBe(
      "a",
    );
    expect(screen.getByRole("status").textContent).toBe("a, position 1 of 2.");
  });

  it("does not expose handles unless controlled reordering is enabled", () => {
    const content = (reorder?: (items: string[]) => void) => (
      <AnimatedList
        items={["a"]}
        getKey={String}
        onReorder={reorder}
        locale="fr-CA"
      >
        {(item) => <span>{item}</span>}
      </AnimatedList>
    );
    const { rerender } = render(content());
    expect(screen.queryByRole("button")).toBeNull();
    const change = vi.fn();
    rerender(content(change));
    const handle = screen.getByRole("button", { name: "Réordonner: a" });
    expect(handle.hasAttribute("disabled")).toBe(true);
    fireEvent.click(handle);
    expect(change).not.toHaveBeenCalled();
  });
});
