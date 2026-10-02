// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach } from "vitest";

import { VirtualizedCombobox } from "./virtualized-combobox";

afterEach(cleanup);

describe("VirtualizedCombobox focus", () => {
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
