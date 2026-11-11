import { Option, Schema } from "effect";

/** A calendar date, not a timestamp. UTC is only used to validate and display its parts. */
export const DateOnlySchema = Schema.String.check(
  Schema.isPattern(/^(?!0000)\d{4}-\d{2}-\d{2}$/),
  Schema.makeFilter((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }),
).annotate({ identifier: "DateOnly" });

const decodeDateOnly = Schema.decodeUnknownOption(DateOnlySchema);
export const parseDateOnly = (value: string): Date | undefined => {
  const decoded = decodeDateOnly(value);
  return Option.isSome(decoded)
    ? new Date(`${decoded.value}T00:00:00.000Z`)
    : undefined;
};

export const getDatePickerState = ({
  value,
  min,
  max,
}: {
  value: string;
  min?: string;
  max?: string;
}) => {
  if (
    (min !== undefined && !parseDateOnly(min)) ||
    (max !== undefined && !parseDateOnly(max)) ||
    (min && max && min > max)
  )
    return "invalid-range";
  if (!value) return "empty";
  if (!parseDateOnly(value)) return "invalid";
  if ((min && value < min) || (max && value > max)) return "out-of-range";
  return "valid";
};
