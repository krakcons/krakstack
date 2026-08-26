import {
  Cause,
  Console,
  Context,
  Effect,
  Exit,
  FileSystem,
  JsonSchema,
  Layer,
  Option,
  Path,
  Schema,
  Stdio,
  Stream,
  Terminal,
} from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";
import { ChildProcessSpawner } from "effect/unstable/process/ChildProcessSpawner";

import { ApiClient, type ApiClientService } from "@/lib/httpapi-client";
import {
  HttpApiSpec,
  type HttpApiMethod,
  type HttpApiOperation,
  type HttpApiOperationEntry,
} from "@/lib/httpapi-helpers";
import type { Json } from "effect/Schema";

type CliOperation = {
  groupName: string;
  groupTitle: string;
  name: string;
  method: HttpApiMethod;
  path: string;
  summary: string;
  operation: HttpApiOperation;
  inputSchema: Schema.Codec<unknown, unknown>;
  inputJsonSchema: JsonSchema.JsonSchema;
};
type CliOperationGroup = {
  name: string;
  title: string;
  operations: ReadonlyArray<CliOperation>;
};
type CliInputLocation = "body" | "headers" | "params" | "query";
type CliInput = {
  readonly configKey: string;
  readonly location: CliInputLocation;
  readonly name: string;
  readonly optionName: string;
  readonly wireString: boolean;
  readonly param: Argument.Argument<unknown> | Flag.Flag<unknown>;
};
type CliValues = Record<string, Json>;
type RawCliInput = {
  body?: Json;
  headers?: CliValues;
  params?: CliValues;
  query?: CliValues;
};

const CliJsonSchema = Schema.Struct({
  type: Schema.optional(
    Schema.Union([Schema.String, Schema.Array(Schema.String)]),
  ),
  description: Schema.optional(Schema.String),
  enum: Schema.optional(Schema.Array(Schema.Json)),
  items: Schema.optional(Schema.Json),
  properties: Schema.optional(Schema.Record(Schema.String, Schema.Json)),
  required: Schema.optional(Schema.Array(Schema.String)),
  pattern: Schema.optional(Schema.String),
  allOf: Schema.optional(Schema.Array(Schema.Json)),
  anyOf: Schema.optional(Schema.Array(Schema.Json)),
  $ref: Schema.optional(Schema.String),
  $defs: Schema.optional(Schema.Record(Schema.String, Schema.Json)),
}).annotate({ identifier: "HttpApiCliJsonSchema" });
type CliJsonSchema = typeof CliJsonSchema.Type;

const decodeCliJsonSchema = Schema.decodeUnknownOption(CliJsonSchema);
const JsonFromString = Schema.fromJsonString(Schema.Json);
const CliParsedOption = Schema.declare(
  (value): value is Option.Option<Json> =>
    Option.isOption(value) &&
    Option.match(value, {
      onNone: () => true,
      onSome: Schema.is(Schema.Json),
    }),
).annotate({ identifier: "HttpApiCliParsedOption" });
const CliParsedConfig = Schema.Record(
  Schema.String,
  Schema.Union([Schema.Json, CliParsedOption]),
).annotate({ identifier: "HttpApiCliParsedConfig" });
type CliParsedConfig = typeof CliParsedConfig.Type;
const DecodedOperationInput = Schema.Struct({
  body: Schema.optional(Schema.Unknown),
  headers: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  params: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  query: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
}).annotate({ identifier: "HttpApiCliDecodedOperationInput" });
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

