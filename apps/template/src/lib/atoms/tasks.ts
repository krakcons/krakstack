import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/unstable/reactivity";

import { ApiClient } from "@/lib/api-client";
import { CreateTask, Task as TaskSchema, UpdateTask } from "@/services/task/schema";

export type Task = typeof TaskSchema.Type;
export type CreateTaskPayload = typeof CreateTask.Type;
export type UpdateTaskPayload = typeof UpdateTask.Type;

const serverTasksAtom = ApiClient.query("tasks", "listTasks", {
  timeToLive: "5 minutes",
  reactivityKeys: ["tasks"],
});

type TasksResult = AsyncResult.AsyncResult<ReadonlyArray<Task>, unknown>;

const currentTasks = (result: TasksResult): Array<Task> =>
  AsyncResult.match(result, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => Array.from(value),
  });

const optimisticTask = (payload: CreateTaskPayload): Task => {
  const now = new Date();

  return {
    id: `optimistic-${crypto.randomUUID()}`,
    title: payload.title,
    description: payload.description ?? null,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
};

export const allTasksAtom = Atom.optimistic(serverTasksAtom);

export const createTaskAtom = Atom.optimisticFn(allTasksAtom, {
  reducer: (current, args) =>
    AsyncResult.success([optimisticTask(args.payload), ...currentTasks(current)]),
  fn: ApiClient.mutation("tasks", "createTask"),
});

export const updateTaskAtom = Atom.optimisticFn(allTasksAtom, {
  reducer: (current, args) =>
    AsyncResult.success(
      currentTasks(current).map((task) =>
        task.id === args.params.id
          ? {
              ...task,
              ...args.payload,
              description: args.payload.description !== undefined ? args.payload.description : task.description,
              title: args.payload.title ?? task.title,
              completed: args.payload.completed ?? task.completed,
              updatedAt: new Date(),
            }
          : task,
      ),
    ),
  fn: ApiClient.mutation("tasks", "updateTask"),
});

export const deleteTaskAtom = Atom.optimisticFn(allTasksAtom, {
  reducer: (current, args) =>
    AsyncResult.success(currentTasks(current).filter((task) => task.id !== args.params.id)),
  fn: ApiClient.mutation("tasks", "deleteTask"),
});

export const useTasksAtom = () => useAtomValue(allTasksAtom);
