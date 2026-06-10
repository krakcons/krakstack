import { Schema } from "effect";

export class S3ServiceError extends Schema.TaggedErrorClass<S3ServiceError>()(
  "S3ServiceError",
  {
    message: Schema.String,
    path: Schema.optional(Schema.String),
    error: Schema.optional(Schema.Defect),
  },
) {}
