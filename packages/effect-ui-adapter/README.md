# `@krak-stack/effect-ui-adapter`

Run an Effect UI component's model, updates, and scoped subscriptions while
React renders a hand-written TSX view. Import the named adapter from the
workspace package:

```tsx
import { effectUiToReact } from "@krak-stack/effect-ui-adapter";

const ReactCounter = effectUiToReact(Counter, initCounter, ({ model, send }) => (
  <button type="button" onClick={() => send(CounterMessage.ClickedIncrement())}>
    {model.count}
  </button>
));
```

The adapter renders the initial model during React SSR and starts the Effect UI
runtime after hydration. It does not convert HTML views to JSX, run HTML
element mounts, or hydrate query results. A root failure is surfaced to
the nearest React error boundary.

## Run the counter

From the repository root:

```sh
bun install --frozen-lockfile
bun run --cwd packages/effect-ui-adapter demo
```

Open <http://127.0.0.1:4175/counter>. The [example](examples/counter) compares
React TSX with Base UI and native Effect UI with `@effect/ui-kit`, sharing
Basecoat CSS. Both counters have **− / +** controls and increment once every
five seconds. The React view is server-rendered and hydrates in the browser.
The native view mounts in the browser with `BrowserHost.mountEffect`. Both timers
start on the client.

Choose **Inspect native** (the default) or **Inspect React** above the
counters, then open the DevTools launcher in the bottom-right corner. Both
counters stay available, but DevTools records only the selected one.
Switching reloads the demo. Time travel is available only for the native
Effect UI view.
