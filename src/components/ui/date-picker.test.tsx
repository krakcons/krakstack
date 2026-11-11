// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useState } from "react";
import { DatePicker, getDatePickerState, parseDateOnly } from "./date-picker";

afterEach(cleanup);
const Harness = () => {
  const [value, setValue] = useState("2026-11-11");
  return (
    <DatePicker
      value={value}
      onValueChange={setValue}
      name="date"
      min="2026-01-01"
      max="2027-12-31"
      locale="en"
    />
  );
};
describe("date picker", () => {
  it("validates actual calendar dates, including leap years, without timestamp coercion", () => {
    expect(parseDateOnly("2024-02-29")?.toISOString()).toBe(
      "2024-02-29T00:00:00.000Z",
    );
    expect(parseDateOnly("0099-01-01")?.toISOString()).toBe(
      "0099-01-01T00:00:00.000Z",
    );
    for (const value of [
      "2026-02-29",
      "2026-04-31",
      "2026-13-01",
      "2026-11-00",
      "0000-01-01",
      "11/11/2026",
      "2026-11-11T00:00:00Z",
      "invalid",
    ])
      expect(parseDateOnly(value), value).toBeUndefined();
  });
  it("accepts inclusive bounds and rejects invalid or reversed ranges", () => {
    for (const value of ["2026-01-01", "2026-12-31"])
      expect(
        getDatePickerState({ value, min: "2026-01-01", max: "2026-12-31" }),
      ).toBe("valid");
    expect(getDatePickerState({ value: "2025-12-31", min: "2026-01-01" })).toBe(
      "out-of-range",
    );
    expect(getDatePickerState({ value: "2027-01-01", max: "2026-12-31" })).toBe(
      "out-of-range",
    );
    expect(getDatePickerState({ value: "", min: "not a date" })).toBe(
      "invalid-range",
    );
    expect(
      getDatePickerState({ value: "", min: "2027-01-01", max: "2026-01-01" }),
    ).toBe("invalid-range");
    expect(getDatePickerState({ value: "" })).toBe("empty");
  });
  it("retains incomplete drafts, prevents invalid form submission and supports clearing", () => {
    render(<Harness />);
    const input = screen.getByLabelText<HTMLInputElement>("Date");
    fireEvent.change(input, { target: { value: "2026-02-" } });
    expect(input.value).toBe("2026-02-");
    expect(input.validity.valid).toBe(false);
    fireEvent.change(input, { target: { value: "2026-02-28" } });
    expect(input.validity.valid).toBe(true);
    fireEvent.change(input, { target: { value: "2028-01-01" } });
    expect(input.validity.valid).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Clear date" }));
    expect(input.value).toBe("");
    expect(input.validity.valid).toBe(true);
  });
  it("locks read-only controls without removing their submitted value", () => {
    const change = vi.fn();
    const { container } = render(
      <form>
        <DatePicker
          value="2026-11-11"
          name="date"
          onValueChange={change}
          readOnly
          locale="fr"
        />
      </form>,
    );
    expect(
      screen.getByRole("button", { name: "Ouvrir le calendrier" }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("button", { name: "Effacer la date" }),
    ).toHaveProperty("disabled", true);
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2026-11-12" },
    });
    expect(change).not.toHaveBeenCalled();
    expect(new FormData(container.querySelector("form")!).get("date")).toBe(
      "2026-11-11",
    );
  });
});
