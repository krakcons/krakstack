// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, vi } from "vitest";

import { ColorPicker } from "./color-picker";

afterEach(cleanup);

const ControlledPicker = () => {
  const [color, setColor] = useState("#2563EB");
  return <ColorPicker value={color} onValueChange={setColor} />;
};

describe("ColorPicker", () => {
  it("allows typing past shorthand HEX in controlled mode", () => {
    render(<ControlledPicker />);
    const input = screen.getByRole("textbox");
    for (const value of [
      "#",
      "#a",
      "#ab",
      "#abc",
      "#abcd",
      "#abcde",
      "#abcdef",
    ]) {
      fireEvent.change(input, { target: { value } });
      expect(input.getAttribute("value")).toBe(value);
    }
    fireEvent.blur(input);
    expect(input.getAttribute("value")).toBe("#ABCDEF");
  });

  it("normalizes shorthand and never emits invalid or alpha colors", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker onValueChange={onValueChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: " abc " } });
    expect(onValueChange).toHaveBeenLastCalledWith("#AABBCC");
    fireEvent.blur(input);
    expect(input.getAttribute("value")).toBe("#AABBCC");
    for (const value of ["#12", "not a color", "#12345678", ""]) {
      fireEvent.change(input, { target: { value } });
      expect(input.getAttribute("aria-invalid")).toBe("true");
      fireEvent.blur(input);
      expect(input.getAttribute("value")).toBe("#AABBCC");
    }
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("discards incomplete drafts on Escape and external resets", () => {
    const { rerender } = render(<ColorPicker value="#2563EB" />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "#12" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input.getAttribute("value")).toBe("#2563EB");
    fireEvent.change(input, { target: { value: "#45" } });
    rerender(<ColorPicker value="#FF0000" />);
    expect(input.getAttribute("value")).toBe("#FF0000");
  });

  it("updates HEX from keyboard selection and returns focus on Escape", async () => {
    render(<ControlledPicker />);
    const trigger = screen.getByRole("button", { name: "Choose color" });
    fireEvent.click(trigger);
    const hue = await screen.findByRole("slider", { name: "Hue" });
    const before = screen.getByRole("textbox").getAttribute("value");
    fireEvent.keyDown(hue, { key: "ArrowRight", keyCode: 39 });
    await waitFor(() =>
      expect(screen.getByRole("textbox").getAttribute("value")).not.toBe(
        before,
      ),
    );
    fireEvent.keyDown(hue, { key: "Escape" });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("does not submit a surrounding form when opening the picker", async () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <ColorPicker name="color" />
      </form>,
    );
    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("slider", { name: "Hue" });
    expect(submit).not.toHaveBeenCalled();
  });

  it("prevents opening disabled and read-only pickers", () => {
    const { rerender } = render(<ColorPicker disabled />);
    expect(screen.getByRole("textbox").hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByRole("slider")).toBeNull();
    rerender(<ColorPicker readOnly />);
    expect(screen.getByRole("textbox").hasAttribute("readonly")).toBe(true);
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
  });
});
