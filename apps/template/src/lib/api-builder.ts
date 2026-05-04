import { Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { Tasks } from "@/services/task";
import { tasksHandler } from "@/services/task/api.builder";

export const apiLayer = HttpApiBuilder.layer(Api, {
  openapiPath: "/api/openapi.json",
}).pipe(Layer.provide(tasksHandler), Layer.provide(Tasks.layer));
