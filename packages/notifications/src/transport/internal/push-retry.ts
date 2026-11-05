import { Clock, Effect, Option, Schema } from "effect";

const RetrySeconds = Schema.NumberFromString.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0),
).annotate({ identifier: "PushRetrySeconds" });

/** Preserve provider backoff; the durable runtime also applies its own retry policy. */
export const pushRetryAfter = Effect.fnUntraced(function* (
  value: string | undefined,
  minimumMillis = 0,
) {
  const now = yield* Clock.currentTimeMillis;
  const seconds = Schema.decodeUnknownOption(RetrySeconds)(value);
  const date = Option.isSome(seconds)
    ? Schema.decodeOption(Schema.DateFromMillis)(now + seconds.value * 1000)
    : Schema.decodeUnknownOption(Schema.DateFromString)(value);
  if (Option.isNone(date) && minimumMillis === 0) return undefined;
  return new Date(
    Math.max(
      now + minimumMillis,
      Option.isSome(date) ? date.value.getTime() : now,
    ),
  );
});
