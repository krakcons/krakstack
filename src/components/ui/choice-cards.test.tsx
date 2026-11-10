// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useState } from "react";
import { ChoiceCards } from "./choice-cards";

afterEach(cleanup);
const options = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Push", disabled: true },
];

describe("ChoiceCards", () => {
  it("uses native single selection and serializes the selected value", () => {
    const Example = () => {
      const [value, setValue] = useState<string | null>(null);
      return (
        <form aria-label="Settings">
          <ChoiceCards
            mode="single"
            name="channel"
            label="Channel"
            options={options}
            value={value}
            onValueChange={setValue}
            required
          />
        </form>
      );
    };
    render(<Example />);
    fireEvent.click(screen.getByRole("radio", { name: "SMS" }));
    expect(
      new FormData(screen.getByRole<HTMLFormElement>("form")).get("channel"),
    ).toBe("sms");
    expect(
      screen.getByRole<HTMLInputElement>("radio", { name: "SMS" }).checked,
    ).toBe(true);
  });

  it("adds and removes independent multiple selections", () => {
    const change = vi.fn();
    const { rerender } = render(
      <ChoiceCards
        mode="multiple"
        name="channels"
        label="Channels"
        options={options}
        value={["email"]}
        onValueChange={change}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "SMS" }));
    expect(change).toHaveBeenLastCalledWith(["email", "sms"]);
    rerender(
      <ChoiceCards
        mode="multiple"
        name="channels"
        label="Channels"
        options={options}
        value={["email", "sms"]}
        onValueChange={change}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(change).toHaveBeenLastCalledWith(["sms"]);
    expect(
      screen.getByRole("checkbox", { name: "Push" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("associates group errors with inputs and reports blur only when leaving the group", () => {
    const onBlur = vi.fn();
    render(
      <ChoiceCards
        mode="single"
        name="channel"
        label="Channel"
        error="Choose a channel"
        options={options}
        value={null}
        onValueChange={vi.fn()}
        onBlur={onBlur}
      />,
    );
    const email = screen.getByRole("radio", { name: "Email" });
    const sms = screen.getByRole("radio", { name: "SMS" });
    expect(
      document.getElementById(email.getAttribute("aria-describedby") ?? "")
        ?.textContent,
    ).toBe("Choose a channel");
    fireEvent.blur(email, { relatedTarget: sms });
    expect(onBlur).not.toHaveBeenCalled();
    fireEvent.blur(sms, { relatedTarget: null });
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
