import { Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiScalar } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { apiLayer } from "@/lib/api-builder";

const docsLayer = HttpApiScalar.layer(Api, { path: "/api/docs" });
const appLayer = Layer.merge(apiLayer, docsLayer).pipe(
  Layer.provide(HttpServer.layerServices),
);

const webHandler = HttpRouter.toWebHandler(appLayer);

export const handler =
  // SAFETY: appLayer provides HealthService before constructing the web handler.
  webHandler.handler as (request: Request) => Promise<Response>;
export const dispose = webHandler.dispose;
