import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { CurrentUser } from "@/services/auth/middleware";
import { Tasks } from "@/services/task";

const internalServerError = () => new HttpApiError.InternalServerError({});

export const tasksHandler = HttpApiBuilder.group(Api, "tasks", (handlers) =>
  handlers
    .handle("listTasks", () =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const user = yield* CurrentUser;

        return yield* tasks.list({ userId: user.id }).pipe(Effect.mapError(internalServerError));
      }),
    )
    .handle("getTask", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const user = yield* CurrentUser;
        const task = yield* tasks
          .get({ userId: user.id, id: params.id })
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }),
    )
    .handle("createTask", ({ payload }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const user = yield* CurrentUser;

        const task = yield* tasks
          .create({ userId: user.id, payload })
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.InternalServerError({});

        return task;
      }),
    )
    .handle("updateTask", ({ params, payload }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const user = yield* CurrentUser;

        const task = yield* tasks
          .update({ userId: user.id, id: params.id, payload })
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }),
    )
    .handle("deleteTask", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const user = yield* CurrentUser;

        const task = yield* tasks
          .delete({ userId: user.id, id: params.id })
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }),
    ),
);
