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

export const CreateExampleStandard = Schema.toStandardSchemaV1(CreateExample);

export type Example = typeof ExampleSchema.Type;
export type CreateExamplePayload = typeof CreateExample.Type;
export type UpdateExamplePayload = typeof UpdateExample.Type;
