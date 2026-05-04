import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/effect-schema";
import { Schema } from "effect";

import { tasks } from "@/db/schema";

export const TaskSchema = createSelectSchema(tasks).annotate({ identifier: "Task" });

export const CreateTaskSchema = createInsertSchema(tasks, {
  userId: Schema.optional(Schema.String),
  title: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
}).annotate({ identifier: "CreateTask" });

export const UpdateTaskSchema = createUpdateSchema(tasks, {
  title: Schema.optional(Schema.NonEmptyString),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  completed: Schema.optional(Schema.Boolean),
}).annotate({ identifier: "UpdateTask" });

export const TaskIdParamsSchema = Schema.Struct({ id: Schema.String }).annotate({
  identifier: "TaskIdParamsSchema",
});

export const TaskSchemaStandard = Schema.toStandardSchemaV1(TaskSchema);
