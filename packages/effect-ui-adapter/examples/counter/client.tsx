import { MessageLog } from "@effect/ui";
import { DevTools } from "@effect/ui-devtools";
import { BrowserHost } from "@effect/ui/html";
import { Context, Effect, Layer } from "effect";
import { hydrateRoot } from "react-dom/client";
import { Counter } from "./counter.ts";
import { counterDemoProps, makeCounterDemo } from "./demo.tsx";

Effect.runFork(
  Effect.scoped(
    Effect.gen(function* () {
      const reactCounter = document.getElementById("react-counter");
      const nativeCounter = document.getElementById("native-counter");
      if (!reactCounter || !nativeCounter) return;

      const inspectReact = reactCounter.hasAttribute("data-inspected");
      const devTools = yield* Layer.build(DevTools.layer({ webMcp: false }));
      const CounterDemo = makeCounterDemo(
        inspectReact
          ? Context.get(devTools, MessageLog.MessageLog)
          : undefined,
      );
      const root = hydrateRoot(reactCounter, <CounterDemo />);
      yield* Effect.addFinalizer(() => Effect.sync(() => root.unmount()));

      yield* BrowserHost.mountEffect(Counter, counterDemoProps, nativeCounter, {
        head: false,
      }).pipe(Effect.provideContext(inspectReact ? Context.empty() : devTools));
      yield* Effect.never;
    }),
  ),
);
