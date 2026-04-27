import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/unstable/httpapi";

import { CreateTask, Task, UpdateTask } from "@/services/task";

const TaskIdParams = Schema.Struct({ id: Schema.String }).annotate({ identifier: "TaskIdParams" });

export const TaskApi = HttpApi.make("TaskApi")
  .add(
    HttpApiGroup.make("tasks")
      .add(HttpApiEndpoint.get("listTasks", "/tasks", { success: Schema.Array(Task) }))
      .add(
        HttpApiEndpoint.post("createTask", "/tasks", { payload: CreateTask, success: Task }),
      )
      .add(
        HttpApiEndpoint.get("getTask", "/tasks/:id", {
          params: TaskIdParams,
          success: Task,
          error: HttpApiError.NotFound,
        }),
      )
      .add(
        HttpApiEndpoint.patch("updateTask", "/tasks/:id", {
          params: TaskIdParams,
          payload: UpdateTask,
          success: Task,
          error: HttpApiError.NotFound,
        }),
      )
      .add(
        HttpApiEndpoint.delete("deleteTask", "/tasks/:id", {
          params: TaskIdParams,
          success: Task,
          error: HttpApiError.NotFound,
        }),
      ),
  )
  .prefix("/api");
