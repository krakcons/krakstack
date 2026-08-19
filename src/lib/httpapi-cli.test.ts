import { describe, expect, it } from "@effect/vitest";
import { Cause, Effect, Stream } from "effect";
import { TestConsole } from "effect/testing";

import {
  encodeHttpApiOperationResult,
  type ApiClientService,
} from "./httpapi-client";
import { formatHttpApiCliCause, printHttpApiCliResult } from "./httpapi-cli";
import type { HttpApiOperationEntry } from "./httpapi-helpers";

const operation: HttpApiOperationEntry = {
  method: "get",
  path: "/events",
  operation: { operationId: "events.stream" },
};

const client: ApiClientService = {
  encodeResult: (result) => encodeHttpApiOperationResult(result),
  execute: () => Effect.die("Not used"),
};

describe("printHttpApiCliResult", () => {
  it.effect("pretty prints ordinary responses", () =>
    Effect.gen(function* () {
      yield* printHttpApiCliResult({ status: "ready" }, operation, client);

      expect(yield* TestConsole.logLines).toEqual([
        '{\n  "status": "ready"\n}',
      ]);
    }).pipe(Effect.provide(TestConsole.layer)),
  );

  it.effect("prints stream events as NDJSON without a trailing result", () =>
    Effect.gen(function* () {
      yield* printHttpApiCliResult(
        Stream.make(
          { _tag: "progress", current: 1 },
          { _tag: "progress", current: 2 },
        ),
        operation,
        client,
      );

      expect(yield* TestConsole.logLines).toEqual([
        '{"_tag":"progress","current":1}',
        '{"_tag":"progress","current":2}',
      ]);
    }).pipe(Effect.provide(TestConsole.layer)),
  );
});

describe("formatHttpApiCliCause", () => {
  it("includes the error name when its message is empty", () => {
    const error = new Error("");
    error.name = "effect/HttpApiError/Unauthorized";

    expect(formatHttpApiCliCause(Cause.fail(error))).toContain(
      "effect/HttpApiError/Unauthorized",
    );
  });
});
