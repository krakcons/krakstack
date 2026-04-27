import { Schema } from "effect";

export const Task = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  description: Schema.NullOr(Schema.String),
  completed: Schema.Boolean,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
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

export const TaskIdParams = Schema.Struct({ id: Schema.String }).annotate({
  identifier: "TaskIdParams",
});
