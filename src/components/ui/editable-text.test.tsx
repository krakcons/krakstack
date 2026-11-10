// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useState } from "react";
import { EditableText } from "./editable-text";

afterEach(cleanup);

describe("EditableText", () => {
  it("does not interpret IME composition keys as save or cancel", () => {
    const save = vi.fn();
    render(<EditableText value="Original" label="Name" onSave={save} />);
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Composing" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.keyDown(input, { key: "Escape", isComposing: true });
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toBe(input);
  });
  it("focuses the draft, discards on Escape, and restores trigger focus", () => {
    const save = vi.fn();
    render(<EditableText value="Original" label="Name" onSave={save} />);
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "Uncommitted" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByRole("button").textContent).toBe("Original");
    expect(document.activeElement).toBe(screen.getByRole("button"));
    expect(save).not.toHaveBeenCalled();
  });

  it("keeps a rejected draft and saves on Enter without submitting its parent", async () => {
    const save = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("validation"))
      .mockResolvedValue(undefined);
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const Example = () => {
      const [value, setValue] = useState("Original");
      return (
        <form onSubmit={submit}>
          <EditableText
            value={value}
            label="Name"
            onSave={async (next) => {
              await save();
              setValue(next);
            }}
          />
        </form>
      );
    };
    render(<Example />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Updated" },
    });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "Could not save",
      ),
    );
    expect(screen.getByRole("textbox").getAttribute("value")).toBe("Updated");
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
    expect(screen.getByRole("button").textContent).toBe("Updated");
    expect(submit).not.toHaveBeenCalled();
  });
});
