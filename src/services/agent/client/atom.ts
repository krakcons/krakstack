import { Effect, Stream } from "effect";
import { Atom } from "effect/unstable/reactivity";

import type {
  AgentAction,
  AgentErrorCode,
  AgentEvent,
  AgentReference,
  AgentRequest,
} from "../schema";

export type AgentToolStatus =
  | "running"
  | "approval-required"
  | "approved"
  | "denied"
  | "completed"
  | "failed";

export type AgentToolActivity = Extract<
  AgentEvent,
  { readonly type: "tool-call" }
> & {
  readonly approvalId?: string;
  readonly status: AgentToolStatus;
};

export type AgentMessage = {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly text: string;
  readonly tools: ReadonlyArray<AgentToolActivity>;
};

export type AgentSubmitAction<Resource = never> =
  | {
      readonly type: "message";
      readonly text: string;
      readonly references?: ReadonlyArray<AgentReference<Resource>>;
    }
  | {
      readonly type: "approval";
      readonly approvalId: string;
      readonly toolCallId: string;
      readonly approved: boolean;
    };

export type AgentConversationContext<Resource> = AgentReference<Resource> & {
  readonly key: string;
};

export type AgentState<Resource = never> = {
  readonly context: AgentConversationContext<Resource> | undefined;
  readonly contextLocked: boolean;
  readonly messages: ReadonlyArray<AgentMessage>;
  readonly history?: string;
  readonly pending: boolean;
  readonly error?: AgentErrorCode;
};

export const initialAgentState: AgentState<never> = {
  context: undefined,
  contextLocked: false,
  messages: [],
  pending: false,
};

const updateTool = (
  messages: ReadonlyArray<AgentMessage>,
  toolCallId: string,
  update: (tool: AgentToolActivity) => AgentToolActivity,
) =>
  messages.map((message) => ({
    ...message,
    tools: message.tools.map((tool) =>
      tool.toolCallId === toolCallId ? update(tool) : tool,
    ),
  }));

const failAgentState = <Resource>(
  state: AgentState<Resource>,
  error: AgentErrorCode,
): AgentState<Resource> => {
  const lastMessage = state.messages.at(-1);
  const messages =
    lastMessage?.role === "assistant" &&
    !lastMessage.text &&
    lastMessage.tools.length === 0
      ? state.messages.slice(0, -1)
      : state.messages;
  return { ...state, messages, error };
};

export const reduceAgentEvent = <Resource>(
  state: AgentState<Resource>,
  event: AgentEvent,
): AgentState<Resource> => {
  switch (event.type) {
    case "message-start":
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: event.messageId, role: "assistant", text: "", tools: [] },
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
    case "error":
      return failAgentState(state, event.code);
    case "finish":
      return state;
  }
};

const defaultErrorCode = (error: unknown): AgentErrorCode => {
  if (error && typeof error === "object") {
    const code = Reflect.get(error, "code");
    if (code === "stream-failed" || code === "unavailable") return code;
  }
  return "unavailable";
};

export type AgentAtomsConfig<Resource> = {
  readonly stream: (
    get: Atom.FnContext,
    request: AgentRequest<Resource>,
  ) => Effect.Effect<Stream.Stream<AgentEvent, unknown>, unknown>;
  readonly errorCode?: (error: unknown) => AgentErrorCode;
};

export type AgentSubmitInput<Resource> = {
  readonly action: AgentSubmitAction<Resource>;
  readonly context?: AgentConversationContext<Resource>;
  readonly scope: string;
};

export const makeAgentAtoms = <Resource>({
  errorCode = defaultErrorCode,
  stream,
}: AgentAtomsConfig<Resource>) => {
  const state = Atom.family((_scope: string) =>
    Atom.make<AgentState<Resource>>(initialAgentState),
  );

  const submit = Atom.fn<AgentSubmitInput<Resource>>()((input, get) => {
    const submitAction = input.action;
    const stateAtom = state(input.scope);
    const current = get(stateAtom);
    const context = current.contextLocked ? current.context : input.context;
    const approvalStatus: AgentToolStatus | undefined =
      submitAction.type === "approval"
        ? submitAction.approved
          ? "approved"
          : "denied"
        : undefined;
    const messages =
      submitAction.type === "message"
        ? [
            ...current.messages,
            {
              id: crypto.randomUUID(),
              role: "user" as const,
              text: submitAction.text,
              tools: [],
            },
          ]
        : current.messages.map((message) => ({
            ...message,
            tools: message.tools.map((tool) =>
              tool.toolCallId === submitAction.toolCallId
                ? { ...tool, status: approvalStatus ?? tool.status }
                : tool,
            ),
          }));

    get.set(stateAtom, {
      ...current,
      context,
      contextLocked: true,
      messages,
      pending: true,
      error: undefined,
    });

    const action: AgentAction<Resource> =
      submitAction.type === "message"
        ? submitAction
        : {
            type: submitAction.type,
            approvalId: submitAction.approvalId,
            approved: submitAction.approved,
          };

    return stream(get, {
      action,
      context: context
        ? { label: context.label, resource: context.resource }
        : undefined,
      history: current.history,
    }).pipe(
      Effect.flatMap(
        Stream.runForEach((event) =>
          Effect.sync(() =>
            get.set(stateAtom, reduceAgentEvent(get(stateAtom), event)),
          ),
        ),
      ),
      Effect.catch((error) =>
        Effect.sync(() =>
          get.set(stateAtom, failAgentState(get(stateAtom), errorCode(error))),
        ),
      ),
      Effect.ensuring(
        Effect.sync(() =>
          get.set(stateAtom, { ...get(stateAtom), pending: false }),
        ),
      ),
    );
  });

  const reset = Atom.fnSync<string>()((scope, get) => {
    get.set(state(scope), initialAgentState);
  });

  const removeContext = Atom.fnSync<string>()((scope, get) => {
    const stateAtom = state(scope);
    get.set(stateAtom, {
      ...get(stateAtom),
      context: undefined,
      contextLocked: true,
    });
  });

  return { removeContext, reset, state, submit } as const;
};
