// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useState } from "react";
import {
  TimePicker,
  getTimePickerState,
  parseTimeOnly,
  parse12HourTime,
} from "./time-picker";

afterEach(cleanup);
const Harness = ({
  initial = "09:30",
  minuteStep = 15,
}: {
  initial?: string;
  minuteStep?: number;
}) => {
  const [value, setValue] = useState(initial);
  return (
    <TimePicker
      value={value}
      onValueChange={setValue}
      name="time"
      min="09:00"
      max="17:30"
      minuteStep={minuteStep}
      hourCycle={24}
    />
  );
};

describe("time picker", () => {
  it("validates time-only values without coercing drafts or timestamps", () => {
    expect(parseTimeOnly("00:00")).toBe(0);
    expect(parseTimeOnly("23:59")).toBe(1439);
    for (const value of [
      "24:00",
      "12:60",
      "9:00",
      "12:",
      "12:00:00",
      "2026-11-11T12:00Z",
      "invalid",
    ])
      expect(parseTimeOnly(value), value).toBeUndefined();
  });

  it("enforces inclusive bounds, per-hour steps and valid configuration", () => {
    for (const value of ["09:00", "17:30"])
      expect(
        getTimePickerState({
          value,
          min: "09:00",
          max: "17:30",
          minuteStep: 15,
        }),
      ).toBe("valid");
    expect(getTimePickerState({ value: "08:59", min: "09:00" })).toBe(
      "out-of-range",
    );
    expect(getTimePickerState({ value: "17:31", max: "17:30" })).toBe(
      "out-of-range",
    );
    expect(getTimePickerState({ value: "09:10", minuteStep: 15 })).toBe(
      "off-step",
    );
    expect(getTimePickerState({ value: "10:00", minuteStep: 7 })).toBe("valid");
    expect(getTimePickerState({ value: "" })).toBe("empty");
    for (const minuteStep of [0, -1, 61, 1.5, NaN, Infinity])
      expect(getTimePickerState({ value: "", minuteStep })).toBe(
        "invalid-range",
      );
    for (const bounds of [
      { min: "invalid" },
      { max: "24:00" },
      { min: "23:00", max: "01:00" },
      { min: "09:01", max: "09:14", minuteStep: 15 },
    ])
      expect(getTimePickerState({ value: "", ...bounds })).toBe(
        "invalid-range",
      );
  });

  it("retains invalid drafts, participates in form validity and clears", () => {
    render(<Harness />);
    const input = screen.getByLabelText<HTMLInputElement>("Time", {
      selector: "input",
    });
    for (const value of ["09:", "09:10", "18:00"]) {
      fireEvent.change(input, { target: { value } });
      expect(input.value).toBe(value);
      expect(input.validity.valid).toBe(false);
    }
    fireEvent.change(input, { target: { value: "17:30" } });
    expect(input.validity.valid).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Clear time" }));
    expect(input.value).toBe("");
    expect(input.validity.valid).toBe(true);
  });

  it("selects bounded hours/minutes with arrow keys and keeps the panel open", async () => {
    render(<Harness initial="16:45" />);
    fireEvent.click(screen.getByRole("button", { name: "Open time picker" }));
    const hours = await screen.findByRole("radiogroup", { name: "Hours" });
    expect(within(hours).queryByRole("radio", { name: "08" })).toBeNull();
    const selectedHour = within(hours).getByRole("radio", { name: "16" });
    expect(selectedHour.getAttribute("aria-checked")).toBe("true");
    fireEvent.keyDown(selectedHour, { key: "ArrowDown" });
    const input = screen.getByLabelText<HTMLInputElement>("Time", {
      selector: "input",
    });
    expect(input.value).toBe("17:30");
    expect(document.activeElement).toBe(
      within(hours).getByRole("radio", { name: "17" }),
    );
    const minutes = screen.getByRole("radiogroup", { name: "Minutes" });
    expect(within(minutes).queryByRole("radio", { name: "45" })).toBeNull();
    fireEvent.keyDown(within(minutes).getByRole("radio", { name: "30" }), {
      key: "Home",
    });
    expect(input.value).toBe("17:00");
    fireEvent.keyDown(within(minutes).getByRole("radio", { name: "00" }), {
      key: "End",
    });
    expect(input.value).toBe("17:30");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("radiogroup", { name: "Hours" })).toBeNull();
  });

  it("starts empty values at an allowed time when selecting a grid option", async () => {
    render(<Harness initial="" />);
    fireEvent.click(screen.getByRole("button", { name: "Open time picker" }));
    const minutes = await screen.findByRole("radiogroup", { name: "Minutes" });
    fireEvent.click(within(minutes).getByRole("radio", { name: "15" }));
    expect(
      screen.getByLabelText<HTMLInputElement>("Time", { selector: "input" })
        .value,
    ).toBe("09:15");
  });

  it("makes every minute reachable in its scrolling column", async () => {
    render(<Harness initial="09:00" minuteStep={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Open time picker" }));
    const minutes = await screen.findByRole("radiogroup", { name: "Minutes" });
    const input = screen.getByLabelText<HTMLInputElement>("Time", {
      selector: "input",
    });
    expect(within(minutes).getAllByRole("radio")).toHaveLength(60);
    fireEvent.click(within(minutes).getByRole("radio", { name: "59" }));
    expect(input.value).toBe("09:59");
    fireEvent.keyDown(within(minutes).getByRole("radio", { name: "59" }), {
      key: "ArrowRight",
    });
    expect(input.value).toBe("09:00");
    expect(document.activeElement).toBe(
      within(minutes).getByRole("radio", { name: "00" }),
    );
    fireEvent.keyDown(within(minutes).getByRole("radio", { name: "00" }), {
      key: "End",
    });
    expect(input.value).toBe("09:59");
    expect(document.activeElement).toBe(
      within(minutes).getByRole("radio", { name: "59" }),
    );
  });

  it("supports steps other than 15", async () => {
    render(<Harness initial="09:07" minuteStep={7} />);
    fireEvent.click(screen.getByRole("button", { name: "Open time picker" }));
    const minutes = await screen.findByRole("radiogroup", { name: "Minutes" });
    expect(within(minutes).getAllByRole("radio")).toHaveLength(9);
    fireEvent.click(within(minutes).getByRole("radio", { name: "56" }));
    expect(
      screen.getByLabelText<HTMLInputElement>("Time", { selector: "input" })
        .value,
    ).toBe("09:56");
  });

  it("does not reset a column's scroll position on unrelated rerenders", async () => {
    const change = vi.fn();
    const { rerender } = render(
      <TimePicker value="09:30" onValueChange={change} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open time picker" }));
    const minutes = await screen.findByRole("radiogroup", { name: "Minutes" });
    const scroll = vi.spyOn(minutes, "scrollTop", "set");
    rerender(
      <TimePicker value="09:30" onValueChange={change} description="Help" />,
    );
    expect(scroll).not.toHaveBeenCalled();
    rerender(
      <TimePicker value="09:31" onValueChange={change} description="Help" />,
    );
    expect(scroll).toHaveBeenCalledTimes(1);
    scroll.mockRestore();
  });

  it("converts 12-hour entry without confusing midnight and noon", () => {
    expect(parse12HourTime("12:00 AM")).toBe("00:00");
    expect(parse12HourTime("12:00 PM")).toBe("12:00");
    expect(parse12HourTime("1:05 pm")).toBe("13:05");
    expect(parse12HourTime("11:59PM")).toBe("23:59");
    for (const value of ["00:30 AM", "13:00 PM", "12:60 AM", "12:30", "9:5 AM"])
      expect(parse12HourTime(value)).toBeUndefined();
  });

  it("defaults to AM/PM while submitting canonical values and preserving drafts", async () => {
    const DefaultHarness = () => {
      const [value, setValue] = useState("00:00");
      return (
        <form aria-label="appointment">
          <TimePicker name="time" value={value} onValueChange={setValue} />
        </form>
      );
    };
    render(<DefaultHarness />);
    const input = screen.getByRole<HTMLInputElement>("textbox", {
      name: "Time",
    });
    expect(input.value).toBe("12:00 AM");
    fireEvent.click(screen.getByRole("button", { name: "Open time picker" }));
    const period = await screen.findByRole("radiogroup", { name: "AM/PM" });
    const hours = screen.getByRole("radiogroup", { name: "Hours" });
    expect(
      within(hours)
        .getAllByRole("radio")
        .map((option) => option.textContent),
    ).toEqual(Array.from({ length: 12 }, (_, index) => String(index + 1)));
    fireEvent.click(within(period).getByRole("radio", { name: "PM" }));
    expect(input.value).toBe("12:00 PM");
    expect(new FormData(input.form!).get("time")).toBe("12:00");
    fireEvent.click(within(period).getByRole("radio", { name: "AM" }));
    expect(input.value).toBe("12:00 AM");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.change(input, { target: { value: "1:23 pm" } });
    expect(input.value).toBe("1:23 pm");
    expect(new FormData(input.form!).get("time")).toBe("13:23");
    fireEvent.blur(input);
    expect(input.value).toBe("1:23 PM");
    fireEvent.change(input, { target: { value: "12:30" } });
    expect(input.validity.valid).toBe(false);
    fireEvent.blur(input);
    expect(input.value).toBe("12:30");
    expect(input.validity.valid).toBe(false);
  });

  it("bounds period changes and supports changing the display cycle", async () => {
    const change = vi.fn();
    const { rerender } = render(
      <TimePicker
        value="09:30"
        onValueChange={change}
        min="09:00"
        max="17:30"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open time picker" }));
    const period = await screen.findByRole("radiogroup", { name: "AM/PM" });
    fireEvent.click(within(period).getByRole("radio", { name: "PM" }));
    expect(change).toHaveBeenLastCalledWith("17:30");
    rerender(
      <TimePicker value="17:30" onValueChange={change} hourCycle={24} />,
    );
    expect(screen.queryByRole("radiogroup", { name: "AM/PM" })).toBeNull();
    expect(
      screen.getByRole<HTMLInputElement>("textbox", { name: "Time" }).value,
    ).toBe("17:30");
    rerender(<TimePicker value="17:30" onValueChange={change} max="11:59" />);
    expect(
      within(screen.getByRole("radiogroup", { name: "AM/PM" })).queryByRole(
        "radio",
        { name: "PM" },
      ),
    ).toBeNull();
  });

  it("locks read-only controls while preserving their submitted value", () => {
    const change = vi.fn();
    const { container } = render(
      <form>
        <TimePicker
          value="12:30"
          name="time"
          onValueChange={change}
          readOnly
          locale="fr"
        />
      </form>,
    );
    expect(
      screen.getByRole("button", { name: "Ouvrir le sélecteur d’heure" }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("button", { name: "Effacer l’heure" }),
    ).toHaveProperty("disabled", true);
    fireEvent.change(screen.getByLabelText("Heure"), {
      target: { value: "13:00" },
    });
    expect(change).not.toHaveBeenCalled();
    expect(new FormData(container.querySelector("form")!).get("time")).toBe(
      "12:30",
    );
  });

  it("blocks an invalid configuration and respects required/disabled fields", () => {
    const change = vi.fn();
    const { rerender } = render(
      <TimePicker
        value=""
        onValueChange={change}
        min="09:01"
        max="09:14"
        minuteStep={15}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Open time picker" }),
    ).toHaveProperty("disabled", true);
    expect(screen.getByLabelText<HTMLInputElement>("Time").validity.valid).toBe(
      false,
    );
    rerender(<TimePicker value="" onValueChange={change} required />);
    expect(
      screen.getByLabelText<HTMLInputElement>("Time").validity.valueMissing,
    ).toBe(true);
    rerender(
      <form>
        <TimePicker value="12:30" name="time" onValueChange={change} disabled />
      </form>,
    );
    expect(screen.getByLabelText("Time")).toHaveProperty("disabled", true);
    expect(
      new FormData(screen.getByLabelText<HTMLInputElement>("Time").form!).has(
        "time",
      ),
    ).toBe(false);
  });
});
