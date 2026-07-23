import { Context, Effect, Layer, Schema } from "effect";
import { Tool, Toolkit } from "effect/unstable/ai";

import { ApiClient } from "@/lib/httpapi-client";
import {
  HttpApiSpec,
  type HttpApiOperationEntry,
  type HttpApiSpecService,
  httpApiToolEntries,
} from "@/lib/httpapi-helpers";

export type HttpApiAiConfig = {
  readonly needsApproval?: (operation: HttpApiOperationEntry) => boolean;
};

const makeOperationTool = (
  entry: HttpApiOperationEntry & { readonly name: string },
  config: HttpApiAiConfig,
  spec: HttpApiSpecService,
) => {
  const { method, operation } = entry;
  const readOnly = method === "get";

  return Tool.dynamic(entry.name, {
    description: operation.description ?? operation.summary,
    parameters: spec.operationSchema(operation),
    success: Schema.Unknown,
    failure: Schema.String,
    failureMode: "return",
    needsApproval: config.needsApproval?.(entry) ?? !readOnly,
  })
    .annotate(Tool.Readonly, readOnly)
    .annotate(Tool.Destructive, method === "delete")
    .annotate(
      Tool.Idempotent,
      method === "get" || method === "put" || method === "delete",
    )
    .annotate(Tool.OpenWorld, false);
};

export const makeHttpApiAiToolkit = Effect.fn("HttpApiAi.makeToolkit")(
  function* (config: HttpApiAiConfig) {
    const spec = yield* HttpApiSpec;
    const operations = spec.operations;
    const toolEntries = yield* httpApiToolEntries(operations);
    const entries = toolEntries.map((operation) => ({
      operation,
      tool: makeOperationTool(operation, config, spec),
    }));
    const toolkit = Toolkit.make(...entries.map(({ tool }) => tool));
    const handlers = Object.fromEntries(
      entries.map(({ operation: entry, tool }) => [
        tool.name,
        (input: unknown) =>
          Effect.gen(function* () {
            const client = yield* ApiClient;
            const decoded = yield* spec.decodeOperationInput(
              input,
              entry.operation,
            );

            return yield* client.execute({
              operation: entry,
              input: {
                body: decoded.body,
                headers: decoded.headers,
                params: decoded.params,
                query: decoded.query,
              },
            });
          }).pipe(
            Effect.mapError((error) =>
              error instanceof Error ? error.message : String(error),
            ),
          ),
      ]),
    );

    return {
      operations,
      toolkit,
      layer: toolkit.toLayer(handlers),
    };
  },
);

export class HttpApiAi extends Context.Service<HttpApiAi>()("HttpApiAi", {
  make: makeHttpApiAiToolkit,
}) {
  static readonly layer = (config: HttpApiAiConfig) =>
    Layer.effect(this, this.make(config));
}
