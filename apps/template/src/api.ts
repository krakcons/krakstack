import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/unstable/httpapi";

import {
  CreateTaskSchema,
  TaskIdParamsSchema,
  TaskSchema,
  UpdateTaskSchema,
} from "@/services/task/schema";

export const Api = HttpApi.make("Api")
  .add(
    HttpApiGroup.make("tasks")
      .add(
        HttpApiEndpoint.get("listTasks", "/tasks", {
          success: Schema.Array(TaskSchema),
          error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
        }),
      )
      .add(
        HttpApiEndpoint.post("createTask", "/tasks", {
          payload: CreateTaskSchema,
          success: TaskSchema,
          error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
        }),
      )
      .add(
        HttpApiEndpoint.get("getTask", "/tasks/:id", {
          params: TaskIdParamsSchema,
          success: TaskSchema,
          error: [
            HttpApiError.Unauthorized,
            HttpApiError.NotFound,
            HttpApiError.InternalServerError,
          ],
        }),
      )
      .add(
        HttpApiEndpoint.patch("updateTask", "/tasks/:id", {
          params: TaskIdParamsSchema,
          payload: UpdateTaskSchema,
          success: TaskSchema,
          error: [
            HttpApiError.Unauthorized,
            HttpApiError.NotFound,
            HttpApiError.InternalServerError,
          ],
        }),
      )
      .add(
        HttpApiEndpoint.delete("deleteTask", "/tasks/:id", {
          params: TaskIdParamsSchema,
          success: TaskSchema,
          error: [
            HttpApiError.Unauthorized,
            HttpApiError.NotFound,
            HttpApiError.InternalServerError,
          ],
        }),
      ),
  )
  .prefix("/api");
