import { Schema } from "effect";

export const TaskSchema = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  title: Schema.String,
  description: Schema.NullOr(Schema.String),
  completed: Schema.Boolean,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "Task" });

export const CreateTaskSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
}).annotate({ identifier: "CreateTask" });

export const UpdateTaskSchema = Schema.Struct({
  title: Schema.optional(Schema.NonEmptyString),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  completed: Schema.optional(Schema.Boolean),
}).annotate({ identifier: "UpdateTask" });

export const TaskIdParamsSchema = Schema.Struct({ id: Schema.String }).annotate({
  identifier: "TaskIdParamsSchema",
});

export const TaskSchemaStandard = Schema.toStandardSchemaV1(TaskSchema);