export const toHttpApiCliName = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const fallbackName = (value: string, fallback: string) =>
  toHttpApiCliName(value) || fallback;

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
  inputJsonSchema,
  inputSchema,
  method,
  operation,
  path,
}: HttpApiOperationEntry & {
  readonly inputSchema: Schema.Codec<unknown, unknown>;
  readonly inputJsonSchema: JsonSchema.JsonSchema;
}): CliOperation => ({
  groupName: operationGroupName(operation),
  groupTitle: operationGroupTitle(operation),
  name: operationName(method, path, operation),
  method,
  path,
  summary: operation.summary ?? operation.description ?? "",
  operation,
  inputSchema,
  inputJsonSchema,
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
      if (group.operations.some((entry) => entry.name === operation.name)) {
        throw new Error(
          `Duplicate CLI command ${operation.groupName} ${operation.name}`,
        );
      }
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
  [
    "GROUP\tCOMMAND\tMETHOD\tPATH\tSUMMARY",
    ...operations.map(
      (operation) =>
        `${operation.groupName}\t${operation.name}\t${operation.method.toUpperCase()}\t${operation.path}\t${operation.summary}`,
    ),
  ].join("\n");

const listOperations = (operations: ReadonlyArray<CliOperation>) =>
  print(formatOperations(operations));

type CliJsonSchemaSource = Json | JsonSchema.JsonSchema | undefined;

const cliJsonSchema = (value: CliJsonSchemaSource): CliJsonSchema =>
  decodeCliJsonSchema(value).pipe(Option.getOrElse(() => ({})));

const effectiveSchema = (schema: CliJsonSchema): CliJsonSchema => {
  const variant = (schema.anyOf ?? [])
    .map(cliJsonSchema)
    .find((candidate) => schemaType(candidate) !== "null");
  return variant
    ? {
        ...variant,
        description: schema.description ?? variant.description,
      }
    : schema;
};

const schemaType = (schema: CliJsonSchema): string | undefined => {
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (type || !schema.anyOf) return type;
  return schemaType(effectiveSchema(schema));
};

const schemaEnum = (schema: CliJsonSchema): ReadonlyArray<string> =>
  Schema.decodeUnknownOption(Schema.Array(Schema.String))(
    effectiveSchema(schema).enum,
  ).pipe(Option.getOrElse((): ReadonlyArray<string> => []));

const hasNumericPattern = (schema: CliJsonSchema): boolean => {
  const effective = effectiveSchema(schema);
  if (effective.pattern?.includes("\\d")) return true;
  return (effective.allOf ?? []).some((part) =>
    hasNumericPattern(cliJsonSchema(part)),
  );
};

const isBooleanSchema = (schema: CliJsonSchema) => {
  const values = schemaEnum(schema);
  return (
    schemaType(schema) === "boolean" ||
    (values.includes("true") && values.includes("false"))
  );
};

const jsonFlag = (name: string) =>
  Flag.string(name).pipe(
    Flag.mapTryCatch(
      (value) => Schema.decodeUnknownSync(JsonFromString)(value),
      () => `--${name} must be valid JSON`,
    ),
  );

const primitiveFlag = (
  name: string,
  schema: CliJsonSchema,
  required: boolean,
) => {
  const type = schemaType(schema);
  const choices = schemaEnum(schema);
  let flag: Flag.Flag<unknown>;

  if (isBooleanSchema(schema)) {
    flag = required
      ? Flag.choice(name, ["true", "false"]).pipe(
          Flag.map((value) => value === "true"),
        )
      : Flag.boolean(name);
  } else if (choices.length > 0) {
    flag = Flag.choice(name, choices);
  } else if (type === "integer") {
    flag = Flag.integer(name);
  } else if (type === "number" || hasNumericPattern(schema)) {
    flag = Flag.float(name);
  } else if (type === "object" || type === "array") {
    flag = jsonFlag(name);
  } else {
    flag = Flag.string(name);
  }

  const documented = flag.pipe(
    Flag.withMetavar(
      type === "object" || type === "array" ? "JSON" : name.toUpperCase(),
    ),
  );
  const described = schema.description
    ? documented.pipe(Flag.withDescription(schema.description))
    : documented;
  return required ? described : described.pipe(Flag.optional);
};

const primitiveArgument = (name: string, schema: CliJsonSchema) => {
  const type = schemaType(schema);
  const choices = schemaEnum(schema);
  let argument: Argument.Argument<unknown>;

  if (choices.length > 0) {
    argument = Argument.choice(name, choices);
  } else if (type === "integer") {
    argument = Argument.integer(name);
  } else if (type === "number" || hasNumericPattern(schema)) {
    argument = Argument.float(name);
  } else {
    argument = Argument.string(name);
  }

  const documented = argument.pipe(Argument.withMetavar(name.toUpperCase()));
  return schema.description
    ? documented.pipe(Argument.withDescription(schema.description))
    : documented;
};

type CliInputDraft = {
  readonly location: CliInputLocation;
  readonly name: string;
  readonly preferredName: string;
  readonly required: boolean;
  readonly schema: CliJsonSchema;
};

const operationInputDrafts = (operation: CliOperation) => {
  const document = cliJsonSchema(operation.inputJsonSchema);
  const definitions = document.$defs ?? {};
  const resolveSchema = (value: CliJsonSchemaSource) => {
    const schema = cliJsonSchema(value);
    const name = schema.$ref?.match(
      /^#\/(?:\$defs|components\/schemas)\/(.+)$/,
    )?.[1];
    return name && definitions[name]
      ? effectiveSchema(cliJsonSchema(definitions[name]))
      : effectiveSchema(schema);
  };
  const properties = document.properties ?? {};
  const drafts: Array<CliInputDraft> = (
    operation.operation.parameters ?? []
  ).flatMap((parameter) => {
    if (parameter.in === "cookie") return [];
    const location =
      parameter.in === "path"
        ? "params"
        : parameter.in === "header"
          ? "headers"
          : "query";
    return [
      {
        location,
        name: parameter.name,
        preferredName: fallbackName(parameter.name, location),
        required: parameter.required ?? false,
        schema: resolveSchema(properties[parameter.name] ?? parameter.schema),
      },
    ];
  });
  const body = resolveSchema(
    properties.body ??
      operation.operation.requestBody?.content?.["application/json"]?.schema,
  );

  if (schemaType(body) === "object" && body.properties) {
    const required = new Set(body.required ?? []);
    for (const [name, schema] of Object.entries(body.properties)) {
      drafts.push({
        location: "body",
        name,
        preferredName: fallbackName(name, "body"),
        required: required.has(name),
        schema: resolveSchema(schema),
      });
    }
  } else if (operation.operation.requestBody) {
    drafts.push({
      location: "body",
      name: "body",
      preferredName: "body",
      required: operation.operation.requestBody.required ?? false,
      schema: body,
    });
  }

  return drafts;
};

const operationInputs = (operation: CliOperation): ReadonlyArray<CliInput> => {
  const drafts = operationInputDrafts(operation);
  const preferredCounts = new Map<string, number>();
  for (const draft of drafts) {
    if (draft.location === "params") continue;
    preferredCounts.set(
      draft.preferredName,
      (preferredCounts.get(draft.preferredName) ?? 0) + 1,
    );
  }
  const optionNames = new Set<string>();

  return drafts.map((draft, index) => {
    const optionName =
      draft.location === "params" ||
      preferredCounts.get(draft.preferredName) === 1
        ? draft.preferredName
        : `${draft.location.replace(/s$/, "")}-${draft.preferredName}`;
    if (draft.location !== "params" && optionNames.has(optionName)) {
      throw new Error(
        `Duplicate CLI option --${optionName} for ${operation.groupName} ${operation.name}`,
      );
    }
    optionNames.add(optionName);

    return {
      configKey: `input${index}`,
      location: draft.location,
      name: draft.name,
      optionName,
      wireString:
        draft.location !== "body" && schemaType(draft.schema) === "string",
      param:
        draft.location === "params"
          ? primitiveArgument(optionName, draft.schema)
          : primitiveFlag(optionName, draft.schema, draft.required),
    };
  });
};

type HttpApiCliResultStream = Stream.Stream<unknown, unknown>;

const HttpApiCliResultStream = Schema.declare(
  (value): value is HttpApiCliResultStream => Stream.isStream(value),
).annotate({ identifier: "HttpApiCliResultStream" });

export const printHttpApiCliResult = Effect.fn("HttpApiCli.printResult")(
  function* (
    response: ErrorOptions["cause"],
    operation: HttpApiOperationEntry,
    client: ApiClientService,
  ) {
    const stream = Schema.decodeUnknownOption(HttpApiCliResultStream)(response);
    if (stream._tag === "Some") {
      return yield* stream.value.pipe(
        Stream.mapEffect((event) => client.encodeResult(event, operation)),
        Stream.runForEach((event) => print(JSON.stringify(event))),
      );
    }

    const encoded = yield* client.encodeResult(response, operation);
    return yield* print(JSON.stringify(encoded, null, 2) ?? "null");
  },
);

const callOperation = (
  operation: CliOperation,
  inputs: ReadonlyArray<CliInput>,
  callConfig: CliParsedConfig,
  client: ApiClientService,
) =>
  Effect.gen(function* () {
    const emptyValues = (): CliValues => ({});
    const assembled = {
      body: emptyValues(),
      headers: emptyValues(),
      params: emptyValues(),
      query: emptyValues(),
    };
    for (const input of inputs) {
      const parsed = callConfig[input.configKey];
      const value = Option.isOption(parsed)
        ? Option.getOrUndefined(parsed)
        : parsed;
      if (value !== undefined) {
        assembled[input.location][input.name] = input.wireString
          ? String(value)
          : value;
      }
    }

    const bodyInput = inputs.some(
      (input) => input.location === "body" && input.name === "body",
    )
      ? assembled.body.body
      : Object.keys(assembled.body).length > 0 ||
          operation.operation.requestBody?.required
        ? assembled.body
        : undefined;
    const rawInput: RawCliInput = {};
    if (inputs.some((input) => input.location === "params")) {
      rawInput.params = assembled.params;
    }
    if (inputs.some((input) => input.location === "headers")) {
      rawInput.headers = assembled.headers;
    }
    if (inputs.some((input) => input.location === "query")) {
      rawInput.query = assembled.query;
    }
    if (bodyInput !== undefined) rawInput.body = bodyInput;

    const decoded = yield* Schema.decodeUnknownEffect(operation.inputSchema)(
      rawInput,
    ).pipe(
      Effect.mapError(
        (error) =>
          new Error(
            `Invalid input for ${operation.groupName} ${operation.name}: ${error.message}`,
          ),
      ),
    );
    const input = yield* Schema.decodeUnknownEffect(DecodedOperationInput)(
      decoded,
    );
    const response = yield* client.execute({
      operation: {
        method: operation.method,
        path: operation.path,
        operation: operation.operation,
      },
      input: {
        body: input.body,
        headers: input.headers ?? {},
        params: input.params ?? {},
        query: input.query ?? {},
      },
    });
    return yield* printHttpApiCliResult(
      response,
      {
        method: operation.method,
        path: operation.path,
        operation: operation.operation,
      },
      client,
    );
  });

const listCommand = (groups: ReadonlyArray<CliOperationGroup>) =>
  Command.make("list", {}, () =>
    print(
      [
        "GROUP\tTITLE\tCOMMANDS",
        ...groups.map(
          (group) =>
            `${group.name}\t${group.title}\t${group.operations.length}`,
        ),
      ].join("\n"),
    ),
  ).pipe(Command.withDescription("List command groups"));

const groupListCommand = (group: CliOperationGroup) =>
  Command.make("list", {}, () => listOperations(group.operations)).pipe(
    Command.withDescription(`List ${group.title} operations`),
  );

const operationCommand = (operation: CliOperation, client: ApiClientService) =>
  Effect.sync(() => {
    const inputs = operationInputs(operation);
    const config: Record<
      string,
      Argument.Argument<unknown> | Flag.Flag<unknown>
    > = Object.fromEntries(
      inputs.map((input) => [input.configKey, input.param]),
    );

    return Command.make(operation.name, config, (callConfig) =>
      Schema.decodeUnknownEffect(CliParsedConfig)(callConfig).pipe(
        Effect.flatMap((parsed) =>
          callOperation(operation, inputs, parsed, client),
        ),
      ),
    ).pipe(
      Command.withDescription(
        operation.summary ||
          `${operation.method.toUpperCase()} ${operation.path}`,
      ),
      Command.withExamples([
        {
          command: `${operation.groupName} ${operation.name}`,
          description: `${operation.method.toUpperCase()} ${operation.path}`,
        },
      ]),
    );
  });

const groupCommand = (group: CliOperationGroup, client: ApiClientService) =>
  Effect.all(
    group.operations.map((operation) => operationCommand(operation, client)),
  ).pipe(
    Effect.map((operationCommands) =>
      Command.make(group.name).pipe(
        Command.withDescription(group.title),
        Command.withSubcommands([
          groupListCommand(group),
          ...operationCommands,
        ]),
      ),
    ),
  );

export const makeHttpApiCliCommand = Effect.fn("HttpApiCli.makeCommand")(
  function* () {
    const spec = yield* HttpApiSpec;
    const client = yield* ApiClient;
    const name = fallbackName(spec.info.title, "api");
    const groups = yield* Effect.try({
      try: () =>
        httpApiCliOperationGroups(
          spec.operations.map((operation) =>
            toCliOperation({
              ...operation,
              inputSchema: spec.operationSchema(operation.operation),
              inputJsonSchema: spec.operationJsonSchema(operation.operation),
            }),
          ),
        ),
      catch: (error) =>
        error instanceof Error ? error : new Error(String(error)),
    });
    const groupCommands = yield* Effect.all(
      groups.map((group) => groupCommand(group, client)),
    );

    return Command.make(name).pipe(
      Command.withDescription(spec.info.description ?? spec.info.title),
      Command.withSubcommands([listCommand(groups), ...groupCommands]),
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

export const formatHttpApiCliCause = (cause: Cause.Cause<unknown>) => {
  const errors = Cause.prettyErrors(cause);
  if (errors.length === 0) return Cause.pretty(cause);
  return errors
    .map((error) =>
      error.message ? `${error.name}: ${error.message}` : error.name,
    )
    .join("\n");
};

export const runHttpApiCli = <E>(
  layer: Layer.Layer<HttpApiCli, E>,
  args = process.argv.slice(2),
) => {
  Effect.runPromiseExit(
    httpApiCli(args).pipe(
      Effect.provide(layer),
      Effect.provide(httpApiCliEnvironmentLayer(args)),
    ),
  ).then(
    Exit.match({
      onSuccess: () => undefined,
      onFailure: (cause) => {
        console.error(formatHttpApiCliCause(cause));
        process.exitCode = 1;
      },
    }),
  );
};
