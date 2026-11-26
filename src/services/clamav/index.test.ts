import { createServer, type Socket } from "node:net";
import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { ClamAV } from "./index";

const withServer = (handle: (socket: Socket) => void) =>
  Effect.acquireRelease(
    Effect.promise(
      () =>
        new Promise<{ port: number; close: () => void }>((resolve, reject) => {
          const server = createServer(handle);
          server.once("error", reject);
          server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            if (!address || typeof address === "string")
              return reject(new Error("No TCP port"));
            resolve({ port: address.port, close: () => server.close() });
          });
        }),
    ),
    ({ close }) => Effect.sync(close),
  );

describe("ClamAV TCP client", () => {
  it.effect("sends the complete byte stream and accepts a framed reply", () =>
    Effect.scoped(
      Effect.gen(function* () {
        const bytes = new Uint8Array(65_537).fill(23);
        const { port } = yield* withServer((socket) => {
          let received = Buffer.alloc(0);
          socket.on("data", (part) => {
            received = Buffer.concat([received, part]);
            if (received.length !== bytes.length + 22) return;
            expect(received.subarray(0, 10).toString()).toBe("zINSTREAM\0");
            expect(received.readUInt32BE(10)).toBe(65_536);
            expect(received.subarray(14, 65_550)).toEqual(
              Buffer.from(bytes.subarray(0, 65_536)),
            );
            expect(received.readUInt32BE(65_550)).toBe(1);
            expect(received[65_554]).toBe(23);
            expect(received.readUInt32BE(65_555)).toBe(0);
            socket.write("stream: ");
            socket.end("OK\0");
          });
        });
        const verdict = yield* ClamAV.use((clamav) =>
          clamav.scan({ bytes }),
        ).pipe(Effect.provide(ClamAV.layerWith({ host: "127.0.0.1", port })));
        expect(verdict).toEqual({ _tag: "Clean" });
      }),
    ),
  );

  it.effect.each([
    ["stream: Eicar-Test-Signature FOUND\0", "Detected"],
    ["stream: Heuristics.Encrypted.Zip FOUND\0", "Unscannable"],
    ["INSTREAM size limit exceeded. ERROR\0", "Unscannable"],
    ["stream: OK", "InvalidReply"],
    ["stream: OK\0unexpected", "InvalidReply"],
    ["stream: Access denied ERROR\0", "ScanFailed"],
  ])("maps %s to %s", ([reply, expected]) =>
    Effect.scoped(
      Effect.gen(function* () {
        const { port } = yield* withServer((socket) => {
          let length = 0;
          socket.on("data", (part) => {
            length += part.length;
            if (length === 19) socket.end(reply);
          });
        });
        const result = yield* ClamAV.use((clamav) =>
          clamav.scan({ bytes: Uint8Array.of(1) }),
        ).pipe(
          Effect.map((verdict) => verdict._tag),
          Effect.catch((error) => Effect.succeed(error.reason)),
          Effect.provide(ClamAV.layerWith({ host: "127.0.0.1", port })),
        );
        expect(result).toBe(expected);
      }),
    ),
  );
});
