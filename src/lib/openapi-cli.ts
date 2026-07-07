import {
  Console,
  Context,
  Effect,
  FileSystem,
  Layer,
  Path,
  Schema,
  Stdio,
  Stream,
  Terminal,
} from "effect";
import { Command, Flag } from "effect/unstable/cli";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";
import { OpenApi } from "effect/unstable/httpapi";
import { ChildProcessSpawner } from "effect/unstable/process/ChildProcessSpawner";

const JsonObjectSchema = Schema.Record(Schema.String, Schema.Unknown).annotate({
  identifier: "OpenApiCliJsonObject",
  title: "CLI JSON Object",
  description: "A JSON object passed to the CLI.",
  examples: [{ id: "example-id" }],
});
const JsonObjectFromString = Schema.fromJsonString(JsonObjectSchema);
const JsonResponseFromString = Schema.fromJsonString(Schema.Unknown);

type JsonObject = typeof JsonObjectSchema.Type;
type OpenApiSpec = ReturnType<typeof OpenApi.fromApi>;
type OpenApiMethod = "get" | "post" | "put" | "patch" | "delete";
type OpenApiParameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
};
type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: ReadonlyArray<OpenApiParameter>;
  tags?: ReadonlyArray<string>;
};
type CliOperation = {
  groupName: string;
  groupTitle: string;
  name: string;
  method: string;
  path: string;
  summary: string;
  operation: OpenApiOperation;
};
type CliOperationGroup = {
  name: string;
  title: string;
  operations: ReadonlyArray<CliOperation>;
};
type CallOperationConfig = {
  readonly params: string;
  readonly query: string;
  readonly apiKey: string;
  readonly baseUrl: string;
};
export type OpenApiCliConfig = {
  readonly api: Parameters<typeof OpenApi.fromApi>[0];
  readonly name: string;
  readonly version: string;
  readonly baseUrl: string;
  readonly description?: string;
  readonly serviceName?: string;
  readonly apiKeyEnv?: string;
  readonly apiKeyHeader?: string;
  readonly methods?: ReadonlyArray<OpenApiMethod>;
};

export class OpenApiCli extends Context.Service<OpenApiCli>()("OpenApiCli", {
  make: (config: OpenApiCliConfig) =>
    Effect.sync(() => {
      const command = makeOpenApiCliCommand(config);

      return {
        command,
        run: (args: ReadonlyArray<string>) =>
          Command.runWith(command, { version: config.version })(args),
      };
    }),
}) {
  static readonly layer = (config: OpenApiCliConfig) =>
    Layer.effect(this, this.make(config)).pipe(
      Layer.provide(FetchHttpClient.layer),
    );
}

const toError = (message: string, error: unknown) =>
  error instanceof Error ? error : new Error(`${message}: ${String(error)}`);

const sanitizeName = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const fallbackName = (value: string, fallback: string) =>
  sanitizeName(value) || fallback;

const operationIdParts = (operation: OpenApiOperation) =>
  operation.operationId?.split(".").filter(Boolean) ?? [];

const operationGroupName = (operation: OpenApiOperation) =>
  fallbackName(
    operationIdParts(operation)[0] ?? operation.tags?.[0] ?? "default",
    "default",
  );

const operationGroupTitle = (operation: OpenApiOperation) =>
  operation.tags?.[0] ?? operationGroupName(operation);

const operationName = (
  method: string,
  path: string,
  operation: OpenApiOperation,
) =>
  fallbackName(
    operationIdParts(operation).at(-1) ??
      `${method}_${path.replace(/^\/api\//, "").replace(/[/:{}]/g, "_")}`,
    `${method}_operation`,
  );

export const openApiCliOperations = ({
  spec,
  methods = ["get"],
}: {
  readonly spec: OpenApiSpec;
  readonly methods?: ReadonlyArray<OpenApiMethod>;
}): ReadonlyArray<CliOperation> => {
  const operations: Array<CliOperation> = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of methods) {
      const operation = pathItem[method] as OpenApiOperation | undefined;
      if (!operation) continue;

      operations.push({
        groupName: operationGroupName(operation),
        groupTitle: operationGroupTitle(operation),
        name: operationName(method, path, operation),
        method: method.toUpperCase(),
        path,
        summary: operation.summary ?? operation.description ?? "",
        operation,
      });
    }
  }

  return operations;
};

export const openApiCliOperationGroups = (
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

const parseJsonObject = Effect.fn("OpenApiCli.parseJsonObject")(function* (
  value: string | undefined,
  label: string,
) {
  if (!value) return {};

  return yield* Schema.decodeUnknownEffect(JsonObjectFromString)(value).pipe(
    Effect.mapError(() => new Error(`${label} must be a JSON object`)),
  );
});

const renderPath = Effect.fn("OpenApiCli.renderPath")(function* (
  path: string,
  params: JsonObject,
) {
  return yield* Effect.try({
    try: () =>
      path.replace(/\{([^}]+)\}|:([A-Za-z0-9_]+)/g, (_, braced, colon) => {
        const key = braced || colon;
        const value = params[key];

        if (value === undefined || value === null) {
          throw new Error(`Missing path parameter: ${key}`);
        }

        return encodeURIComponent(String(value));
      }),
    catch: (error) => toError("Failed to render API path", error),
  });
});

const appendQuery = (url: URL, query: JsonObject) => {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
};

