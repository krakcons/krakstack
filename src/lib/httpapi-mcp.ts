import { Context, Effect, Layer } from "effect";
import { McpProtocol, McpServer } from "effect/ai";

import { HttpApiSpec } from "@/lib/httpapi-helpers";
import { HttpApiToolkit, HttpApiToolkitLayer } from "@/lib/httpapi-toolkit";

export type HttpApiMcpConfig = {
  readonly toolMetaKey?: string;
};

export class HttpApiMcp extends Context.Service<HttpApiMcp>()("HttpApiMcp", {
  make: (config: HttpApiMcpConfig) =>
    Effect.gen(function* () {
      const toolkitConfig = { ...config, needsApproval: () => false };
      const toolkit = yield* HttpApiToolkit(toolkitConfig);
      return {
        registerTools: McpServer.registerToolkit(toolkit).pipe(
          Effect.provide(HttpApiToolkitLayer(toolkitConfig)),
        ),
      };
    }),
}) {
  static readonly layer = (config: HttpApiMcpConfig) =>
    Layer.effect(this, this.make(config));
}

export const httpApiMcpToolsLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const mcp = yield* HttpApiMcp;
    yield* mcp.registerTools;
  }),
);

export const httpApiMcpServerLayer = (
  path: Parameters<typeof McpServer.layerHttp>[0]["path"],
) =>
  Layer.unwrap(
    Effect.gen(function* () {
      const spec = yield* HttpApiSpec;
      return McpServer.layerHttp({
        name: spec.info.title,
        version: spec.info.version,
        path,
        protocols: [McpProtocol.v2025_11_25],
      });
    }),
  );
