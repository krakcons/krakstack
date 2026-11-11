// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useState } from "react";
import { PhoneNumberInput, normalizePhoneNumber } from "./phone-number-input";
import {
  fitsE164DigitLimit,
  getPhoneNumberDigits,
} from "./phone-number-input.schema";
import {
  CronExpressionEditor,
  getCronPreview,
  formatCronDraft,
} from "./cron-expression-editor";

afterEach(cleanup);
const reference = new Date("2026-03-07T15:00:00Z");
const PhoneHarness = ({ initial = "" }: { initial?: string }) => {
  const [value, setValue] = useState(initial);
  const [country, setCountry] = useState<"CA" | "FR">("CA");
  return (
    <PhoneNumberInput
      value={value}
      country={country}
      countries={["CA", "FR"]}
      locale="en"
      onCountryChange={(next) => {
        if (next === "CA" || next === "FR") setCountry(next);
      }}
      onValueChange={setValue}
    />
  );
};
describe("phone input", () => {
  it("accepts the fifteenth digit without accepting a sixteenth", () => {
    render(<PhoneHarness initial="+1 2345678901234" />);
    const input = screen.getByLabelText<HTMLInputElement>("Phone number");
    fireEvent.change(input, { target: { value: "23456789012345" } });
    expect(input.value.replace(/\D/g, "")).toBe("23456789012345");
    fireEvent.change(input, { target: { value: "234567890123456" } });
    expect(input.value.replace(/\D/g, "")).toBe("23456789012345");
  });
  it("counts calling codes of different lengths and excludes extensions", () => {
    for (const prefix of ["+1", "+33", "+358"]) {
      const atLimit = `${prefix}${"2".repeat(16 - prefix.length)}`;
      expect(fitsE164DigitLimit(atLimit, "CA"), atLimit).toBe(true);
      expect(fitsE164DigitLimit(`${atLimit}2`, "CA"), atLimit).toBe(false);
      expect(fitsE164DigitLimit(`${atLimit} ext. 123456`, "CA"), atLimit).toBe(
        true,
      );
    }
    expect(getPhoneNumberDigits("06 12 34 56 78", "FR")).toBe("33612345678");
    expect(getPhoneNumberDigits("+33 06 12 34 56 78", "FR")).toBe(
      "33612345678",
    );
    expect(fitsE164DigitLimit("", "CA")).toBe(true);
  });
  it("rejects national and international edits beyond 15 digits including the calling code", () => {
    render(<PhoneHarness initial="+1 23456789012345" />);
    const input = screen.getByLabelText<HTMLInputElement>("Phone number");
    const before = input.value;
    fireEvent.change(input, { target: { value: "234567890123456" } });
    expect(input.value).toBe(before);
    fireEvent.change(input, { target: { value: "+3323456789012345" } });
    expect(input.value).toBe(before);
  });
  it("formats national digits immediately and removes letters from edits", () => {
    render(<PhoneHarness />);
    const input = screen.getByLabelText("Phone number");
    fireEvent.change(input, { target: { value: "416abc5550123" } });
    expect(input).toHaveProperty("value", "(416) 555-0123");
    expect(screen.getByText("+14165550123")).toBeTruthy();
  });
  it("prevents typed letters and manually typed punctuation", () => {
    render(<PhoneHarness />);
    const input = screen.getByLabelText("Phone number");
    expect(fireEvent.keyDown(input, { key: "a" })).toBe(false);
    expect(fireEvent.keyDown(input, { key: "+" })).toBe(false);
    expect(fireEvent.keyDown(input, { key: "4" })).toBe(true);
  });
  it("keeps calling codes outside the editable number, even after clearing", () => {
    render(<PhoneHarness initial="+14165550123" />);
    const input = screen.getByLabelText("Phone number");
    expect(input).toHaveProperty("value", "(416) 555-0123");
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveProperty("value", "");
    expect(screen.getByRole("combobox").textContent).toContain("+1");
    expect(screen.getByRole("combobox").tagName).toBe("BUTTON");
  });
  it("deletes through formatting instead of getting stuck on parentheses", () => {
    render(<PhoneHarness initial="+1 416" />);
    const input = screen.getByLabelText<HTMLInputElement>("Phone number");
    expect(input.value).toBe("(416)");
    input.setSelectionRange(5, 5);
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(input.value.replace(/\D/g, "")).toBe("41");
  });
  it("keeps extensions in a separate numeric field", () => {
    render(<PhoneHarness initial="+14165550123 ext. 42" />);
    expect(screen.getByLabelText("Phone number")).toHaveProperty(
      "value",
      "(416) 555-0123",
    );
    const extension = screen.getByLabelText("Extension");
    expect(extension).toHaveProperty("value", "42");
    fireEvent.change(extension, { target: { value: "a123" } });
    expect(extension).toHaveProperty("value", "123");
  });
  it("normalizes international and national numbers without extracting from prose", () => {
    expect(normalizePhoneNumber("(416) 555-0123 ext. 42", "CA")).toEqual({
      e164: "+14165550123",
      extension: "42",
      country: "CA",
    });
    expect(normalizePhoneNumber("+33 6 12 34 56 78", "CA")?.e164).toBe(
      "+33612345678",
    );
    expect(normalizePhoneNumber("06 12 34 56 78", "FR")?.e164).toBe(
      "+33612345678",
    );
    expect(normalizePhoneNumber("416", "CA")).toBeNull();
    expect(normalizePhoneNumber("Call me at +1 416 555 0123", "CA")).toBeNull();
  });
  it("respects readOnly and retains the selected country outside the catalog", () => {
    const change = vi.fn();
    render(
      <PhoneNumberInput
        value="4165550123"
        country="CA"
        countries={["FR"]}
        onCountryChange={vi.fn()}
        onValueChange={change}
        readOnly
        locale="en"
      />,
    );
    expect(screen.getByRole("combobox")).toHaveProperty("disabled", true);
    fireEvent.blur(screen.getByLabelText("Phone number"));
    expect(change).not.toHaveBeenCalled();
  });
});
describe("cron editor", () => {
  it("accepts every typing prefix of supported lists, ranges and intervals", () => {
    for (const expression of [
      "*/15 9-17/2 * * 1,3,5",
      "0 0 1 10 *",
      "0 9 * * 1-5",
    ]) {
      for (let length = 0; length <= expression.length; length++) {
        const prefix = expression.slice(0, length);
        expect(formatCronDraft(prefix), prefix).toBe(prefix);
      }
    }
  });
  it("rejects wrong characters, malformed operators, sixth fields and invalid field values", () => {
    for (const expression of [
      "hello",
      "@daily",
      "0 9 * * MON",
      "61 * * * *",
      "0 24 * * *",
      "0 0 32 * *",
      "0 0 * 13 *",
      "0 0 * * 8",
      "*/0",
      "**",
      "1,,2",
      "*-2",
      "0 0 0 * * *",
    ])
      expect(formatCronDraft(expression), expression).toBeNull();
  });
  it("allows in-place incomplete operators without accepting them as finished fields", () => {
    expect(formatCronDraft("*/ 9 * * *", 2)).toBe("*/ 9 * * *");
    expect(formatCronDraft("*/ 9 * * *")).toBeNull();
    expect(formatCronDraft("5-1 9 * * *", 3)).toBe("5-1 9 * * *");
    expect(formatCronDraft("5-1 9 * * *")).toBeNull();
  });
  it("uses a typed expression input and rejects out-of-range values", () => {
    const change = vi.fn();
    render(
      <CronExpressionEditor
        value="0 9 * * 1-5"
        onValueChange={change}
        timeZone="UTC"
        referenceTime={reference}
        locale="en"
      />,
    );
    const input = screen.getByRole("textbox", { name: "Cron expression" });
    fireEvent.change(input, { target: { value: "61 9 * * 1-5" } });
    expect(change).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "*/15   9 * * 1-5" } });
    expect(change).toHaveBeenLastCalledWith("*/15 9 * * 1-5");
  });
  it("preserves local execution time across spring DST", () => {
    expect(
      getCronPreview("0 9 * * *", "America/Toronto", reference, 2)?.map(
        (date) => date.toISOString(),
      ),
    ).toEqual(["2026-03-08T13:00:00.000Z", "2026-03-09T13:00:00.000Z"]);
  });
  it("uses the offset at each run across fall DST", () => {
    expect(
      getCronPreview(
        "0 9 * * *",
        "America/Toronto",
        new Date("2026-10-31T00:00:00Z"),
        2,
      )?.map((date) => date.toISOString()),
    ).toEqual(["2026-10-31T13:00:00.000Z", "2026-11-01T14:00:00.000Z"]);
  });
  it("rejects invalid fields, six-field cron, invalid zones and dates", () => {
    for (const expression of ["", "61 * * * *", "0 0 0 * * *", "0 9 31 2 *"])
      expect(getCronPreview(expression, "UTC", reference)).toBeNull();
    expect(getCronPreview("0 9 * * *", "Invalid/Zone", reference)).toBeNull();
    expect(getCronPreview("0 9 * * *", "UTC", new Date("invalid"))).toBeNull();
  });
  it("does not include demo presets or silently rewrite a host expression", () => {
    const change = vi.fn();
    render(
      <CronExpressionEditor
        value="0,30 9 * * MON"
        onValueChange={change}
        timeZone="UTC"
        referenceTime={reference}
        locale="en"
      />,
    );
    expect(change).not.toHaveBeenCalled();
    for (const name of ["Every hour", "Daily at 09:00", "Weekdays at 09:00"])
      expect(screen.queryByRole("button", { name })).toBeNull();
  });
});
