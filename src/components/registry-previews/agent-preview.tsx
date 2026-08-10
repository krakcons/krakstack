import { useState } from "react";

import { AgentWidget } from "@/services/agent/client/widget";
import {
  initialAgentState,
  type AgentState,
  type AgentSubmitAction,
} from "@/services/agent/client/atom";

export function AgentPreview() {
  const [state, setState] = useState<AgentState>(initialAgentState);

  const submit = (action: AgentSubmitAction) => {
    if (action.type !== "message") return;

    setState((current) => ({
      ...current,
      messages: [
        ...current.messages,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: action.text,
          tools: [],
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "This preview is ready to connect to your streaming agent endpoint.",
          tools: [],
        },
      ],
    }));
  };

  return (
    <div className="min-h-72">
      <AgentWidget
        state={state}
        onInterrupt={() => undefined}
        onReset={() => setState(initialAgentState)}
        onSubmit={submit}
      />
    </div>
  );
}
