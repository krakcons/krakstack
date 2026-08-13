import { extractBatch, ExtractInputKind, OutputFormat } from "@xberg-io/xberg";
import { Context, Effect, Layer, Semaphore } from "effect";

import { FileExtractionFailed } from "./schema";

export interface FileExtractionOptions {
  readonly maxInputBytes: number;
  readonly maxOutputBytes: number;
  readonly maxConcurrentExtractions: number;
  readonly timeoutSeconds: number;
}

export interface FileExtractionInput {
  readonly bytes: Uint8Array;
  readonly filename: string;
  readonly mimeType: string;
}

export interface ExtractFileInput extends FileExtractionInput {
  readonly outputFormat: OutputFormat;
}

export const defaultFileExtractionOptions: FileExtractionOptions = {
  maxInputBytes: 20 * 1024 * 1024,
  maxOutputBytes: 512 * 1024,
  maxConcurrentExtractions: 2,
  timeoutSeconds: 30,
};

const truncateUtf8 = (content: string, maxBytes: number) => {
  const bytes = new TextEncoder().encode(content);
  if (bytes.byteLength <= maxBytes) {
    return { content, byteSize: bytes.byteLength };
  }
  let end = maxBytes;
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end -= 1;
  return {
    content: new TextDecoder().decode(bytes.slice(0, end)),
    byteSize: end,
  };
};

const limitText = (content: string, maxBytes: number) => {
  const normalized = content.replace(/\r\n?/g, "\n").trim();
  const originalByteSize = new TextEncoder().encode(normalized).byteLength;
  const bounded = truncateUtf8(normalized, maxBytes);
  return {
    content: bounded.content,
    contentByteSize: bounded.byteSize,
    truncated: bounded.byteSize !== originalByteSize,
  };
};

const make = (options: FileExtractionOptions) =>
  Effect.gen(function* () {
    const semaphore = yield* Semaphore.make(options.maxConcurrentExtractions);
    const extract = Effect.fn("FileExtractionService.extract")(function* ({
      bytes,
      filename,
      mimeType,
      outputFormat,
    }: ExtractFileInput) {
      if (bytes.byteLength > options.maxInputBytes) {
        return yield* new FileExtractionFailed({
          message: "Document exceeds the extraction size limit",
        });
      }

      const output = yield* semaphore.withPermit(
        Effect.tryPromise({
          try: () =>
            extractBatch(
              [
                {
                  kind: ExtractInputKind.Bytes,
                  bytes,
                  filename,
                  mimeType,
                  config: { timeoutSecs: options.timeoutSeconds },
                },
              ],
              {
                outputFormat,
                extractionTimeoutSecs: options.timeoutSeconds,
                maxConcurrentExtractions: 1,
                maxEmbeddedFileBytes: 10 * 1024 * 1024,
                securityLimits: {
                  maxArchiveSize: 50 * 1024 * 1024,
                  maxCompressionRatio: 100,
                  maxFilesInArchive: 1_000,
                  maxNestingDepth: 50,
                  maxEntityLength: 1024 * 1024,
                  maxContentSize: 2 * 1024 * 1024,
                  maxIterations: 1_000_000,
                  maxXmlDepth: 50,
                  maxTableCells: 100_000,
                },
                useCache: false,
              },
            ),
          catch: (cause) =>
            new FileExtractionFailed({
              message:
                cause instanceof Error
                  ? cause.message
                  : "Document extraction failed",
            }),
        }),
      );
      const result = output.results?.[0];
      if (!result?.content) {
        return yield* new FileExtractionFailed({
          message:
            output.errors?.[0]?.message ??
            "Document extraction returned no readable content",
        });
      }
      return limitText(result.content, options.maxOutputBytes);
    });

    return {
      extract,
      markdown: Effect.fn("FileExtractionService.markdown")(
        (input: FileExtractionInput) =>
          extract({ ...input, outputFormat: OutputFormat.Markdown }),
      ),
      text: Effect.fn("FileExtractionService.text")(
        (input: FileExtractionInput) =>
          extract({ ...input, outputFormat: OutputFormat.Plain }),
      ),
      html: Effect.fn("FileExtractionService.html")(
        (input: FileExtractionInput) =>
          extract({ ...input, outputFormat: OutputFormat.Html }),
      ),
    };
  });

export class FileExtractionService extends Context.Service<FileExtractionService>()(
  "FileExtractionService",
  { make: make(defaultFileExtractionOptions) },
) {
  static readonly layer = Layer.effect(this, this.make);
  static readonly layerWith = (options: Partial<FileExtractionOptions>) =>
    Layer.effect(this, make({ ...defaultFileExtractionOptions, ...options }));
  static readonly testLayer = (service: typeof this.Service) =>
    Layer.succeed(this, service);
}

export { FileExtractedTextSchema, FileExtractionFailed } from "./schema";
export { OutputFormat } from "@xberg-io/xberg";
