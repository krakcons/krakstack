import { describe, expect, it } from "@effect/vitest";
import { Cause, Effect, Layer, Schema, Stream } from "effect";
import { TestConsole } from "effect/testing";
import { Command } from "effect/unstable/cli";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";

import {
  ApiClient,
  encodeHttpApiOperationResult,
  type ApiClientService,
} from "./httpapi-client";
import {
  formatHttpApiCliCause,
  httpApiCliEnvironmentLayer,
  makeHttpApiCliCommand,
  printHttpApiCliResult,
  toHttpApiCliName,
} from "./httpapi-cli";
import { HttpApiSpec, type HttpApiOperationEntry } from "./httpapi-helpers";

const operation: HttpApiOperationEntry = {
  method: "get",
  path: "/events",
  operation: { operationId: "events.stream" },
};

const client: ApiClientService = {
  encodeResult: (result) => encodeHttpApiOperationResult(result),
  execute: () => Effect.die("Not used"),
};

class CreateItem extends Schema.Class<CreateItem>("CreateItem")({
  displayName: Schema.NonEmptyString,
  count: Schema.Int,
  metadata: Schema.optionalKey(Schema.Record(Schema.String, Schema.String)),
}) {}

const TestApi = HttpApi.make("TestApi")
  .annotateMerge(
    OpenApi.annotations({
      title: "Test Service API",
      version: "1.2.3",
    }),
  )
  .add(
    HttpApiGroup.make("testItems").add(
      HttpApiEndpoint.post("createItem", "/items/:itemId", {
        params: Schema.Struct({ itemId: Schema.NonEmptyString }),
        query: Schema.Struct({
          page: Schema.optionalKey(Schema.Int),
          includeArchived: Schema.optionalKey(Schema.Boolean),
        }),
        payload: CreateItem,
        success: Schema.String,
      }),
    ),
  );

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

  it("omits Effect stack traces", () => {
    expect(formatHttpApiCliCause(Cause.fail(new Error("Request failed")))).toBe(
      "Error: Request failed",
    );
  });
});

describe("generated HttpApi commands", () => {
  it("normalizes names to kebab-case", () => {
    expect(toHttpApiCliName("listHTTPResources")).toBe("list-http-resources");
    expect(toHttpApiCliName("Test Service API")).toBe("test-service-api");
  });

  it.effect(
    "assembles typed operation input from positional arguments and flags",
    () => {
      let receivedInput: unknown;
      const specLayer = HttpApiSpec.layer({ api: TestApi });
      const clientLayer = Layer.succeed(ApiClient, {
        encodeResult: (result) => encodeHttpApiOperationResult(result),
        execute: ({ input }) => {
          receivedInput = input;
          return Effect.succeed("created");
        },
      });
      const args = [
        "test-items",
        "create-item",
        "item-1",
        "--page",
        "2",
        "--include-archived",
        "--display-name",
        "Example",
        "--count",
        "3",
        "--metadata",
        '{"owner":"test"}',
      ];

      return Effect.gen(function* () {
        const command = yield* makeHttpApiCliCommand();
        expect(command.name).toBe("test-service-api");
        expect(
          command.subcommands[0]?.commands.map(({ name }) => name),
        ).toContain("test-items");

        yield* Command.runWith(command, { version: "1.2.3" })(args).pipe(
          Effect.provide(httpApiCliEnvironmentLayer(args)),
        );

        expect(receivedInput).toEqual({
          body: {
            count: 3,
            displayName: "Example",
            metadata: { owner: "test" },
          },
          headers: {},
          params: { itemId: "item-1" },
          query: { includeArchived: true, page: 2 },
        });
        expect(yield* TestConsole.logLines).toEqual(['"created"']);
      }).pipe(
        Effect.provide(specLayer),
        Effect.provide(clientLayer),
        Effect.provide(TestConsole.layer),
      );
    },
  );
});
