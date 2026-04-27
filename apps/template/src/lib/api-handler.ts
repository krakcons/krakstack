import { Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiScalar } from "effect/unstable/httpapi";

import { TaskApi } from "@/api";
import { apiLayer } from "@/lib/api-builder";

const docsLayer = HttpApiScalar.layer(TaskApi, { path: "/api/docs" });
const allRoutes = Layer.mergeAll(apiLayer, docsLayer);

const { handler } = HttpRouter.toWebHandler(Layer.provide(allRoutes, HttpServer.layerServices));

export { handler };
