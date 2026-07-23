import {
  Console,
  Context,
  Effect,
  FileSystem,
  Layer,
  Path,
  Stdio,
  Stream,
  Terminal,
} from "effect";
import { Command, Flag } from "effect/unstable/cli";
import { ChildProcessSpawner } from "effect/unstable/process/ChildProcessSpawner";

import { ApiClient, type ApiClientService } from "@/lib/httpapi-client";
import {
  HttpApiSpec,
  parseJsonObject,
  parseJsonValue,
  sanitizeHttpName,
  type HttpApiMethod,
  type HttpApiOperation,
  type HttpApiOperationEntry,
} from "@/lib/httpapi-helpers";

type CliOperation = {
  groupName: string;
  groupTitle: string;
  name: string;
  method: HttpApiMethod;
  path: string;
  summary: string;
  operation: HttpApiOperation;
};
type CliOperationGroup = {
  name: string;
  title: string;
  operations: ReadonlyArray<CliOperation>;
};
type CallOperationConfig = {
  readonly body: string;
  readonly headers: string;
  readonly params: string;
  readonly query: string;
};
export class HttpApiCli extends Context.Service<HttpApiCli>()("HttpApiCli", {
  make: () =>
    Effect.gen(function* () {
      const spec = yield* HttpApiSpec;
      const command = yield* makeHttpApiCliCommand();

      return {
        command,
        run: (args: ReadonlyArray<string>) =>
          Command.runWith(command, { version: spec.info.version })(args),
      };
    }),
}) {
  static readonly layer = Layer.effect(this, this.make());
}

const fallbackName = (value: string, fallback: string) =>
  sanitizeHttpName(value) || fallback;

const operationIdParts = (operation: HttpApiOperation) =>
  operation.operationId?.split(".").filter(Boolean) ?? [];

const operationGroupName = (operation: HttpApiOperation) =>
  fallbackName(
    operationIdParts(operation)[0] ?? operation.tags?.[0] ?? "default",
    "default",
  );

const operationGroupTitle = (operation: HttpApiOperation) =>
  operation.tags?.[0] ?? operationGroupName(operation);

const operationName = (
  method: string,
  path: string,
  operation: HttpApiOperation,
) =>
  fallbackName(
    operationIdParts(operation).at(-1) ??
      `${method}_${path.replace(/^\/api\//, "").replace(/[/:{}]/g, "_")}`,
    `${method}_operation`,
  );

const toCliOperation = ({
  method,
  operation,
  path,
}: HttpApiOperationEntry): CliOperation => ({
  groupName: operationGroupName(operation),
  groupTitle: operationGroupTitle(operation),
  name: operationName(method, path, operation),
  method,
  path,
  summary: operation.summary ?? operation.description ?? "",
  operation,
});

