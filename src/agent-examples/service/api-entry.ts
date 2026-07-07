import { HttpApi, OpenApi } from "effect/unstable/httpapi";

import { ExamplesApiGroup } from "./api.group";

export const Api = HttpApi.make("Api")
  .annotateMerge(
    OpenApi.annotations({
      title: "KrakStack API",
      version: "1.0.0",
      description: "API for the KrakStack template application",
    }),
  )
  .add(ExamplesApiGroup)
  .prefix("/api");
