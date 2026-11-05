import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { pushRetryAfter } from "../src/transport/internal/push-retry.js";

describe("push provider backoff", () => {
  it.effect(
    "accepts seconds and HTTP dates, ignores invalid headers, and enforces the quota minimum",
    () =>
      Effect.gen(function* () {
        expect(yield* pushRetryAfter("120")).toEqual(new Date(120_000));
        expect(yield* pushRetryAfter("Thu, 01 Jan 1970 00:02:00 GMT")).toEqual(
          new Date(120_000),
        );
        expect(yield* pushRetryAfter("invalid")).toBeUndefined();
        expect(yield* pushRetryAfter(undefined)).toBeUndefined();
        expect(yield* pushRetryAfter("10", 60_000)).toEqual(new Date(60_000));
        expect(yield* pushRetryAfter("120", 60_000)).toEqual(new Date(120_000));
      }),
  );
});
