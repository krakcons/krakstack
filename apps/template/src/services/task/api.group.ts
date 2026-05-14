import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
} from "effect/unstable/httpapi";
import { OpenApi } from "effect/unstable/httpapi";

import { AuthMiddleware } from "@/services/auth/middleware";

import {
  CreateTaskSchema,
  TaskIdParamsSchema,
  TaskSchema,
  UpdateTaskSchema,
} from "./schema";

export const TasksApiGroup = HttpApiGroup.make("tasks")
  .annotateMerge(
    OpenApi.annotations({
      title: "Tasks",
      description: "Operations for managing tasks",
    }),
  )
  .add(
    HttpApiEndpoint.get("listTasks", "/tasks", {
      success: Schema.Array(TaskSchema),
      error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
    }).annotateMerge(
      OpenApi.annotations({
        summary: "List all tasks",
        description:
          "Returns a list of all tasks belonging to the authenticated user",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.post("createTask", "/tasks", {
      payload: CreateTaskSchema,
      success: TaskSchema,
      error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
    }).annotateMerge(
      OpenApi.annotations({
        summary: "Create a task",
        description: "Creates a new task for the authenticated user",
      }),
    ),
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
    }).annotateMerge(
      OpenApi.annotations({
        summary: "Get a task by ID",
        description:
          "Retrieves a single task by its ID for the authenticated user",
      }),
    ),
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
    }).annotateMerge(
      OpenApi.annotations({
        summary: "Update a task",
        description:
          "Partially updates an existing task by its ID for the authenticated user",
      }),
    ),
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
    }).annotateMerge(
      OpenApi.annotations({
        summary: "Delete a task",
        description: "Deletes a task by its ID for the authenticated user",
      }),
    ),
  )
  .middleware(AuthMiddleware);
