import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { S3Service } from "./index";
import { S3ServiceError } from "./schema";

const stats: Bun.S3Stats = {
  etag: "etag",
  lastModified: new Date("2026-01-01T00:00:00.000Z"),
  size: 5,
  type: "text/plain",
};

const listResponse: Bun.S3ListObjectsResponse = {
  contents: [{ key: "hello.txt", size: 5 }],
  isTruncated: false,
};

describe("S3Service", () => {
  it("exposes effectful object operations through the service", async () => {
    const calls: Array<ReadonlyArray<unknown>> = [];
    const layer = S3Service.testLayer({
      file: (path: string) => {
        calls.push(["file", path]);
        return Effect.fail(new S3ServiceError({ message: "not implemented" }));
      },
      write: (
        path: string,
        data: Parameters<Bun.S3Client["write"]>[1],
        options?: Bun.S3Options,
      ) =>
        Effect.sync(() => {
          calls.push(["write", path, data, options]);
          return 5;
        }),
      text: () => Effect.succeed("hello"),
      json: () => Effect.succeed({ ok: true }),
      bytes: () => Effect.succeed(new TextEncoder().encode("hello")),
      arrayBuffer: () =>
        Effect.succeed(new TextEncoder().encode("hello").buffer),
      stream: () => Effect.succeed(new Blob(["hello"]).stream()),
      exists: (path: string) =>
        Effect.sync(() => {
          calls.push(["exists", path]);
          return true;
        }),
      stat: (path: string) =>
        Effect.sync(() => {
          calls.push(["stat", path]);
          return stats;
        }),
      size: (path: string) =>
        Effect.sync(() => {
          calls.push(["size", path]);
          return 5;
        }),
      delete: (path: string) =>
        Effect.sync(() => {
          calls.push(["delete", path]);
        }),
      presign: (path: string, options?: Bun.S3FilePresignOptions) =>
        Effect.sync(() => {
          calls.push(["presign", path, options]);
          return "https://example.com/hello.txt";
        }),
      list: (options?: Bun.S3ListObjectsOptions | null) =>
        Effect.sync(() => {
          calls.push(["list", options]);
          return listResponse;
        }),
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        const s3 = yield* S3Service;

        expect(
          yield* s3.write("hello.txt", "hello", { type: "text/plain" }),
        ).toBe(5);
        expect(yield* s3.exists("hello.txt")).toBe(true);
        expect(yield* s3.size("hello.txt")).toBe(5);
        expect(yield* s3.stat("hello.txt")).toEqual(stats);
        expect(yield* s3.presign("hello.txt", { expiresIn: 60 })).toBe(
          "https://example.com/hello.txt",
        );
        expect(yield* s3.list({ prefix: "hello" })).toEqual(listResponse);
        yield* s3.delete("hello.txt");
      }).pipe(Effect.provide(layer)),
    );

    expect(calls).toEqual([
      ["write", "hello.txt", "hello", { type: "text/plain" }],
      ["exists", "hello.txt"],
      ["size", "hello.txt"],
      ["stat", "hello.txt"],
      ["presign", "hello.txt", { expiresIn: 60 }],
      ["list", { prefix: "hello" }],
      ["delete", "hello.txt"],
    ]);
  });

  it("maps client failures to S3ServiceError", async () => {
    const layer = S3Service.testLayer({
      file: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
      write: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
      text: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
      json: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
      bytes: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
      arrayBuffer: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
      stream: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
      exists: (path: string) =>
        Effect.fail(
          new S3ServiceError({
            message: "Failed to check S3 object existence",
            path,
            error: new Error("network failed"),
          }),
        ),
      stat: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
      size: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
      delete: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
      presign: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
      list: () =>
        Effect.fail(new S3ServiceError({ message: "not implemented" })),
    });

    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const s3 = yield* S3Service;
        return yield* Effect.flip(s3.exists("missing.txt"));
      }).pipe(Effect.provide(layer)),
    );

    expect(error).toBeInstanceOf(S3ServiceError);
    expect(error.message).toBe("Failed to check S3 object existence");
    expect(error.path).toBe("missing.txt");
  });
});
