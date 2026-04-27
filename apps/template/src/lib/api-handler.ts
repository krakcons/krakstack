import { Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiScalar } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { apiLayer } from "@/lib/api-builder";
import { OpenTelemetry } from "@/services/opentelemetry";

const docsLayer = HttpApiScalar.layer(Api, { path: "/api/docs" });
const allRoutes = Layer.mergeAll(apiLayer, docsLayer);

const { handler } = HttpRouter.toWebHandler(
  Layer.provide(Layer.provide(allRoutes, OpenTelemetry.layer), HttpServer.layerServices),
);

export { handler };
