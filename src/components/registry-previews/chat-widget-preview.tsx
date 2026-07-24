import { useState } from "react";

import { ChatWidget } from "@/components/ui/chat-widget";
import {
  initialChatState,
  type ChatState,
  type ChatSubmitAction,
} from "@/services/chat/state";

export function ChatWidgetPreview() {
  const [state, setState] = useState<ChatState>(initialChatState);

  const submit = (action: ChatSubmitAction) => {
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
          text: "This preview is ready to connect to your streaming chat endpoint.",
          tools: [],
        },
      ],
    }));
  };

  return (
    <div className="min-h-72">
      <ChatWidget
        state={state}
        onInterrupt={() => undefined}
        onReset={() => setState(initialChatState)}
        onSubmit={submit}
      />
    </div>
  );
}
