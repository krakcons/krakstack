import { Effect } from "effect";
import { HttpServerRequest } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { auth } from "@/lib/auth";
import { Tasks } from "@/services/task";

const internalServerError = () => new HttpApiError.InternalServerError({});

const requireUserId = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const session = yield* Effect.tryPromise({
    try: () => auth.api.getSession({ headers: new Headers(request.headers) }),
    catch: internalServerError,
  });

  if (!session) {
    return yield* new HttpApiError.Unauthorized({});
  }

  return session.user.id;
});

export const tasksHandler = HttpApiBuilder.group(Api, "tasks", (handlers) =>
  handlers
    .handle("listTasks", () =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const userId = yield* requireUserId;

        return yield* tasks.list(userId).pipe(Effect.mapError(internalServerError));
      }),
    )
    .handle("getTask", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const userId = yield* requireUserId;
        const task = yield* tasks.get(userId, params.id).pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }),
    )
    .handle("createTask", ({ payload }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const userId = yield* requireUserId;

        const task = yield* tasks
          .create(userId, payload)
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.InternalServerError({});

        return task;
      }),
    )
    .handle("updateTask", ({ params, payload }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const userId = yield* requireUserId;

        const task = yield* tasks
          .update(userId, params.id, payload)
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }),
    )
    .handle("deleteTask", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const userId = yield* requireUserId;

        const task = yield* tasks
          .delete(userId, params.id)
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }),
    ),
);
