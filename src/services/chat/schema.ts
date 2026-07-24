import { Schema } from "effect";

const ChatMessageText = Schema.String.check(
  Schema.isLengthBetween(1, 4_000),
).annotate({
  identifier: "ChatMessageText",
  title: "Chat message",
  description: "A user message sent to the assistant.",
});

export const ChatAction = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("message"),
    text: ChatMessageText,
  }),
  Schema.Struct({
    type: Schema.Literal("approval"),
    approvalId: Schema.NonEmptyString,
    approved: Schema.Boolean,
  }),
]).annotate({
  identifier: "ChatAction",
  title: "Chat action",
  description: "A message or tool approval response.",
});

export const ChatRequest = Schema.Struct({
  action: ChatAction,
  history: Schema.optional(Schema.String.check(Schema.isMaxLength(500_000))),
}).annotate({
  identifier: "ChatRequest",
  title: "Chat request",
  description: "An authenticated chat request.",
});

export type ChatRequest = typeof ChatRequest.Type;

export const ChatToolMetadata = Schema.Struct({
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  destructive: Schema.Boolean,
}).annotate({ identifier: "ChatToolMetadata" });

export type ChatToolMetadata = typeof ChatToolMetadata.Type;

export const ChatEvent = Schema.Union([
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
    metadata: ChatToolMetadata,
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
  Schema.Struct({
    type: Schema.Literal("finish"),
  }),
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
  identifier: "ChatEvent",
  title: "Chat stream event",
  description: "An event emitted by the chat endpoint.",
});

export type ChatEvent = typeof ChatEvent.Type;
