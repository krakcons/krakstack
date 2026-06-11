import { Schema } from "effect";

export const PresignUploadPayload = Schema.Struct({
  fileName: Schema.NonEmptyString,
  contentType: Schema.NonEmptyString,
}).annotate({
  identifier: "PresignUploadPayload",
  title: "Presign upload payload",
  description: "Payload used to request a presigned S3 upload URL.",
  examples: [{ fileName: "logo.png", contentType: "image/png" }],
});

export const PresignedUpload = Schema.Struct({
  uploadUrl: Schema.String,
  url: Schema.String,
}).annotate({
  identifier: "PresignedUpload",
  title: "Presigned upload",
  description: "Presigned S3 upload URL and stable public asset URL.",
  examples: [
    {
      uploadUrl:
        "https://s3.example.com/bucket/logos/organizations/logo.png?signature=...",
      url: "/api/assets/logos/organizations/logo.png",
    },
  ],
});

export type PresignUploadPayload = typeof PresignUploadPayload.Type;

export class S3ServiceError extends Schema.TaggedErrorClass<S3ServiceError>()(
  "S3ServiceError",
  {
    message: Schema.String,
    path: Schema.optional(Schema.String),
    error: Schema.optional(Schema.Defect()),
  },
) {}
