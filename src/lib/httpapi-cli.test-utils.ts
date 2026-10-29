import {
  Effect,
  FileSystem,
  Layer,
  Path,
  Queue,
  Stdio,
  Stream,
  Terminal,
} from "effect";
import { ChildProcessSpawner } from "effect/process/ChildProcessSpawner";

export const httpApiCliEnvironmentLayer = (args: ReadonlyArray<string>) =>
  Layer.mergeAll(
    FileSystem.layerNoop({}),
    Path.layer,
    Stdio.layerTest({ args: Effect.succeed(Array.from(args)) }),
    Layer.succeed(
      Terminal.Terminal,
      Terminal.make({
        columns: Effect.succeed(80),
        rows: Effect.succeed(24),
        size: Queue.make<Terminal.Size>().pipe(
          Effect.tap((queue) => Queue.offer(queue, { columns: 80, rows: 24 })),
        ),
        readInput: Effect.die("Terminal input is not supported"),
        readLine: Effect.die("Terminal input is not supported"),
        display: () => Effect.void,
      }),
    ),
    Layer.succeed(
      ChildProcessSpawner,
      ChildProcessSpawner.of({
        spawn: () => Effect.die("Child processes are not supported"),
        exitCode: () => Effect.die("Child processes are not supported"),
        streamString: () => Stream.die("Child processes are not supported"),
        streamLines: () => Stream.die("Child processes are not supported"),
        lines: () => Effect.die("Child processes are not supported"),
        string: () => Effect.die("Child processes are not supported"),
      }),
    ),
  );
