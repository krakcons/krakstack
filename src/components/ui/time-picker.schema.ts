import { Option, Schema } from "effect";

/** A wall-clock time, never a date, instant or time zone. */
export const TimeOnlySchema = Schema.String.check(
  Schema.isPattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
).annotate({ identifier: "TimeOnly" });

const decodeTime = Schema.decodeUnknownOption(TimeOnlySchema);
export const Time12HourSchema = Schema.String.check(
  Schema.isPattern(/^(?:0?[1-9]|1[0-2]):[0-5]\d\s?(?:AM|PM)$/i),
).annotate({ identifier: "Time12Hour" });
const decode12Hour = Schema.decodeUnknownOption(Time12HourSchema);

/** Convert display text to canonical HH:mm; 12 AM is midnight, 12 PM is noon. */
export const parse12HourTime = (value: string): string | undefined => {
  if (Option.isNone(decode12Hour(value))) return undefined;
  const [hourText, rest] = value.split(":");
  const hour =
    (Number(hourText) % 12) + (value.toUpperCase().endsWith("PM") ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${rest!.slice(0, 2)}`;
};
export const parseTimeOnly = (value: string): number | undefined => {
  const decoded = decodeTime(value);
  return Option.isSome(decoded)
    ? Number(decoded.value.slice(0, 2)) * 60 + Number(decoded.value.slice(3))
    : undefined;
};

export const MinuteStepSchema = Schema.Number.check(
  Schema.isInt(),
  Schema.isBetween({ minimum: 1, maximum: 60 }),
).annotate({ identifier: "MinuteStep" });

export const getTimePickerState = ({
  value,
  min,
  max,
  minuteStep = 1,
}: {
  value: string;
  min?: string;
  max?: string;
  minuteStep?: number;
}) => {
  if (
    !Schema.is(MinuteStepSchema)(minuteStep) ||
    (min !== undefined && parseTimeOnly(min) === undefined) ||
    (max !== undefined && parseTimeOnly(max) === undefined) ||
    (min && max && min > max)
  )
    return "invalid-range";
  const minimum = parseTimeOnly(min ?? "00:00")!;
  const maximum = parseTimeOnly(max ?? "23:59")!;
  const hasChoice = Array.from(
    { length: maximum - minimum + 1 },
    (_, i) => minimum + i,
  ).some((time) => (time % 60) % minuteStep === 0);
  if (!hasChoice) return "invalid-range";
  if (!value) return "empty";
  const time = parseTimeOnly(value);
  if (time === undefined) return "invalid";
  if (time < minimum || time > maximum) return "out-of-range";
  if ((time % 60) % minuteStep !== 0) return "off-step";
  return "valid";
};
