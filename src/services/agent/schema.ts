import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from "effect/unstable/httpapi";

const AgentMessageText = Schema.String.check(
  Schema.isLengthBetween(1, 4_000),
).annotate({
  identifier: "AgentMessageText",
  title: "Agent message",
  description: "A user message sent to the agent.",
});

const AgentReferenceLabel = Schema.String.check(Schema.isLengthBetween(1, 500));
export const AGENT_REFERENCE_LIMIT = 20;

export type AgentReference<Resource> = {
  readonly label: string;
  readonly resource: Resource;
};

export const makeAgentReference = <const Resource extends Schema.Top>(
  resource: Resource,
) =>
  Schema.Struct({
    label: AgentReferenceLabel,
    resource,
  }).annotate({
    identifier: "AgentReference",
    title: "Agent reference",
    description: "A resource referenced by an agent message.",
  });

export type AgentAction<Resource = never> =
  | {
      readonly type: "message";
      readonly text: string;
      readonly references?: ReadonlyArray<AgentReference<Resource>>;
    }
  | {
      readonly type: "approval";
      readonly approvalId: string;
      readonly approved: boolean;
    };

const makeAgentAction = <const Resource extends Schema.Top>(
  resource: Resource,
) =>
  Schema.Union([
    Schema.Struct({
      type: Schema.Literal("message"),
      text: AgentMessageText,
      references: Schema.optional(
        Schema.Array(makeAgentReference(resource)).check(
          Schema.isMaxLength(AGENT_REFERENCE_LIMIT),
        ),
      ),
    }),
    Schema.Struct({
      type: Schema.Literal("approval"),
      approvalId: Schema.NonEmptyString,
      approved: Schema.Boolean,
    }),
  ]).annotate({
    identifier: "AgentAction",
    title: "Agent action",
    description:
      "A message with optional references or a tool approval response.",
  });

export const AgentToolMetadata = Schema.Struct({
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  destructive: Schema.Boolean,
}).annotate({ identifier: "AgentToolMetadata" });

export const AgentEvent = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("message-start"),
    messageId: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal("text-delta"),
    messageId: Schema.String,
    delta: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal("tool-call"),
    messageId: Schema.String,
    toolCallId: Schema.String,
    name: Schema.String,
    input: Schema.Unknown,
    metadata: AgentToolMetadata,
  }),
  Schema.Struct({
    type: Schema.Literal("tool-result"),
    toolCallId: Schema.String,
    name: Schema.String,
    isFailure: Schema.Boolean,
  }),
  Schema.Struct({
    type: Schema.Literal("approval-required"),
    approvalId: Schema.String,
    toolCallId: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal("history"),
    value: Schema.String,
  }),
  Schema.Struct({ type: Schema.Literal("finish") }),
  Schema.Struct({
    type: Schema.Literal("error"),
    code: Schema.Literals([
      "unavailable",
      "invalid-request",
      "round-limit",
      "stream-failed",
    ]),
  }),
]).annotate({
  identifier: "AgentEvent",
  title: "Agent stream event",
  description: "An event emitted by the agent endpoint.",
});

export type AgentEvent = typeof AgentEvent.Type;
export type AgentErrorCode = Extract<
  AgentEvent,
  { readonly type: "error" }
>["code"];

const AgentStreamError = Schema.Struct({
  code: Schema.Literals(["unavailable", "stream-failed"]),
}).annotate({
  identifier: "AgentStreamError",
  title: "Agent stream error",
  description: "A recoverable agent stream failure.",
});

export type AgentRequest<Resource> = {
  readonly action: AgentAction<Resource>;
  readonly context?: AgentReference<Resource>;
  readonly history?: string;
};

export const makeAgentApiGroup = <const Resource extends Schema.Top>(
  resource: Resource,
) => {
  const AgentAction = makeAgentAction(resource);
  const AgentRequest = Schema.Struct({
    action: AgentAction,
    context: Schema.optional(makeAgentReference(resource)),
    history: Schema.optional(Schema.String.check(Schema.isMaxLength(500_000))),
  }).annotate({
    identifier: "AgentRequest",
    title: "Agent request",
    description: "An authenticated agent request.",
  });

  return HttpApiGroup.make("agent").add(
    HttpApiEndpoint.post("stream", "/agent", {
      payload: AgentRequest,
      success: HttpApiSchema.StreamSse({
        data: AgentEvent,
        error: AgentStreamError,
      }),
      error: [
        HttpApiError.BadRequest,
        HttpApiError.Unauthorized,
        HttpApiError.Forbidden,
        HttpApiError.InternalServerError,
      ],
    }).annotateMerge(
      OpenApi.annotations({
        summary: "Stream agent",
        description: "Streams an AI agent response for the current session.",
      }),
    ),
  );
};
