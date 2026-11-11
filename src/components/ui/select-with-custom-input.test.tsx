// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useState } from "react";
import {
  SelectWithCustomInput,
  type SelectWithCustomInputValue,
} from "./select-with-custom-input";

afterEach(cleanup);
const options = [
  { value: "preset", label: "Preset" },
  {
    value: "other",
    label: "Other",
    input: { label: "Describe your answer", required: true },
  },
  {
    value: "alternative",
    label: "Alternative",
    input: { label: "Describe an alternative" },
  },
  { value: "unavailable", label: "Unavailable", disabled: true },
];
const Harness = () => {
  const [value, setValue] = useState<SelectWithCustomInputValue | null>(null);
  return (
    <form aria-label="Example">
      <SelectWithCustomInput
        label="Choice"
        options={options}
        value={value}
        onValueChange={setValue}
        name="choice"
        locale="en"
      />
    </form>
  );
};
const choose = async (name: string) => {
  fireEvent.click(screen.getByRole("combobox"));
  const option = await screen.findByRole("option", { name });
  fireEvent.pointerDown(option, { pointerType: "mouse", button: 0 });
  fireEvent.click(option, { detail: 1 });
};
describe("select with custom input", () => {
  it("reveals the designated field, submits identifiers separately and clears stale custom answers when switching", async () => {
    render(<Harness />);
    expect(screen.queryByRole("textbox")).toBeNull();
    await choose("Other");
    const input = screen.getByLabelText<HTMLInputElement>(
      "Describe your answer",
    );
    expect(input.required).toBe(true);
    fireEvent.change(input, { target: { value: "My own answer" } });
    const form = screen.getByRole<HTMLFormElement>("form", { name: "Example" });
    expect(new FormData(form).get("choice")).toBe("other");
    expect(new FormData(form).get("choiceCustom")).toBe("My own answer");
    await choose("Preset");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(new FormData(form).get("choice")).toBe("preset");
    expect(new FormData(form).has("choiceCustom")).toBe(false);
    await choose("Other");
    expect(screen.getByLabelText("Describe your answer")).toHaveProperty(
      "value",
      "",
    );
  });
  it("supports more than one custom-input option without sharing their text", async () => {
    render(<Harness />);
    await choose("Other");
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Previous answer" },
    });
    await choose("Alternative");
    expect(screen.getByLabelText("Describe an alternative")).toHaveProperty(
      "value",
      "",
    );
    expect(screen.queryByLabelText("Describe your answer")).toBeNull();
  });
  it("respects read-only state and does not mutate controlled answers", () => {
    const change = vi.fn();
    render(
      <SelectWithCustomInput
        label="Choice"
        options={options}
        value={{ option: "other", customValue: "Existing" }}
        onValueChange={change}
        readOnly
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Changed" },
    });
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveProperty("value", "Existing");
  });
  it("does not select disabled options", async () => {
    render(<Harness />);
    await choose("Unavailable");
    expect(screen.getByRole("combobox").textContent).toContain(
      "Select an option",
    );
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
