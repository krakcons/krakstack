import { migrate } from "drizzle-orm/effect-postgres/migrator";
import { Effect } from "effect";
import { beforeAll, beforeEach, describe, expect, it } from "@effect/vitest";

import { tasks as tasksTable } from "@/db/schema";
import { DB } from "@/services/database";

import { Tasks } from "./index";

const migrateTestDb = Effect.gen(function* () {
  const db = yield* DB;
  yield* migrate(db, { migrationsFolder: "./drizzle" });
}).pipe(Effect.provide(DB.testLayer));

const resetTestDb = Effect.gen(function* () {
  const db = yield* DB;
  yield* db.delete(tasksTable);
}).pipe(Effect.provide(DB.testLayer));

beforeAll(() => Effect.runPromise(migrateTestDb));
beforeEach(() => Effect.runPromise(resetTestDb));

describe("Tasks", () => {
  it.effect("creates and lists tasks scoped to a user", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;

      const created = yield* tasks.create({
        userId: "user-a",
        payload: { title: "Write tests", description: "Add service tests" },
      });
      yield* tasks.create({
        userId: "user-b",
        payload: { title: "Other user's task" },
      });

      if (!created) throw new Error("Expected task to be created");

      const listed = yield* tasks.list({ userId: "user-a" });

      expect(created.title).toBe("Write tests");
      expect(created.description).toBe("Add service tests");
      expect(listed).toHaveLength(1);
      expect(listed[0]?.id).toBe(created.id);
      expect(listed[0]?.userId).toBe("user-a");
    }).pipe(Effect.provide(Tasks.testLayer)),
  );

  it.effect("updates only the owning user's task", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const created = yield* tasks.create({
        userId: "user-a",
        payload: { title: "Original title" },
      });

      if (!created) throw new Error("Expected task to be created");

      const updatedByOtherUser = yield* tasks.update({
        userId: "user-b",
        id: created.id,
        payload: { title: "Wrong user update" },
      });
      const updatedByOwner = yield* tasks.update({
        userId: "user-a",
        id: created.id,
        payload: { title: "Updated title", completed: true },
      });

      expect(updatedByOtherUser).toBeUndefined();
      expect(updatedByOwner?.title).toBe("Updated title");
      expect(updatedByOwner?.completed).toBe(true);
    }).pipe(Effect.provide(Tasks.testLayer)),
  );

  it.effect("deletes only the owning user's task", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const created = yield* tasks.create({
        userId: "user-a",
        payload: { title: "Delete me" },
      });

      if (!created) throw new Error("Expected task to be created");

      const deletedByOtherUser = yield* tasks.delete({
        userId: "user-b",
        id: created.id,
      });
      const afterOtherUserDelete = yield* tasks.get({
        userId: "user-a",
        id: created.id,
      });
      const deletedByOwner = yield* tasks.delete({
        userId: "user-a",
        id: created.id,
      });
      const afterOwnerDelete = yield* tasks.get({
        userId: "user-a",
        id: created.id,
      });

      expect(deletedByOtherUser).toBeUndefined();
      expect(afterOtherUserDelete?.id).toBe(created.id);
      expect(deletedByOwner?.id).toBe(created.id);
      expect(afterOwnerDelete).toBeUndefined();
    }).pipe(Effect.provide(Tasks.testLayer)),
  );
});
