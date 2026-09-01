import { Schema } from "effect";

export const ExampleSchema = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  active: Schema.Boolean,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "Example" });

export const CreateExample = Schema.Struct({
  name: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
}).annotate({ identifier: "CreateExample" });

export const UpdateExample = Schema.Struct({
  name: Schema.optional(Schema.NonEmptyString),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  active: Schema.optional(Schema.Boolean),
}).annotate({ identifier: "UpdateExample" });

export const ExampleIdParams = Schema.Struct({ id: Schema.String }).annotate({
  identifier: "ExampleIdParams",
});

export const FindExamplesRequest = Schema.Struct({
  userId: Schema.String,
}).annotate({ identifier: "FindExamplesRequest" });

export const FindExampleRequest = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
}).annotate({ identifier: "FindExampleRequest" });

export const CreateExampleRequest = Schema.Struct({
  userId: Schema.String,
  payload: CreateExample,
}).annotate({ identifier: "CreateExampleRequest" });

export const UpdateExampleRequest = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  payload: UpdateExample,
}).annotate({ identifier: "UpdateExampleRequest" });

export const ExamplePersistenceError = Schema.Struct({
  message: Schema.String,
}).annotate({ identifier: "ExamplePersistenceError" });

export const CreateExampleStandard = Schema.toStandardSchemaV1(CreateExample);

export type Example = typeof ExampleSchema.Type;
export type CreateExamplePayload = typeof CreateExample.Type;
export type UpdateExamplePayload = typeof UpdateExample.Type;
