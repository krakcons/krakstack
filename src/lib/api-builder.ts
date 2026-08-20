import { Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { healthHandler, HealthService } from "@/services/health";

const healthLayer = HttpApiBuilder.group(Api, "health", healthHandler).pipe(
  Layer.provide(HealthService.layer),
);

export const apiLayer = HttpApiBuilder.layer(Api, {
  openapiPath: "/api/openapi.json",
}).pipe(Layer.provide(healthLayer));