const buildUrl = Effect.fn("OpenApiCli.buildUrl")(function* (
  operation: CliOperation,
  params: JsonObject,
  query: JsonObject,
  baseUrl: string,
) {
  const path = yield* renderPath(operation.path, params);
  return yield* Effect.try({
    try: () => {
      const url = new URL(path, baseUrl);
      appendQuery(url, query);
      return url;
    },
    catch: (error) => toError("Failed to build API URL", error),
  });
});

const requestForOperation = (operation: CliOperation, url: URL) => {
  switch (operation.method) {
    case "DELETE":
      return HttpClientRequest.delete(url);
    case "PATCH":
      return HttpClientRequest.patch(url);
    case "POST":
      return HttpClientRequest.post(url);
    case "PUT":
      return HttpClientRequest.put(url);
    default:
      return HttpClientRequest.get(url);
  }
};

const fetchOperation = Effect.fn("OpenApiCli.fetchOperation")(function* (
  operation: CliOperation,
  url: URL,
  apiKey: string | undefined,
  config: Pick<OpenApiCliConfig, "apiKeyHeader" | "serviceName">,
) {
  const http = yield* HttpClient.HttpClient;
  const apiKeyHeader = config.apiKeyHeader ?? "x-api-key";
  const serviceName = config.serviceName ?? "API";

  return yield* requestForOperation(operation, url).pipe(
    HttpClientRequest.acceptJson,
    HttpClientRequest.setHeaders(apiKey ? { [apiKeyHeader]: apiKey } : {}),
    (request) => http.execute(request),
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((response) => response.text),
    Effect.mapError((error) => toError(`Failed to call ${serviceName}`, error)),
  );
});

const formatResponse = Effect.fn("OpenApiCli.formatResponse")(function* (
  text: string,
) {
  if (!text) return "null";

  const parsed = yield* Schema.decodeUnknownEffect(JsonResponseFromString)(
    text,
  ).pipe(
    Effect.mapError((error) => toError("Failed to format API response", error)),
  );

  return JSON.stringify(parsed, null, 2);
});

const print = (value: string) => Console.log(value);

const formatOperations = (operations: ReadonlyArray<CliOperation>) =>
  operations
    .map(
      (operation) =>
        `${operation.groupName}\t${operation.name}\t${operation.method}\t${operation.path}\t${operation.summary}`,
    )
    .join("\n");

const listOperations = (operations: ReadonlyArray<CliOperation>) =>
  print(formatOperations(operations));

const callOperation = (
  operation: CliOperation,
  callConfig: CallOperationConfig,
  cliConfig: Pick<
    OpenApiCliConfig,
    "apiKeyEnv" | "apiKeyHeader" | "serviceName"
  >,
) =>
  Effect.gen(function* () {
    const params = yield* parseJsonObject(callConfig.params, "--params");
    const query = yield* parseJsonObject(callConfig.query, "--query");
    const apiKey = callConfig.apiKey || process.env[cliConfig.apiKeyEnv ?? ""];
    const baseUrl = callConfig.baseUrl;
    const url = yield* buildUrl(operation, params, query, baseUrl);
    const text = yield* fetchOperation(operation, url, apiKey, cliConfig);
    const formatted = yield* formatResponse(text);

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

const operationCommand = (operation: CliOperation, config: OpenApiCliConfig) =>
  Command.make(
    operation.name,
    {
      params: Flag.string("params").pipe(
        Flag.withDefault("{}"),
        Flag.withDescription("JSON object for path parameters"),
      ),
      query: Flag.string("query").pipe(
        Flag.withDefault("{}"),
        Flag.withDescription("JSON object for query parameters"),
      ),
      apiKey: Flag.string("api-key").pipe(
        Flag.withDefault(process.env[config.apiKeyEnv ?? ""] ?? ""),
        Flag.withDescription(
          `API key sent as ${config.apiKeyHeader ?? "x-api-key"}${config.apiKeyEnv ? `; defaults to ${config.apiKeyEnv}` : ""}`,
        ),
      ),
      baseUrl: Flag.string("base-url").pipe(
        Flag.withDefault(config.baseUrl),
        Flag.withDescription("API base URL"),
      ),
    },
    (callConfig) => callOperation(operation, callConfig, config),
  ).pipe(
    Command.withDescription(
      operation.summary || `${operation.method} ${operation.path}`,
    ),
  );

const groupCommand = (group: CliOperationGroup, config: OpenApiCliConfig) =>
  Command.make(group.name).pipe(
    Command.withDescription(group.title),
    Command.withSubcommands([
      groupListCommand(group),
      ...group.operations.map((operation) =>
        operationCommand(operation, config),
      ),
    ]),
  );

export const makeOpenApiCliCommand = (config: OpenApiCliConfig) => {
  const operations = openApiCliOperations({
    spec: OpenApi.fromApi(config.api),
    methods: config.methods,
  });
  const groups = openApiCliOperationGroups(operations);

  return Command.make(config.name).pipe(
    Command.withDescription(config.description ?? `${config.name} CLI`),
    Command.withSubcommands([
      listCommand(groups),
      ...groups.map((group) => groupCommand(group, config)),
    ]),
  );
};

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

export const openApiCliEnvironmentLayer = (args: ReadonlyArray<string>) =>
  cliEnvironmentLayer(args);

export const openApiCli = (args = process.argv.slice(2)) =>
  Effect.gen(function* () {
    const cli = yield* OpenApiCli;
    return yield* cli.run(args);
  });

export const runOpenApiCli = (
  layer: Layer.Layer<OpenApiCli>,
  args = process.argv.slice(2),
) => {
  Effect.runPromise(
    openApiCli(args).pipe(
      Effect.provide(layer),
      Effect.provide(openApiCliEnvironmentLayer(args)),
    ),
  ).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
};
