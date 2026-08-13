import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import { FileExtractionService, OutputFormat } from "./index";

describe("FileExtractionService", () => {
  it.effect("extracts Markdown from in-memory documents", () =>
    Effect.gen(function* () {
      const extraction = yield* FileExtractionService;
      const result = yield* extraction.markdown({
        bytes: new TextEncoder().encode("# Heading\n\nDocument content"),
        filename: "document.md",
        mimeType: "text/markdown",
      });

      expect(result).toMatchObject({
        content: "# Heading\n\nDocument content",
        truncated: false,
      });
    }).pipe(Effect.provide(FileExtractionService.layer)),
  );

  it.effect("supports convenience and generic output formats", () =>
    Effect.gen(function* () {
      const extraction = yield* FileExtractionService;
      const input = {
        bytes: new TextEncoder().encode("Document content"),
        filename: "document.txt",
        mimeType: "text/plain",
      };

      expect((yield* extraction.text(input)).content).toBe("Document content");
      expect((yield* extraction.html(input)).content).toContain(
        "Document content",
      );
      expect(
        (yield* extraction.extract({
          ...input,
          outputFormat: OutputFormat.Markdown,
        })).content,
      ).toBe("Document content");
    }).pipe(Effect.provide(FileExtractionService.layer)),
  );

  it.effect("supports custom input limits", () =>
    Effect.gen(function* () {
      const extraction = yield* FileExtractionService;
      const error = yield* extraction
        .text({
          bytes: new TextEncoder().encode("too large"),
          filename: "document.txt",
          mimeType: "text/plain",
        })
        .pipe(Effect.flip);

      expect(error.message).toContain("extraction size limit");
    }).pipe(
      Effect.provide(FileExtractionService.layerWith({ maxInputBytes: 4 })),
    ),
  );

  it.effect("truncates output on a UTF-8 boundary", () =>
    Effect.gen(function* () {
      const extraction = yield* FileExtractionService;
      const result = yield* extraction.text({
        bytes: new TextEncoder().encode("abcédef"),
        filename: "document.txt",
        mimeType: "text/plain",
      });

      expect(result).toEqual({
        content: "abc",
        contentByteSize: 3,
        truncated: true,
      });
    }).pipe(
      Effect.provide(FileExtractionService.layerWith({ maxOutputBytes: 4 })),
    ),
  );
});
