import { Config, Context, Effect, Layer, Redacted } from "effect";

import { S3ServiceError } from "./schema";

export class S3ServiceConfig extends Context.Service<S3ServiceConfig>()(
  "S3ServiceConfig",
  {
    make: Effect.gen(function* () {
      const accessKeyId = yield* Config.redacted("S3_ACCESS_KEY_ID");
      const secretAccessKey = yield* Config.redacted("S3_SECRET_ACCESS_KEY");
      const bucket = yield* Config.string("S3_BUCKET");
      const region = yield* Config.string("S3_REGION").pipe(
        Config.withDefault(""),
      );
      const endpoint = yield* Config.string("S3_ENDPOINT").pipe(
        Config.withDefault(""),
      );
      const sessionToken = yield* Config.redacted("S3_SESSION_TOKEN").pipe(
        Config.orElse(() => Config.succeed(Redacted.make(""))),
      );

      return {
        options: {
          accessKeyId: Redacted.value(accessKeyId),
          secretAccessKey: Redacted.value(secretAccessKey),
          bucket,
          ...(region ? { region } : {}),
          ...(endpoint ? { endpoint } : {}),
          ...(Redacted.value(sessionToken)
            ? { sessionToken: Redacted.value(sessionToken) }
            : {}),
        } satisfies Bun.S3Options,
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}

export class S3Service extends Context.Service<S3Service>()("S3Service", {
  make: Effect.gen(function* () {
    const config = yield* S3ServiceConfig;
    const client = new Bun.S3Client(config.options);

    const file = Effect.fn("S3Service.file")(
      (path: string, options?: Bun.S3Options) =>
        Effect.try({
          try: () => client.file(path, options),
          catch: (error) =>
            new S3ServiceError({
              message: "Failed to create S3 file reference",
              path,
              error,
            }),
        }),
    );

    const write = Effect.fn("S3Service.write")(function* (
      path: string,
      data: Parameters<Bun.S3Client["write"]>[1],
      options?: Bun.S3Options,
    ) {
      return yield* Effect.tryPromise({
        try: () => client.write(path, data, options),
        catch: (error) =>
          new S3ServiceError({
            message: "Failed to write S3 object",
            path,
            error,
          }),
      });
    });

    const text = Effect.fn("S3Service.text")(function* (path: string) {
      const s3File = yield* file(path);
      return yield* Effect.tryPromise({
        try: () => s3File.text(),
        catch: (error) =>
          new S3ServiceError({
            message: "Failed to read S3 object as text",
            path,
            error,
          }),
      });
    });

    const json = Effect.fn("S3Service.json")(function* (path: string) {
      const s3File = yield* file(path);
      return yield* Effect.tryPromise({
        try: () => s3File.json(),
        catch: (error) =>
          new S3ServiceError({
            message: "Failed to read S3 object as JSON",
            path,
            error,
          }),
      });
    });

    const bytes = Effect.fn("S3Service.bytes")(function* (path: string) {
      const s3File = yield* file(path);
      return yield* Effect.tryPromise({
        try: () => s3File.bytes(),
        catch: (error) =>
          new S3ServiceError({
            message: "Failed to read S3 object as bytes",
            path,
            error,
          }),
      });
    });

    const arrayBuffer = Effect.fn("S3Service.arrayBuffer")(function* (
      path: string,
    ) {
      const s3File = yield* file(path);
      return yield* Effect.tryPromise({
        try: () => s3File.arrayBuffer(),
        catch: (error) =>
          new S3ServiceError({
            message: "Failed to read S3 object as an ArrayBuffer",
            path,
            error,
          }),
      });
    });

    const stream = Effect.fn("S3Service.stream")((path: string) =>
      Effect.gen(function* () {
        const s3File = yield* file(path);
        return yield* Effect.try({
          try: () => s3File.stream(),
          catch: (error) =>
            new S3ServiceError({
              message: "Failed to stream S3 object",
              path,
              error,
            }),
        });
      }),
    );

    const exists = Effect.fn("S3Service.exists")((path: string) =>
      Effect.tryPromise({
        try: () => client.exists(path),
        catch: (error) =>
          new S3ServiceError({
            message: "Failed to check S3 object existence",
            path,
            error,
          }),
      }),
    );

    const stat = Effect.fn("S3Service.stat")((path: string) =>
      Effect.tryPromise({
        try: () => client.stat(path),
        catch: (error) =>
          new S3ServiceError({
            message: "Failed to stat S3 object",
            path,
            error,
          }),
      }),
    );

    const size = Effect.fn("S3Service.size")((path: string) =>
      Effect.tryPromise({
        try: () => client.size(path),
        catch: (error) =>
          new S3ServiceError({
            message: "Failed to get S3 object size",
            path,
            error,
          }),
      }),
    );

    const _delete = Effect.fn("S3Service.delete")((path: string) =>
      Effect.tryPromise({
        try: () => client.delete(path),
        catch: (error) =>
          new S3ServiceError({
            message: "Failed to delete S3 object",
            path,
            error,
          }),
      }),
    );

    const presign = Effect.fn("S3Service.presign")(
      (path: string, options?: Bun.S3FilePresignOptions) =>
        Effect.try({
          try: () => client.presign(path, options),
          catch: (error) =>
            new S3ServiceError({
              message: "Failed to presign S3 object",
              path,
              error,
            }),
        }),
    );

    const list = Effect.fn("S3Service.list")(
      (options?: Bun.S3ListObjectsOptions | null) =>
        Effect.tryPromise({
          try: () => client.list(options),
          catch: (error) =>
            new S3ServiceError({
              message: "Failed to list S3 objects",
              error,
            }),
        }),
    );

    return {
      file,
      write,
      text,
      json,
      bytes,
      arrayBuffer,
      stream,
      exists,
      stat,
      size,
      delete: _delete,
      presign,
      list,
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(S3ServiceConfig.layer),
  );

  static readonly testLayer = (service: typeof this.Service) =>
    Layer.succeed(this, service);
}
