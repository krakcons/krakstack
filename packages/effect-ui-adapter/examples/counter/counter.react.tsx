import { Button } from "@base-ui/react/button";
import { effectUiToReact } from "@krak-stack/effect-ui-adapter";
import { Counter, CounterMessage, initCounter } from "./counter.ts";

export const CounterView = ({
  model,
  send,
}: {
  readonly model: ReturnType<typeof initCounter>;
  readonly send: (message: typeof CounterMessage.Type) => void;
}) => (
  <div className="button-group" role="group" aria-label="Counter / Compteur">
    <Button
      className="btn"
      type="button"
      data-variant="outline"
      data-size="icon"
      onClick={() => send(CounterMessage.ClickedDecrement())}
    >
      −
    </Button>
    <output>{model.count}</output>
    <Button
      className="btn"
      type="button"
      data-variant="outline"
      data-size="icon"
      onClick={() => send(CounterMessage.ClickedIncrement())}
    >
      +
    </Button>
  </div>
);

export const ReactCounter = effectUiToReact(Counter, initCounter, CounterView);
