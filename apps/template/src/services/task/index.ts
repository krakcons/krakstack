import { and, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { tasks } from "@/db/schema";
import { DB } from "@/services/database";
import { CreateTaskSchema, UpdateTaskSchema } from "@/services/task/schema";

export class Tasks extends Context.Service<Tasks>()("Tasks", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    const list = Effect.fn("Tasks.list")(function* ({ userId }: { userId: string }) {
      const tasks = yield* db.query.tasks.findMany({
        where: {
          userId,
        },
      });

      return tasks;
    });

    const get = Effect.fn("Tasks.get")(function* ({ userId, id }: { userId: string; id: string }) {
      const task = yield* db.query.tasks.findFirst({
        where: {
          id,
          userId,
        },
      });

      return task;
    });

    const create = Effect.fn("Tasks.create")(function* ({
      userId,
      payload,
    }: {
      userId: string;
      payload: typeof CreateTaskSchema.Type;
    }) {
      const [task] = yield* db
        .insert(tasks)
        .values({ ...payload, userId })
        .returning();

      if (!task) return undefined;

      return task;
    });

    const update = Effect.fn("Tasks.update")(function* ({
      userId,
      id,
      payload,
    }: {
      userId: string;
      id: string;
      payload: typeof UpdateTaskSchema.Type;
    }) {
      const [task] = yield* db
        .update(tasks)
        .set({ ...payload, updatedAt: new Date() })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .returning();

      if (!task) return undefined;

      return task;
    });

    const _delete = Effect.fn("Tasks.delete")(function* ({
      userId,
      id,
    }: {
      userId: string;
      id: string;
    }) {
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
  static readonly baseLayer = Layer.effect(this, this.make);

  static readonly layer = this.baseLayer.pipe(Layer.provide(DB.layer));

  static readonly testLayer = this.baseLayer.pipe(Layer.provide(DB.testLayer));
}
