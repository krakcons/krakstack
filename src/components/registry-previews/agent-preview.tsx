import { useState } from "react";
import { BookOpenIcon, FileTextIcon } from "lucide-react";

import * as m from "@/paraglide/messages";
import {
  AgentWidget,
  type AgentWidgetReference,
  initialAgentState,
  type AgentState,
  type AgentSubmitAction,
} from "@krak-stack/registry/agent/client";

type PreviewResource = {
  readonly id: string;
  readonly type: "course" | "document";
};

export function AgentPreview() {
  const [state, setState] =
    useState<AgentState<PreviewResource>>(initialAgentState);
  const availableReferences: ReadonlyArray<
    AgentWidgetReference<PreviewResource>
  > = [
    {
      key: "course:customer-onboarding",
      label: m.home_preview_template(),
      icon: <BookOpenIcon />,
      resource: { type: "course", id: "customer-onboarding" },
    },
    {
      key: "document:product-requirements",
      label: m.home_nav_docs(),
      icon: <FileTextIcon />,
      resource: { type: "document", id: "product-requirements" },
    },
  ];

  const submit = (action: AgentSubmitAction<PreviewResource>) => {
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
        availableReferences={availableReferences}
        state={state}
        onInterrupt={() => undefined}
        onReset={() => setState(initialAgentState)}
        onSubmit={submit}
      />
    </div>
  );
}
