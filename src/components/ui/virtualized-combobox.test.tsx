// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import { afterEach, vi } from "vitest";

import {
  VirtualizedCombobox,
  type VirtualizedComboboxVirtualizer,
} from "./virtualized-combobox";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("VirtualizedCombobox focus", () => {
  it("does not measure hidden group headings between remote search responses", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(288);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(320);
    const virtualizerRef = createRef<VirtualizedComboboxVirtualizer>();
    const items = [
      { value: "municipality", label: "Toronto municipality" },
      { value: "division", label: "Toronto census division" },
      { value: "centre", label: "Toronto population centre" },
    ];
    const props = {
      multiple: true as const,
      ariaLabel: "Places",
      emptyLabel: "Loading places",
      placeholder: "Places",
      value: [],
      onValueChange: () => {},
      onSearchValueChange: () => {},
      virtualizerRef,
    };
    const { rerender } = render(
      <VirtualizedCombobox {...props} searchValue="To" items={items} />,
    );
    fireEvent.click(screen.getByRole("combobox", { name: "Places" }));
    const input = await screen.findByPlaceholderText("Search...");
    await screen.findByRole("option", { name: "Toronto municipality" });
    await waitFor(() => expect(document.activeElement).toBe(input));

    for (const searchValue of ["Tor", "Toro", "To"]) {
      rerender(
        <VirtualizedCombobox {...props} searchValue={searchValue} items={[]} />,
      );
      await waitFor(() =>
        expect(virtualizerRef.current?.getVirtualItems()).toEqual([]),
      );
      expect(document.activeElement).toBe(input);
      rerender(
        <VirtualizedCombobox
          {...props}
          searchValue={searchValue}
          items={items}
        />,
      );
      await screen.findByRole("option", { name: "Toronto municipality" });
      expect(document.activeElement).toBe(input);
    }
  });
  it("keeps the search focused when asynchronous results change", async () => {
    const props = {
      ariaLabel: "Select icon",
      contentClassName: "h-80 w-80",
      emptyLabel: "No icons found.",
      onValueChange: () => {},
      placeholder: "Select icon",
      value: { label: "circle-help", value: "circle-help" },
    };
    const { rerender } = render(<VirtualizedCombobox {...props} items={[]} />);
    fireEvent.click(screen.getByRole("combobox", { name: "Select icon" }));
    const input = await screen.findByPlaceholderText("Search...");
    const popup = screen.getByRole("dialog");
    expect(popup.classList.contains("h-80")).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(input));
    fireEvent.change(input, { target: { value: "circle" } });
    rerender(
      <VirtualizedCombobox
        {...props}
        items={[{ label: "circle", value: "circle" }]}
      />,
    );
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy());
    expect(document.activeElement).toBe(input);
    expect(screen.getByRole("dialog")).toBe(popup);
    rerender(<VirtualizedCombobox {...props} items={[]} />);
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("combobox", { name: "Select icon" }),
      ),
    );
  });
});
