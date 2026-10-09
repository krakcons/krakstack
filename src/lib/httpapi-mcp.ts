import { Context, Effect, Layer } from "effect";
import { McpProtocol, McpServer } from "effect/ai";
import type { HttpApiGroup } from "effect/http-api";

import { ApiClient, type ApiClientConfig } from "@/lib/httpapi-client";
import { HttpApiSpec, type HttpApiSpecConfig } from "@/lib/httpapi-helpers";
import { makeHttpApiToolkit } from "@/lib/httpapi-toolkit";

export type HttpApiMcpConfig = {
  readonly toolMetaKey?: string;
};

export type HttpApiMcpHttpConfig<
  Id extends string,
  Groups extends HttpApiGroup.Constraint,
> = ApiClientConfig<Id, Groups> &
  Pick<HttpApiSpecConfig, "methods" | "include"> &
  HttpApiMcpConfig & {
    readonly path?: Parameters<typeof McpServer.layerHttp>[0]["path"];
  };

export class HttpApiMcp extends Context.Service<HttpApiMcp>()("HttpApiMcp", {
  make: (config: HttpApiMcpConfig) =>
    Effect.gen(function* () {
      const toolkitConfig = { ...config, needsApproval: () => false };
      const { toolkit, handlers } = yield* makeHttpApiToolkit(toolkitConfig);
      return {
        registerTools: McpServer.registerToolkit(toolkit).pipe(
          Effect.provide(handlers),
        ),
      };
    }),
}) {
  static readonly layer = (config: HttpApiMcpConfig) =>
    Layer.effect(this, this.make(config));

  static readonly layerHttp = <
    Id extends string,
    Groups extends HttpApiGroup.Constraint,
  >(
    config: HttpApiMcpHttpConfig<Id, Groups>,
  ) =>
    httpApiMcpToolsLayer.pipe(
      Layer.provide(this.layer(config)),
      Layer.provideMerge(httpApiMcpServerLayer(config.path ?? "/api/mcp")),
      Layer.provide(
        Layer.mergeAll(
          HttpApiSpec.layer({
            api: config.api,
            methods: config.methods ?? ["get"],
            include: config.include,
          }),
          ApiClient.layer(config),
        ),
      ),
    );
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