const httpApiCliOperationGroups = (
  operations: ReadonlyArray<CliOperation>,
): ReadonlyArray<CliOperationGroup> => {
  const groups = new Map<
    string,
    CliOperationGroup & { operations: Array<CliOperation> }
  >();

  for (const operation of operations) {
    const group = groups.get(operation.groupName);

    if (group) {
      group.operations.push(operation);
    } else {
      groups.set(operation.groupName, {
        name: operation.groupName,
        title: operation.groupTitle,
        operations: [operation],
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      operations: Array.from(group.operations).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const print = (value: string) => Console.log(value);

const formatOperations = (operations: ReadonlyArray<CliOperation>) =>
  operations
    .map(
      (operation) =>
        `${operation.groupName}\t${operation.name}\t${operation.method.toUpperCase()}\t${operation.path}\t${operation.summary}`,
    )
    .join("\n");

const listOperations = (operations: ReadonlyArray<CliOperation>) =>
  print(formatOperations(operations));

const callOperation = (
  operation: CliOperation,
  callConfig: CallOperationConfig,
  client: ApiClientService,
) =>
  Effect.gen(function* () {
    const body = yield* parseJsonValue(callConfig.body, "--body");
    const headers = yield* parseJsonObject(callConfig.headers, "--headers");
    const params = yield* parseJsonObject(callConfig.params, "--params");
    const query = yield* parseJsonObject(callConfig.query, "--query");
    const response = yield* client.execute({
      operation: {
        method: operation.method,
        path: operation.path,
        operation: operation.operation,
      },
      input: { body, headers, params, query },
    });
    const formatted = JSON.stringify(response, null, 2) ?? "null";

    return yield* print(formatted);
  });

const listCommand = (groups: ReadonlyArray<CliOperationGroup>) =>
  Command.make("list", {}, () =>
    print(
      groups
        .map(
          (group) =>
            `${group.name}\t${group.title}\t${group.operations.length}`,
        )
        .join("\n"),
    ),
  ).pipe(Command.withDescription("List command groups"));

const groupListCommand = (group: CliOperationGroup) =>
  Command.make("list", {}, () => listOperations(group.operations)).pipe(
    Command.withDescription(`List ${group.title} operations`),
  );

const operationCommand = (operation: CliOperation, client: ApiClientService) =>
  Command.make(
    operation.name,
    {
      body: Flag.string("body").pipe(
        Flag.withDefault(""),
        Flag.withDescription("JSON request body"),
      ),
      headers: Flag.string("headers").pipe(
        Flag.withDefault("{}"),
        Flag.withDescription("JSON object for request headers"),
      ),
      params: Flag.string("params").pipe(
        Flag.withDefault("{}"),
        Flag.withDescription("JSON object for path parameters"),
      ),
      query: Flag.string("query").pipe(
        Flag.withDefault("{}"),
        Flag.withDescription("JSON object for query parameters"),
      ),
    },
    (callConfig) => callOperation(operation, callConfig, client),
  ).pipe(
    Command.withDescription(
      operation.summary ||
        `${operation.method.toUpperCase()} ${operation.path}`,
    ),
  );

const groupCommand = (group: CliOperationGroup, client: ApiClientService) =>
  Command.make(group.name).pipe(
    Command.withDescription(group.title),
    Command.withSubcommands([
      groupListCommand(group),
      ...group.operations.map((operation) =>
        operationCommand(operation, client),
      ),
    ]),
  );

export const makeHttpApiCliCommand = Effect.fn("HttpApiCli.makeCommand")(
  function* () {
    const spec = yield* HttpApiSpec;
    const client = yield* ApiClient;
    const name = sanitizeHttpName(spec.info.title);
    const groups = httpApiCliOperationGroups(
      spec.operations.map(toCliOperation),
    );

    return Command.make(name).pipe(
      Command.withDescription(spec.info.description ?? spec.info.title),
      Command.withSubcommands([
        listCommand(groups),
        ...groups.map((group) => groupCommand(group, client)),
      ]),
    );
  },
);

const cliEnvironmentLayer = (args: ReadonlyArray<string>) =>
  Layer.mergeAll(
    FileSystem.layerNoop({}),
    Path.layer,
    Stdio.layerTest({ args: Effect.succeed(Array.from(args)) }),
    Layer.succeed(
      Terminal.Terminal,
      Terminal.make({
        columns: Effect.sync(() => process.stdout.columns ?? 80),
        rows: Effect.sync(() => process.stdout.rows ?? 24),
        readInput: Effect.die("Terminal input is not supported"),
        readLine: Effect.die("Terminal input is not supported"),
        display: (text) => Effect.sync(() => process.stdout.write(text)),
      }),
    ),
    Layer.succeed(
      ChildProcessSpawner,
      ChildProcessSpawner.of({
        spawn: () => Effect.die("Child processes are not supported"),
        exitCode: () => Effect.die("Child processes are not supported"),
        streamString: () => Stream.die("Child processes are not supported"),
        streamLines: () => Stream.die("Child processes are not supported"),
        lines: () => Effect.die("Child processes are not supported"),
        string: () => Effect.die("Child processes are not supported"),
      }),
    ),
  );

export const httpApiCliEnvironmentLayer = (args: ReadonlyArray<string>) =>
  cliEnvironmentLayer(args);

export const httpApiCli = (args = process.argv.slice(2)) =>
  Effect.gen(function* () {
    const cli = yield* HttpApiCli;
    return yield* cli.run(args);
  });

export const runHttpApiCli = <E>(
  layer: Layer.Layer<HttpApiCli, E>,
  args = process.argv.slice(2),
) => {
  Effect.runPromise(
    httpApiCli(args).pipe(
      Effect.provide(layer),
      Effect.provide(httpApiCliEnvironmentLayer(args)),
    ),
  ).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
};
