import { Schema } from "effect";

export const TaskSchema = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  title: Schema.String,
  description: Schema.NullOr(Schema.String),
  completed: Schema.Boolean,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({
  identifier: "Task",
  title: "Task",
  description: "A task belonging to a user",
  examples: [
    {
      id: "1",
      userId: "1",
      title: "Buy groceries",
      description: null,
      completed: false,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ],
});

export const CreateTaskSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
}).annotate({
  identifier: "CreateTask",
  title: "Create Task",
  description: "Payload for creating a new task",
  examples: [{ title: "Buy groceries", description: "Milk, eggs, bread" }],
});

export const UpdateTaskSchema = Schema.Struct({
  title: Schema.optional(Schema.NonEmptyString),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  completed: Schema.optional(Schema.Boolean),
}).annotate({
  identifier: "UpdateTask",
  title: "Update Task",
  description: "Payload for updating an existing task",
  examples: [{ title: "Buy groceries", completed: true }],
});

export const TaskIdParamsSchema = Schema.Struct({ id: Schema.String }).annotate(
  {
    identifier: "TaskIdParamsSchema",
    title: "Task ID Params",
    description: "Path parameters for task endpoints requiring an ID",
    examples: [{ id: "1" }],
  },
);

export const TaskSchemaStandard = Schema.toStandardSchemaV1(TaskSchema);
