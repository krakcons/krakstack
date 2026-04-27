import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/unstable/httpapi";

import { CreateTask, Task, UpdateTask, TaskIdParams } from "@/services/task/schema";

export const Api = HttpApi.make("Api")
  .add(
    HttpApiGroup.make("tasks")
      .add(
        HttpApiEndpoint.get("listTasks", "/tasks", {
          success: Schema.Array(Task),
          error: [HttpApiError.InternalServerError],
        }),
      )
      .add(
        HttpApiEndpoint.post("createTask", "/tasks", {
          payload: CreateTask,
          success: Task,
          error: [HttpApiError.InternalServerError],
        }),
      )
      .add(
        HttpApiEndpoint.get("getTask", "/tasks/:id", {
          params: TaskIdParams,
          success: Task,
          error: [HttpApiError.NotFound, HttpApiError.InternalServerError],
        }),
      )
      .add(
        HttpApiEndpoint.patch("updateTask", "/tasks/:id", {
          params: TaskIdParams,
          payload: UpdateTask,
          success: Task,
          error: [HttpApiError.NotFound, HttpApiError.InternalServerError],
        }),
      )
      .add(
        HttpApiEndpoint.delete("deleteTask", "/tasks/:id", {
          params: TaskIdParams,
          success: Task,
          error: [HttpApiError.NotFound, HttpApiError.InternalServerError],
        }),
      ),
  )
  .prefix("/api");
