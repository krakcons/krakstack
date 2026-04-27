import { Effect, Layer } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { TaskApi } from "@/api";
import { TaskService } from "@/services/task";

const internalServerError = () => new HttpApiError.InternalServerError({});

const tasksGroupLive = HttpApiBuilder.group(TaskApi, "tasks", (handlers) =>
  handlers
    .handle("listTasks", () =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;

        return yield* tasks.list().pipe(Effect.mapError(internalServerError));
      }),
    )
    .handle("getTask", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;
        const task = yield* tasks.get(params.id).pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }),
    )
    .handle("createTask", ({ payload }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;

        const task = yield* tasks.create(payload).pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.InternalServerError({});

        return task;
      }),
    )
    .handle("updateTask", ({ params, payload }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;

        const task = yield* tasks
          .update(params.id, payload)
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }),
    )
    .handle("deleteTask", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* TaskService;

        const task = yield* tasks.delete(params.id).pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }),
    ),
);

export const apiLayer = HttpApiBuilder.layer(TaskApi, {
  openapiPath: "/api/openapi.json",
}).pipe(Layer.provide(tasksGroupLive), Layer.provide(TaskService.layer));
