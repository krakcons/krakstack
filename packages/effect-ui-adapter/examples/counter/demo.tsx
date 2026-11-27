import { Button } from "@base-ui/react/button";
import type { MessageLog } from "@effect/ui";
import { effectUiToReact } from "@krak-stack/effect-ui-adapter";
import { useState } from "react";
import { CounterView, ReactCounter } from "./counter.react.tsx";
import { Counter, initCounter, type CounterProps } from "./counter.ts";

export const counterDemoProps: CounterProps = { initialCount: 0, step: 1 };

export const makeCounterDemo = (messageLog?: MessageLog.MessageLog) => {
  const DemoCounter = messageLog
    ? effectUiToReact(Counter, initCounter, CounterView, { messageLog })
    : ReactCounter;

  const CounterDemo = () => {
    const [visible, setVisible] = useState(true);
    return (
      <>
        {visible && <DemoCounter {...counterDemoProps} />}
        <Button
          className="btn"
          type="button"
          data-variant="outline"
          data-size="sm"
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? "Unmount / Démonter" : "Mount / Monter"}
        </Button>
      </>
    );
  };
  return CounterDemo;
};
