// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useState } from "react";
import {
  TimezoneSelect,
  getTimeZones,
  getTimeZoneDetails,
  isTimeZoneId,
  getTimeZoneContinent,
} from "./timezone-select";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const winter = new Date("2026-01-15T12:00:00Z");
const summer = new Date("2026-07-15T12:00:00Z");
describe("Timezone Select", () => {
  it("separates the Americas and classifies island regions and aliases by location", () => {
    for (const zone of [
      "America/New_York",
      "America/Toronto",
      "America/Mexico_City",
      "America/Panama",
      "America/Puerto_Rico",
      "Atlantic/Bermuda",
      "US/Eastern",
    ])
      expect(getTimeZoneContinent(zone)).toBe("north-america");
    for (const zone of [
      "America/Sao_Paulo",
      "America/Bogota",
      "America/Argentina/Salta",
      "America/Buenos_Aires",
      "America/Santiago",
      "Pacific/Easter",
      "Pacific/Galapagos",
      "Atlantic/Stanley",
    ])
      expect(getTimeZoneContinent(zone)).toBe("south-america");
    expect(getTimeZoneContinent("Atlantic/Reykjavik")).toBe("europe");
    expect(getTimeZoneContinent("Atlantic/Canary")).toBe("africa");
    expect(getTimeZoneContinent("Indian/Maldives")).toBe("asia");
    expect(getTimeZoneContinent("Indian/Mauritius")).toBe("africa");
    expect(getTimeZoneContinent("Australia/Sydney")).toBe("oceania");
    expect(getTimeZoneContinent("Pacific/Honolulu")).toBe("oceania");
    expect(getTimeZoneContinent("Antarctica/McMurdo")).toBe("antarctica");
    expect(getTimeZoneContinent("UTC")).toBeNull();
    expect(getTimeZoneContinent("Etc/GMT-14")).toBeNull();
    expect(getTimeZoneContinent("Not/AZone")).toBeNull();
    expect(
      Intl.supportedValuesOf("timeZone").filter(
        (zone) =>
          zone !== "UTC" &&
          !zone.startsWith("Etc/") &&
          getTimeZoneContinent(zone) === null,
      ),
    ).toEqual([]);
  });

  it("configures continents only through props and preserves selection when configuration changes", () => {
    const change = vi.fn();
    const view = render(
      <TimezoneSelect
        value="Europe/Paris"
        onValueChange={change}
        referenceTime={winter}
      />,
    );
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    view.rerender(
      <TimezoneSelect
        value="Europe/Paris"
        onValueChange={change}
        referenceTime={winter}
        continent="asia"
      />,
    );
    expect(
      screen.getByRole("combobox", { name: "Time zone" }).textContent,
    ).toContain("Europe/Paris");
    expect(change).not.toHaveBeenCalled();
    view.unmount();
    render(
      <TimezoneSelect
        value={null}
        onValueChange={change}
        referenceTime={winter}
        continent="all"
        locale="fr"
      />,
    );
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(screen.queryByRole("combobox", { name: "Continent" })).toBeNull();
  });
  it("includes every runtime primary zone, UTC, fixed-offset zones and valid additional aliases", () => {
    const zones = getTimeZones(["US/Eastern", "Not/AZone"]);
    expect(
      Intl.supportedValuesOf("timeZone").every((zone) => zones.includes(zone)),
    ).toBe(true);
    expect(zones).toContain("UTC");
    expect(zones).toContain("Etc/GMT-14");
    expect(zones).toContain("Etc/GMT+12");
    expect(zones).toContain("US/Eastern");
    expect(zones).not.toContain("Not/AZone");
    expect(new Set(zones).size).toBe(zones.length);
    expect(isTimeZoneId("")).toBe(false);
    expect(isTimeZoneId("Not/AZone")).toBe(false);
  });

  it("calculates actual offsets for DST, different transition dates and fractional-hour zones", () => {
    expect(
      getTimeZoneDetails({ timeZone: "America/New_York", at: winter })
        ?.offsetMinutes,
    ).toBe(-300);
    expect(
      getTimeZoneDetails({ timeZone: "America/New_York", at: summer })
        ?.offsetMinutes,
    ).toBe(-240);
    const transition = new Date("2026-03-22T12:00:00Z");
    const paris = getTimeZoneDetails({
      timeZone: "Europe/Paris",
      at: transition,
    });
    const newYork = getTimeZoneDetails({
      timeZone: "America/New_York",
      at: transition,
    });
    expect((paris?.offsetMinutes ?? 0) - (newYork?.offsetMinutes ?? 0)).toBe(
      300,
    );
    expect(
      getTimeZoneDetails({ timeZone: "Asia/Kathmandu", at: winter })
        ?.offsetMinutes,
    ).toBe(345);
    expect(
      getTimeZoneDetails({ timeZone: "Asia/Kolkata", at: winter })
        ?.offsetMinutes,
    ).toBe(330);
    expect(
      getTimeZoneDetails({ timeZone: "Australia/Eucla", at: winter })
        ?.offsetMinutes,
    ).toBe(525);
    expect(
      getTimeZoneDetails({ timeZone: "Etc/GMT+5", at: winter })?.offset,
    ).toBe("UTC-05:00");
  });

  it("retains calendar dates across the date line and rejects invalid data safely", () => {
    const at = new Date("2026-01-01T11:00:00Z");
    expect(
      getTimeZoneDetails({ timeZone: "Pacific/Kiritimati", at })?.date,
    ).toContain("Jan 2");
    expect(
      getTimeZoneDetails({ timeZone: "Pacific/Pago_Pago", at })?.date,
    ).toContain("Jan 1");
    expect(getTimeZoneDetails({ timeZone: "Not/AZone", at })).toBeUndefined();
    expect(
      getTimeZoneDetails({ timeZone: "UTC", at: new Date("invalid") }),
    ).toBeUndefined();
  });

  it("compares the same fixed instant and clears a form value without submitting", () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const Example = () => {
      const [value, setValue] = useState<string | null>("Asia/Kathmandu");
      return (
        <form aria-label="Preferences" onSubmit={submit}>
          <TimezoneSelect
            label="Zone"
            name="timeZone"
            value={value}
            onValueChange={setValue}
            referenceTime={winter}
            comparisonTimeZone="America/New_York"
          />
        </form>
      );
    };
    render(<Example />);
    expect(screen.getByRole("definition").textContent).toContain(
      "10.75 hr ahead",
    );
    const form = screen.getByRole<HTMLFormElement>("form", {
      name: "Preferences",
    });
    expect(new FormData(form).get("timeZone")).toBe("Asia/Kathmandu");
    fireEvent.click(screen.getByRole("button", { name: "Clear time zone" }));
    expect(new FormData(form).get("timeZone")).toBe("");
    expect(screen.queryByRole("definition")).toBeNull();
    expect(submit).not.toHaveBeenCalled();
  });

  it("localizes French copy, preserves a valid alias and disables all controls", () => {
    render(
      <form aria-label="Preferences">
        <TimezoneSelect
          value="US/Eastern"
          name="timeZone"
          onValueChange={vi.fn()}
          referenceTime={winter}
          comparisonTimeZone={null}
          locale="fr"
          disabled
        />
      </form>,
    );
    expect(
      screen.getByRole("combobox", { name: "Fuseau horaire" }).textContent,
    ).toContain("US/Eastern");
    expect(
      screen
        .getByRole("combobox", { name: "Fuseau horaire" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Utiliser mon fuseau horaire" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      new FormData(screen.getByRole<HTMLFormElement>("form")).has("timeZone"),
    ).toBe(false);
    expect(screen.queryByText(/Heure de comparaison|Votre heure/)).toBeNull();
  });

  it("does not emit a replacement for an invalid controlled zone or invalid reference date", () => {
    const change = vi.fn();
    render(
      <TimezoneSelect
        value="Not/AZone"
        onValueChange={change}
        referenceTime={new Date("invalid")}
        comparisonTimeZone="Not/ABaseline"
      />,
    );
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(change).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole("combobox", { name: "Time zone" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("refreshes local time and DST offsets on the live clock without changing selection", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-08T06:59:00Z"));
    const change = vi.fn();
    render(
      <TimezoneSelect
        value="America/New_York"
        onValueChange={change}
        comparisonTimeZone="UTC"
      />,
    );
    expect(screen.getByRole("definition").textContent).toContain("UTC-05:00");
    // The clock refresh is driven by an external subscription, not a value mutation.
    vi.setSystemTime(new Date("2026-03-08T07:00:00Z"));
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(screen.getByRole("definition").textContent).toContain("UTC-04:00");
    expect(change).not.toHaveBeenCalled();
  });
});
