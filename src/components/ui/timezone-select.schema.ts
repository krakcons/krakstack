import { Schema } from "effect";

export const TimeZoneIdSchema = Schema.NonEmptyString.pipe(
  Schema.check(
    Schema.makeFilter((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return "Expected a runtime-supported time-zone identifier";
      }
    }),
  ),
).annotate({ identifier: "TimeZoneId" });

export const TimeZoneReferenceDateSchema = Schema.Date.pipe(
  Schema.check(
    Schema.makeFilter(
      (value) =>
        Number.isFinite(value.getTime()) || "Expected a valid reference date",
    ),
  ),
).annotate({ identifier: "TimeZoneReferenceDate" });

export const isTimeZoneId = Schema.is(TimeZoneIdSchema);
export const isTimeZoneReferenceDate = Schema.is(TimeZoneReferenceDateSchema);

export const TimeZoneContinentFilterSchema = Schema.Literals([
  "all",
  "north-america",
  "south-america",
  "europe",
  "africa",
  "asia",
  "oceania",
  "antarctica",
]).annotate({ identifier: "TimeZoneContinentFilter" });
export type TimeZoneContinentFilter = typeof TimeZoneContinentFilterSchema.Type;
export type TimeZoneContinent = Exclude<TimeZoneContinentFilter, "all">;
export const isTimeZoneContinentFilter = Schema.is(
  TimeZoneContinentFilterSchema,
);
