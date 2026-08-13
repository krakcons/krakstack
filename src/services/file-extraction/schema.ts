import { Schema } from "effect";

export const FileExtractedTextSchema = Schema.Struct({
  content: Schema.String,
  contentByteSize: Schema.Int,
  truncated: Schema.Boolean,
}).annotate({ identifier: "FileExtractedText" });

export type FileExtractedText = typeof FileExtractedTextSchema.Type;

export class FileExtractionFailed extends Schema.TaggedErrorClass<FileExtractionFailed>()(
  "FileExtractionFailed",
  { message: Schema.String },
) {}
