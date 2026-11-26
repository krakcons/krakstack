import { createConnection } from "node:net";
import { Config, Context, Effect, Layer, Schema, Semaphore } from "effect";

export type ClamAVVerdict =
  | { readonly _tag: "Clean" }
  | { readonly _tag: "Detected"; readonly signature: string }
  | { readonly _tag: "Unscannable" };

export class ClamAVError extends Schema.TaggedError<ClamAVError>()(
  "ClamAVError",
  {
    reason: Schema.Literals([
      "Unavailable",
      "Timeout",
      "InvalidReply",
      "ScanFailed",
    ]),
  },
) {}

type Endpoint = { readonly host: string; readonly port: number };
const maxBytes = 100 * 1024 * 1024;

const request = (endpoint: Endpoint, bytes?: Uint8Array) =>
  Effect.tryPromise({
    try: (signal) =>
      new Promise<string>((resolve, reject) => {
        const socket = createConnection({ ...endpoint, signal });
        let reply = Buffer.alloc(0);
        let sent = bytes === undefined;
        const fail = (reason: ClamAVError["reason"]) => {
          reject(new ClamAVError({ reason }));
          socket.destroy();
        };
        socket.on("error", () => fail("Unavailable"));
        socket.on("close", () => {
          const end = reply.indexOf(0);
          if (end < 0)
            return fail(reply.length ? "InvalidReply" : "Unavailable");
          if (end !== reply.length - 1) return fail("InvalidReply");
          const line = reply.toString("utf8", 0, end);
          if (!sent && line === "stream: OK") return fail("InvalidReply");
          resolve(line);
        });
        socket.on("data", (part: Buffer) => {
          if (reply.length + part.length > 4096) return fail("InvalidReply");
          reply = Buffer.concat([reply, part]);
        });
        socket.once("connect", () => {
          if (!bytes) {
            socket.write("zPING\0");
            return;
          }
          let offset = 0;
          const send = () => {
            if (socket.destroyed) return;
            if (offset === bytes.length) {
              sent = true;
              socket.write(Buffer.alloc(4));
              return;
            }
            const size = Math.min(64 * 1024, bytes.length - offset);
            const frame = Buffer.allocUnsafe(4 + size);
            frame.writeUInt32BE(size);
            frame.set(bytes.subarray(offset, offset + size), 4);
            offset += size;
            socket.write(frame, (error) => {
              if (error) fail("Unavailable");
              else send();
            });
          };
          socket.write("zINSTREAM\0", (error) => {
            if (error) fail("Unavailable");
            else send();
          });
        });
      }),
    catch: (error) =>
      error instanceof ClamAVError
        ? error
        : new ClamAVError({ reason: "Unavailable" }),
  }).pipe(
    Effect.timeoutOrElse({
      duration: "60 seconds",
      orElse: () => Effect.fail(new ClamAVError({ reason: "Timeout" })),
    }),
  );

export class ClamAV extends Context.Service<
  ClamAV,
  {
    readonly scan: (input: {
      readonly bytes: Uint8Array;
    }) => Effect.Effect<ClamAVVerdict, ClamAVError>;
    readonly ping: () => Effect.Effect<void, ClamAVError>;
  }
>()("krak-stack/ClamAV") {
  static readonly layerWith = (endpoint: Endpoint) =>
    Layer.effect(this, ClamAV.make(endpoint));

  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const host = yield* Config.schema(Schema.NonEmptyString, "CLAMAV_HOST");
      const port = yield* Config.Port("CLAMAV_PORT").pipe(
        Config.withDefault(3310),
      );
      return yield* ClamAV.make({ host, port });
    }),
  );

  static readonly layerTest = (service: ClamAV["Service"]) =>
    Layer.succeed(this, service);

  private static readonly make = (endpoint: Endpoint) =>
    Effect.gen(function* () {
      const semaphore = yield* Semaphore.make(2);
      const scan = Effect.fn("ClamAV.scan")(function* ({
        bytes,
      }: {
        readonly bytes: Uint8Array;
      }) {
        if (bytes.length === 0 || bytes.length > maxBytes)
          return { _tag: "Unscannable" } as const;
        const line = yield* semaphore.withPermit(request(endpoint, bytes));
        if (line === "stream: OK") return { _tag: "Clean" } as const;
        if (/^INSTREAM size limit exceeded\.? ERROR$/.test(line))
          return { _tag: "Unscannable" } as const;
        const match = /^stream: ([^\r\n]+) FOUND$/.exec(line);
        if (match) {
          const signature = match[1];
          if (
            /^Heuristics\.(Limits\.Exceeded|Encrypted)(?:\.|$)/.test(signature)
          ) {
            return { _tag: "Unscannable" } as const;
          }
          return { _tag: "Detected", signature } as const;
        }
        return yield* new ClamAVError({
          reason: line.endsWith(" ERROR") ? "ScanFailed" : "InvalidReply",
        });
      });
      const ping = Effect.fn("ClamAV.ping")(function* () {
        if ((yield* request(endpoint)) !== "PONG") {
          return yield* new ClamAVError({ reason: "InvalidReply" });
        }
      });
      return { scan, ping };
    });
}
