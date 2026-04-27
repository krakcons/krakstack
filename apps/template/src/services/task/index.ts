import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { tasks } from "@/db/schema";
import { CreateTask, UpdateTask } from "@/services/task/schema";
import { DB } from "@/services/database";

export class TaskService extends Context.Service<TaskService>()("TaskService", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    const list = Effect.fn("list")(function* () {
      const tasks = yield* db.query.tasks.findMany();

      return tasks;
    });

    const get = Effect.fn("get")(function* (id: string) {
      const task = yield* db.query.tasks.findFirst({
        where: {
          id,
        },
      });

      return task;
    });

    const create = Effect.fn("create")(function* (input: typeof CreateTask.Type) {
      const [task] = yield* db.insert(tasks).values(input).returning();

      if (!task) return undefined;

      return task;
    });

    const update = Effect.fn("update")(function* (id: string, input: typeof UpdateTask.Type) {
      const [task] = yield* db
        .update(tasks)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(tasks.id, id))
        .returning();

      if (!task) return undefined;

      return task;
    });

    const _delete = Effect.fn("delete")(function* (id: string) {
      const [task] = yield* db.delete(tasks).where(eq(tasks.id, id)).returning();

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
