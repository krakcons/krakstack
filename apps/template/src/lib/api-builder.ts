import { Effect, Layer } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { TaskApi } from "@/api";
import { TaskService } from "@/services/task";

const tasksGroupLive = HttpApiBuilder.group(TaskApi, "tasks", (handlers) =>
  handlers
    .handle("listTasks", () =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;

        return yield* tasks.list;
      }),
    )
    .handle("getTask", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;
        const task = yield* tasks.get(params.id);

        if (task === null) {
          return yield* new HttpApiError.NotFound({});
        }

        return task;
      }),
    )
    .handle("createTask", ({ payload }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;

        return yield* tasks.create(payload);
      }),
    )
    .handle("updateTask", ({ params, payload }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;
        const task = yield* tasks.update(params.id, payload);

        if (task === null) {
          return yield* new HttpApiError.NotFound({});
        }

        return task;
      }),
    )
    .handle("deleteTask", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;
        const task = yield* tasks.delete(params.id);

        if (task === null) {
          return yield* new HttpApiError.NotFound({});
        }

        return task;
      }),
    ),
);

export const apiLayer = HttpApiBuilder.layer(TaskApi, {
  openapiPath: "/api/openapi.json",
}).pipe(Layer.provide(tasksGroupLive), Layer.provide(TaskService.layer));
