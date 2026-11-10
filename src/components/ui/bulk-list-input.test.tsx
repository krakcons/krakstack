// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { BulkListInput, parseBulkList } from "./bulk-list-input";

afterEach(cleanup);

describe("BulkListInput", () => {
  it("preserves unfinished text instead of normalizing on each edit", () => {
    const onValueChange = vi.fn();
    render(
      <BulkListInput
        value="first,"
        onValueChange={onValueChange}
        aria-label="Recipients"
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "first,\n unfinished@" },
    });
    expect(onValueChange).toHaveBeenCalledWith("first,\n unfinished@");
  });

  it("deduplicates using host normalization while retaining first spelling", () => {
    expect(
      parseBulkList(" A@example.org, a@example.org\r\nB@example.org, ", {
        normalize: (value) => value.toLowerCase(),
      }),
    ).toEqual({ items: ["A@example.org", "B@example.org"], duplicates: 1 });
    expect(parseBulkList("a;b;a", { separator: /;/ })).toEqual({
      items: ["a", "b"],
      duplicates: 1,
    });
  });

  it("delegates dropped files, but never imports into a read-only input", () => {
    const onSelect = vi.fn();
    const props = {
      value: "",
      onValueChange: vi.fn(),
      files: { accept: ".csv", label: "Import", onSelect },
    };
    const { container, rerender } = render(<BulkListInput {...props} />);
    const file = new File(["a,b"], "list.csv", { type: "text/csv" });
    fireEvent.drop(container.firstElementChild!, {
      dataTransfer: { files: [file] },
    });
    expect(onSelect).toHaveBeenCalledWith([file]);
    rerender(<BulkListInput {...props} readOnly />);
    fireEvent.drop(container.firstElementChild!, {
      dataTransfer: { files: [file] },
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
  });
});
