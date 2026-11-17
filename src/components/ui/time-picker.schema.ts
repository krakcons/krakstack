import { Option, Schema } from "effect";

/** A wall-clock time, never a date, instant or time zone. */
export const TimeOnlySchema = Schema.String.check(
  Schema.isPattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
).annotate({ identifier: "TimeOnly" });

const decodeTime = Schema.decodeUnknownOption(TimeOnlySchema);
export type TimePrecision = "minute" | "second" | "millisecond";
export const TimeSecondSchema = Schema.String.check(
  Schema.isPattern(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/),
).annotate({ identifier: "TimeSecond" });
export const TimeMillisecondSchema = Schema.String.check(
  Schema.isPattern(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}$/),
).annotate({ identifier: "TimeMillisecond" });
export const timePrecisionUnit = (precision: TimePrecision) =>
  precision === "minute" ? 60_000 : precision === "second" ? 1000 : 1;

/** Milliseconds since midnight; unlike parseTimeOnly, supports explicit precision. */
export const parseTimeValue = (
  value: string,
  precision: TimePrecision = "minute",
): number | undefined => {
  const schema =
    precision === "minute"
      ? TimeOnlySchema
      : precision === "second"
        ? TimeSecondSchema
        : TimeMillisecondSchema;
  if (!Schema.is(schema)(value)) return undefined;
  return (
    Number(value.slice(0, 2)) * 3_600_000 +
    Number(value.slice(3, 5)) * 60_000 +
    (precision === "minute" ? 0 : Number(value.slice(6, 8)) * 1000) +
    (precision === "millisecond" ? Number(value.slice(9)) : 0)
  );
};

export const formatTimeValue = (value: number, precision: TimePrecision) => {
  const pad = (value: number, width = 2) => String(value).padStart(width, "0");
  const minute = `${pad(Math.floor(value / 3_600_000))}:${pad(Math.floor(value / 60_000) % 60)}`;
  const second = `${minute}:${pad(Math.floor(value / 1000) % 60)}`;
  return precision === "minute"
    ? minute
    : precision === "second"
      ? second
      : `${second}.${pad(value % 1000, 3)}`;
};
export const Time12HourSchema = Schema.String.check(
  Schema.isPattern(/^(?:0?[1-9]|1[0-2]):[0-5]\d\s?(?:AM|PM)$/i),
).annotate({ identifier: "Time12Hour" });
const Time12HourSecondSchema = Schema.String.check(
  Schema.isPattern(/^(?:0?[1-9]|1[0-2]):[0-5]\d:[0-5]\d\s?(?:AM|PM)$/i),
).annotate({ identifier: "Time12HourSecond" });
const Time12HourMillisecondSchema = Schema.String.check(
  Schema.isPattern(/^(?:0?[1-9]|1[0-2]):[0-5]\d:[0-5]\d\.\d{3}\s?(?:AM|PM)$/i),
).annotate({ identifier: "Time12HourMillisecond" });

/** Convert display text to canonical HH:mm; 12 AM is midnight, 12 PM is noon. */
export const parse12HourTime = (
  value: string,
  precision: TimePrecision = "minute",
): string | undefined => {
  const schema =
    precision === "minute"
      ? Time12HourSchema
      : precision === "second"
        ? Time12HourSecondSchema
        : Time12HourMillisecondSchema;
  if (!Schema.is(schema)(value)) return undefined;
  const suffix = value.match(/\s?(AM|PM)$/i);
  if (!suffix) return undefined;
  const clock = value.slice(0, suffix.index);
  const hourText = clock.split(":")[0]!;
  const normalized = `${hourText.padStart(2, "0")}${clock.slice(hourText.length)}`;
  const hour = Number(hourText);
  const canonicalHour =
    (hour % 12) + (value.toUpperCase().endsWith("PM") ? 12 : 0);
  return `${String(canonicalHour).padStart(2, "0")}${normalized.slice(2)}`;
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
  precision = "minute",
}: {
  value: string;
  min?: string;
  max?: string;
  minuteStep?: number;
  precision?: TimePrecision;
}) => {
  if (
    !Schema.is(MinuteStepSchema)(minuteStep) ||
    (min !== undefined && parseTimeValue(min, precision) === undefined) ||
    (max !== undefined && parseTimeValue(max, precision) === undefined) ||
    (min && max && min > max)
  )
    return "invalid-range";
  const minimum = min === undefined ? 0 : parseTimeValue(min, precision)!;
  const maximum =
    max === undefined
      ? 86_400_000 - timePrecisionUnit(precision)
      : parseTimeValue(max, precision)!;
  const hasChoice =
    getTimeIntervals(minimum, maximum, minuteStep, precision).length > 0;
  if (!hasChoice) return "invalid-range";
  if (!value) return "empty";
  const time = parseTimeValue(value, precision);
  if (time === undefined) return "invalid";
  if (time < minimum || time > maximum) return "out-of-range";
  if ((Math.floor(time / 60_000) % 60) % minuteStep !== 0) return "off-step";
  return "valid";
};

/** At most 1,440 minute buckets, never 86 million millisecond options. */
export const getTimeIntervals = (
  minimum: number,
  maximum: number,
  minuteStep: number,
  precision: TimePrecision,
) => {
  const unit = timePrecisionUnit(precision);
  return Array.from({ length: 1440 }, (_, minute) => {
    const start = Math.max(minimum, minute * 60_000);
    const end = Math.min(maximum, (minute + 1) * 60_000 - unit);
    return { start, end, minute };
  }).filter(
    ({ start, end, minute }) =>
      start <= end && (minute % 60) % minuteStep === 0,
  );
};
