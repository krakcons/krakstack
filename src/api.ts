import { HttpApi, OpenApi } from "effect/unstable/httpapi";

import { HealthApiGroup } from "@/services/health";

export const Api = HttpApi.make("KrakStackSiteApi")
  .annotateMerge(
    OpenApi.annotations({
      title: "KrakStack Site API",
      version: "1.0.0",
      description: "API for the KrakStack website",
    }),
  )
  .add(HealthApiGroup)
  .prefix("/api");
