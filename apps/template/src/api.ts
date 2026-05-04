import { HttpApi, OpenApi } from "effect/unstable/httpapi";

import { TasksApiGroup } from "@/services/task/api.group";

export const Api = HttpApi.make("Api")
  .annotateMerge(
    OpenApi.annotations({
      title: "KrakStack API",
      version: "1.0.0",
      description: "API for the KrakStack template application",
    }),
  )
  .add(TasksApiGroup)
  .prefix("/api");
