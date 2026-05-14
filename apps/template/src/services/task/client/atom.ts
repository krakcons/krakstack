import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/unstable/reactivity";

import { ApiClient } from "@/lib/api-client";
import {
  CreateTaskSchema,
  TaskSchema,
  UpdateTaskSchema,
} from "@/services/task/schema";

export type Task = typeof TaskSchema.Type;
export type CreateTaskPayload = typeof CreateTaskSchema.Type;
export type UpdateTaskPayload = typeof UpdateTaskSchema.Type;

const serverTasksAtom = ApiClient.query("tasks", "listTasks", {
  timeToLive: "5 minutes",
  reactivityKeys: ["tasks"],
});

const current = (r: AsyncResult.AsyncResult<ReadonlyArray<Task>, unknown>) =>
  AsyncResult.match(r, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => Array.from(value),
  });

const optimisticTask = (p: CreateTaskPayload): Task => {
  const now = new Date();
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    userId: "optimistic",
    title: p.title,
    description: p.description ?? null,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
};

export const allTasksAtom = Atom.optimistic(serverTasksAtom);

export const createTaskAtom = Atom.optimisticFn(allTasksAtom, {
  reducer: (c, a) =>
    AsyncResult.success([optimisticTask(a.payload), ...current(c)]),
  fn: ApiClient.mutation("tasks", "createTask"),
});

export const updateTaskAtom = Atom.optimisticFn(allTasksAtom, {
  reducer: (c, a) =>
    AsyncResult.success(
      current(c).map((task) =>
        task.id === a.params.id
          ? {
              ...task,
              title: a.payload.title ?? task.title,
              description:
                a.payload.description !== undefined
                  ? a.payload.description
                  : task.description,
              completed: a.payload.completed ?? task.completed,
              updatedAt: new Date(),
            }
          : task,
      ),
    ),
  fn: ApiClient.mutation("tasks", "updateTask"),
});

export const deleteTaskAtom = Atom.optimisticFn(allTasksAtom, {
  reducer: (c, a) =>
    AsyncResult.success(current(c).filter((x) => x.id !== a.params.id)),
  fn: ApiClient.mutation("tasks", "deleteTask"),
});

export const useTasksAtom = () => useAtomValue(allTasksAtom);
