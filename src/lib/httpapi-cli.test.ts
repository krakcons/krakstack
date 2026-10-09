import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema, Stream } from "effect";
import { TestConsole } from "effect/testing";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/http-api";

import {
  encodeHttpApiOperationResult,
  type HttpApiAdapterService,
} from "./httpapi-adapter";
import { httpApiAdapterTestLayer } from "./httpapi-adapter.test-utils";
import { makeHttpApiCli } from "./httpapi-cli";
import { httpApiCliEnvironmentLayer } from "./httpapi-cli.test-utils";

const OutputApi = HttpApi.make("output").add(
  HttpApiGroup.make("events").add(
    HttpApiEndpoint.get("stream", "/events", { success: Schema.Json }),
  ),
);

const client: Pick<HttpApiAdapterService, "execute" | "encodeResult"> = {
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

describe("CLI result output", () => {
  it.effect("pretty prints ordinary responses", () =>
    Effect.gen(function* () {
      const { run } = yield* makeHttpApiCli();
      const args = ["events", "stream"];
      yield* run(args).pipe(Effect.provide(httpApiCliEnvironmentLayer(args)));

      expect(yield* TestConsole.logLines).toEqual([
        '{\n  "status": "ready"\n}',
      ]);
    }).pipe(
      Effect.provide(
        httpApiAdapterTestLayer(OutputApi, {
          ...client,
          execute: () => Effect.succeed({ status: "ready" }),
        }),
      ),
      Effect.provide(TestConsole.layer),
    ),
  );

  it.effect("prints stream events as NDJSON without a trailing result", () =>
    Effect.gen(function* () {
      const { run } = yield* makeHttpApiCli();
      const args = ["events", "stream"];
      yield* run(args).pipe(Effect.provide(httpApiCliEnvironmentLayer(args)));

      expect(yield* TestConsole.logLines).toEqual([
        '{"_tag":"progress","current":1}',
        '{"_tag":"progress","current":2}',
      ]);
    }).pipe(
      Effect.provide(
        httpApiAdapterTestLayer(OutputApi, {
          ...client,
          execute: () =>
            Effect.succeed(
              Stream.make(
                { _tag: "progress", current: 1 },
                { _tag: "progress", current: 2 },
              ),
            ),
        }),
      ),
      Effect.provide(TestConsole.layer),
    ),
  );
});

describe("generated HttpApi commands", () => {
  it.effect("propagates execution failures to the caller", () => {
    const error = new Error("Request failed");
    return Effect.gen(function* () {
      const { run } = yield* makeHttpApiCli();
      const args = ["events", "stream"];
      const failure = yield* run(args).pipe(
        Effect.provide(httpApiCliEnvironmentLayer(args)),
        Effect.flip,
      );
      expect(failure).toBe(error);
    }).pipe(
      Effect.provide(
        httpApiAdapterTestLayer(OutputApi, {
          ...client,
          execute: () => Effect.fail(error),
        }),
      ),
      Effect.provide(TestConsole.layer),
    );
  });

  it.effect("runs with the version from API metadata", () =>
    Effect.gen(function* () {
      const { run } = yield* makeHttpApiCli();
      const args = ["--version"];
      yield* run(args).pipe(Effect.provide(httpApiCliEnvironmentLayer(args)));
      expect(yield* TestConsole.logLines).toEqual(["test-service-api v1.2.3"]);
    }).pipe(
      Effect.provide(httpApiAdapterTestLayer(TestApi, client)),
      Effect.provide(TestConsole.layer),
    ),
  );

  it.effect("normalizes acronym endpoint names to kebab-case", () =>
    Effect.gen(function* () {
      const { command } = yield* makeHttpApiCli();
      const group = command.subcommands[0]?.commands.find(
        ({ name }) => name === "resources",
      );
      expect(group?.subcommands[0]?.commands.map(({ name }) => name)).toContain(
        "list-http-resources",
      );
    }).pipe(
      Effect.provide(
        httpApiAdapterTestLayer(
          HttpApi.make("names").add(
            HttpApiGroup.make("resources").add(
              HttpApiEndpoint.get("listHTTPResources", "/resources", {
                success: Schema.Json,
              }),
            ),
          ),
        ),
      ),
    ),
  );

  it.effect(
    "assembles typed operation input from positional arguments and flags",
    () => {
      let receivedInput: unknown;
      const clientLayer = httpApiAdapterTestLayer(TestApi, {
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
        const { command, run } = yield* makeHttpApiCli();
        expect(command.name).toBe("test-service-api");
        expect(
          command.subcommands[0]?.commands.map(({ name }) => name),
        ).toContain("test-items");

        yield* run(args).pipe(Effect.provide(httpApiCliEnvironmentLayer(args)));

        expect(receivedInput).toEqual({
          body: {
            count: 3,
            displayName: "Example",
            metadata: { owner: "test" },
          },
          params: { itemId: "item-1" },
          query: { includeArchived: true, page: 2 },
        });
        expect(yield* TestConsole.logLines).toEqual(['"created"']);
      }).pipe(Effect.provide(clientLayer), Effect.provide(TestConsole.layer));
    },
  );
});
