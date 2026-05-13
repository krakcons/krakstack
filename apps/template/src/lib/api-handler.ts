import { Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiScalar } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { apiLayer } from "@/lib/api-builder";
import { OpenTelemetry } from "@/services/opentelemetry";

const docsLayer = HttpApiScalar.layer(Api, { path: "/api/docs" });
const allRoutes = Layer.mergeAll(apiLayer, docsLayer);
const appLayer = Layer.mergeAll(allRoutes, OpenTelemetry.layer).pipe(
  Layer.provide(HttpServer.layerServices),
);

export const { handler } = HttpRouter.toWebHandler(appLayer);
