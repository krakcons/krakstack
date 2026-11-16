import { DateTime, Option } from "effect";
import type { SendingWindow } from "../schema.js";

const hourMillis = 3_600_000;
const dayMillis = 24 * hourMillis;

const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

// Only called after decoding SendingWindow, including its named timezone.
export const sendingWindowState = (window: SendingWindow, now: Date) => {
  const zone = DateTime.zoneMakeNamedUnsafe(window.timeZone);
  const start = minutes(window.start);
  const end = minutes(window.end);
  const zoned = (millis: number) =>
    DateTime.makeZonedUnsafe(millis, { timeZone: zone });
  const isOpen = (millis: number) => {
    const parts = DateTime.toParts(zoned(millis));
    const minute = parts.hour * 60 + parts.minute;
    return start < end
      ? minute >= start && minute < end
      : minute >= start || minute < end;
  };
  const nowMillis = now.getTime();
  if (isOpen(nowMillis)) return { _tag: "Open" } as const;

  const today = DateTime.toParts(zoned(nowMillis));
  const calendar = DateTime.makeUnsafe({
    year: today.year,
    month: today.month,
    day: today.day,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  let opening = nowMillis + 8 * dayMillis;
  let found = false;

  // A daily window normally opens within 24 hours. Eight calendar days also
  // covers skipped dates. Never fail open if timezone data cannot yield one.
  for (let day = 0; day <= 8; day++) {
    const date = DateTime.toPartsUtc(DateTime.add(calendar, { days: day }));
    for (const disambiguation of ["earlier", "later"] as const) {
      const candidate = DateTime.makeZoned(
        {
          year: date.year,
          month: date.month,
          day: date.day,
          hour: Math.floor(start / 60),
          minute: start % 60,
          second: 0,
          millisecond: 0,
        },
        { timeZone: zone, adjustForTimeZone: true, disambiguation },
      );
      if (Option.isNone(candidate)) continue;
      const actual = DateTime.toParts(candidate.value);
      // Gap disambiguation shifts wall time; a missing start is not an opening.
      if (
        actual.year !== date.year ||
        actual.month !== date.month ||
        actual.day !== date.day ||
        actual.hour * 60 + actual.minute !== start
      )
        continue;
      const instant = DateTime.toEpochMillis(candidate.value);
      if (instant > nowMillis && instant <= opening) {
        opening = instant;
        found = true;
      }
    }
  }

  // A clock transition can open the window without passing its configured start
  // (including rollback into a second interval). IANA transitions are separated
  // by more than an hour. Locate offset changes to millisecond precision rather
  // than assuming one-hour DST or rounding historical offsets to minutes.
  let cursor = nowMillis;
  let offset = DateTime.zonedOffset(zoned(cursor));
  while (cursor < opening) {
    const next = Math.min(cursor + hourMillis, opening);
    const nextOffset = DateTime.zonedOffset(zoned(next));
    if (nextOffset === offset) {
      cursor = next;
      continue;
    }
    let lower = cursor;
    let upper = next;
    while (upper - lower > 1) {
      const middle = lower + Math.floor((upper - lower) / 2);
      if (DateTime.zonedOffset(zoned(middle)) === offset) lower = middle;
      else upper = middle;
    }
    if (isOpen(upper)) {
      opening = upper;
      found = true;
      break;
    }
    cursor = upper;
    offset = DateTime.zonedOffset(zoned(cursor));
  }
  return {
    _tag: "Closed",
    opening: found ? Option.some(new Date(opening)) : Option.none(),
  } as const;
};
