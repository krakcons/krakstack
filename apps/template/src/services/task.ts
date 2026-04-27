import { asc, eq } from "drizzle-orm";
import { Context, Effect, Layer, Schema } from "effect";

import { tasks } from "@/db/schema";
import { DB } from "@/services/database";

export const Task = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  description: Schema.NullOr(Schema.String),
  completed: Schema.Boolean,
  createdAt: Schema.String,
  updatedAt: Schema.String,
}).annotate({ identifier: "Task" });

export const CreateTask = Schema.Struct({
  title: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
}).annotate({ identifier: "CreateTask" });

export const UpdateTask = Schema.Struct({
  title: Schema.optional(Schema.NonEmptyString),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  completed: Schema.optional(Schema.Boolean),
}).annotate({ identifier: "UpdateTask" });

const selectTaskFields = {
  id: tasks.id,
  title: tasks.title,
  description: tasks.description,
  completed: tasks.completed,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
};

export class TaskService extends Context.Service<TaskService>()("TaskService", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    return {
      list: db.select(selectTaskFields).from(tasks).orderBy(asc(tasks.createdAt)),
      get: (id: string) =>
        Effect.gen(function* () {
          const [task] = yield* db
            .select(selectTaskFields)
            .from(tasks)
            .where(eq(tasks.id, id))
            .limit(1);

          return task ?? null;
        }),
      create: (input: typeof CreateTask.Type) =>
        Effect.gen(function* () {
          const [task] = yield* db.insert(tasks).values(input).returning(selectTaskFields);

          return task;
        }),
      update: (id: string, input: typeof UpdateTask.Type) =>
        Effect.gen(function* () {
          const [task] = yield* db
            .update(tasks)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(tasks.id, id))
            .returning(selectTaskFields);

          return task ?? null;
        }),
      delete: (id: string) =>
        Effect.gen(function* () {
          const [task] = yield* db
            .delete(tasks)
            .where(eq(tasks.id, id))
            .returning(selectTaskFields);

          return task ?? null;
        }),
    } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(DB.layer));
}
