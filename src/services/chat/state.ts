import type { ChatEvent } from "./schema";

export type ChatToolStatus =
  | "running"
  | "approval-required"
  | "approved"
  | "denied"
  | "completed"
  | "failed";

export type ChatToolActivity = Extract<
  ChatEvent,
  { readonly type: "tool-call" }
> & {
  readonly approvalId?: string;
  readonly status: ChatToolStatus;
};

export type ChatMessage = {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly text: string;
  readonly tools: ReadonlyArray<ChatToolActivity>;
};

export type ChatSubmitAction =
  | { readonly type: "message"; readonly text: string }
  | {
      readonly type: "approval";
      readonly approvalId: string;
      readonly toolCallId: string;
      readonly approved: boolean;
    };

export type ChatErrorCode = Extract<
  ChatEvent,
  { readonly type: "error" }
>["code"];

export type ChatState = {
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly history?: string;
  readonly pending: boolean;
  readonly error?: ChatErrorCode;
};

export const initialChatState: ChatState = {
  messages: [],
  pending: false,
};

const updateTool = (
  messages: ReadonlyArray<ChatMessage>,
  toolCallId: string,
  update: (tool: ChatToolActivity) => ChatToolActivity,
) =>
  messages.map((message) => ({
    ...message,
    tools: message.tools.map((tool) =>
      tool.toolCallId === toolCallId ? update(tool) : tool,
    ),
  }));

export const reduceChatEvent = (
  state: ChatState,
  event: ChatEvent,
): ChatState => {
  switch (event.type) {
    case "message-start":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: event.messageId,
            role: "assistant",
            text: "",
            tools: [],
          },
        ],
      };
    case "tool-call":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === event.messageId
            ? {
                ...message,
                tools: [...message.tools, { ...event, status: "running" }],
              }
            : message,
        ),
      };
    case "tool-result":
      return {
        ...state,
        messages: updateTool(state.messages, event.toolCallId, (tool) => ({
          ...tool,
          status: event.isFailure ? "failed" : "completed",
        })),
      };
    case "approval-required":
      return {
        ...state,
        messages: updateTool(state.messages, event.toolCallId, (tool) => ({
          ...tool,
          approvalId: event.approvalId,
          status: "approval-required",
        })),
      };
    case "text-delta":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === event.messageId
            ? { ...message, text: message.text + event.delta }
            : message,
        ),
      };
    case "history":
      return { ...state, history: event.value };
    case "error": {
      const lastMessage = state.messages.at(-1);
      const messages =
        lastMessage?.role === "assistant" &&
        !lastMessage.text &&
        lastMessage.tools.length === 0
          ? state.messages.slice(0, -1)
          : state.messages;

      return { ...state, messages, error: event.code };
    }
    case "finish":
      return state;
  }
};
