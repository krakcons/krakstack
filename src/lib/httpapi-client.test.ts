import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import { encodeHttpApiOperationResult } from "./httpapi-client";

describe("encodeHttpApiOperationResult", () => {
  it.effect("normalizes empty responses to JSON null", () =>
    Effect.gen(function* () {
      expect(yield* encodeHttpApiOperationResult(undefined)).toBeNull();
    }),
  );

  it.effect("encodes decoded response values for tool transports", () =>
    Effect.gen(function* () {
      expect(
        yield* encodeHttpApiOperationResult(
          new Date("2026-08-17T00:00:00.000Z"),
        ),
      ).toBe("2026-08-17T00:00:00.000Z");
      expect(
        yield* encodeHttpApiOperationResult(new Uint8Array([75, 83])),
      ).toBe("S1M=");
    }),
  );
});
