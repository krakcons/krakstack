import { and, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { tasks } from "@/db/schema";
import { CreateTaskSchema, UpdateTaskSchema } from "@/services/task/schema";
import { DB } from "@/services/database";

export class Tasks extends Context.Service<Tasks>()("Tasks", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    const list = Effect.fn("Tasks.list")(function* (userId: string) {
      const tasks = yield* db.query.tasks.findMany({
        where: {
          userId,
        },
      });

      return tasks;
    });

    const get = Effect.fn("Tasks.get")(function* (userId: string, id: string) {
      const task = yield* db.query.tasks.findFirst({
        where: {
          id,
          userId,
        },
      });

      return task;
    });

    const create = Effect.fn("Tasks.create")(function* (
      userId: string,
      input: typeof CreateTaskSchema.Type,
    ) {
      const [task] = yield* db
        .insert(tasks)
        .values({ ...input, userId })
        .returning();

      if (!task) return undefined;

      return task;
    });

    const update = Effect.fn("Tasks.update")(function* (
      userId: string,
      id: string,
      input: typeof UpdateTaskSchema.Type,
    ) {
      const [task] = yield* db
        .update(tasks)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .returning();

      if (!task) return undefined;

      return task;
    });

    const _delete = Effect.fn("Tasks.delete")(function* (userId: string, id: string) {
      const [task] = yield* db
        .delete(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .returning();

      if (!task) return undefined;

      return task;
    });

    return {
      list,
      get,
      create,
      update,
      delete: _delete,
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(DB.layer));
}
