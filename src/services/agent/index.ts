import {
  Context,
  Data,
  Effect,
  Layer,
  Option,
  Ref,
  Schema,
  Stream,
} from "effect";
import {
  Chat,
  LanguageModel,
  Prompt,
  type Response,
  Tool,
  Toolkit,
} from "effect/unstable/ai";

import type { AgentAction, AgentEvent } from "./schema";

export type AgentStreamOptions<Tools extends Record<string, Tool.Any>> = {
  readonly action: AgentAction;
  readonly history?: string;
  readonly systemPrompt: string;
  readonly toolkit: Toolkit.WithHandler<Tools>;
};

class AgentHistoryError extends Data.TaggedError("AgentHistoryError") {}

const AgentStreamErrorDetails = Schema.Struct({
  message: Schema.optional(Schema.String),
  reason: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Number),
  _tag: Schema.optional(Schema.String),
}).annotate({ identifier: "AgentStreamErrorDetails" });

const decodeAgentStreamErrorDetails = Schema.decodeUnknownOption(
  AgentStreamErrorDetails,
);

type AgentStreamLogDetails = {
  message?: string;
  reason?: string;
  status?: number;
  tag?: string;
};

export class AgentService extends Context.Service<AgentService>()(
  "AgentService",
  {
    make: Effect.gen(function* () {
      const streamErrorDetails = (error: Response.ErrorPart["error"]) => {
        const details = Option.getOrUndefined(
          decodeAgentStreamErrorDetails(error),
        );
        if (!details) return { error: String(error) };

        const result: AgentStreamLogDetails = {};
        if (details.message) result.message = details.message;
        if (details.reason) result.reason = details.reason;
        if (details.status !== undefined) result.status = details.status;
        if (details._tag) result.tag = details._tag;
        return result;
      };

      const eventsForPart = ({
        messageId,
        part,
        toolkit,
      }: {
        readonly messageId: string;
        readonly part: Response.AnyPart;
        readonly toolkit: { readonly tools: Record<string, Tool.Any> };
      }): ReadonlyArray<AgentEvent> => {
        switch (part.type) {
          case "text-delta":
            return [{ type: "text-delta", messageId, delta: part.delta }];
          case "tool-call": {
            const tool = toolkit.tools[part.name];
            const title = tool
              ? Option.getOrUndefined(
                  Context.getOption(tool.annotations, Tool.Title),
                )
              : undefined;
            return [
              {
                type: "tool-call",
                messageId,
                toolCallId: part.id,
                name: part.name,
                input: part.params,
                metadata: (() => {
                  const metadata = {
                    destructive: tool
                      ? Context.get(tool.annotations, Tool.Destructive)
                      : false,
                    title,
                    description: tool?.description,
                  };
                  return metadata;
                })(),
              },
            ];
          }
          case "tool-result":
            return [
              {
                type: "tool-result",
                toolCallId: part.id,
                name: part.name,
                isFailure: part.isFailure,
              },
            ];
          case "tool-approval-request":
            return [
              {
                type: "approval-required",
                approvalId: part.approvalId,
                toolCallId: part.toolCallId,
              },
            ];
          case "error":
            return [{ type: "error", code: "stream-failed" }];
          default:
            return [];
        }
      };

      const agentRounds = <Tools extends Record<string, Tool.Any>>({
        conversation,
        messageId,
        prompt,
        toolkit,
      }: {
        readonly conversation: Chat.Service;
        readonly messageId: string;
        readonly prompt: Prompt.RawInput;
        readonly toolkit: Toolkit.WithHandler<Tools>;
      }): Stream.Stream<
        AgentEvent,
        unknown,
        | LanguageModel.LanguageModel
        | Tool.HandlerServices<Tools[keyof Tools]>
        | Tool.ResultDecodingServices<Tools[keyof Tools]>
      > =>
        Stream.suspend(() => {
          let hasApproval = false;
          const toolCallIds = new Set<string>();
          const toolResultIds = new Set<string>();

          const current = conversation.streamText({ prompt, toolkit }).pipe(
            Stream.tap((part) =>
              Effect.sync(() => {
                if (
                  part.type === "tool-call" &&
                  part.providerExecuted !== true
                ) {
                  toolCallIds.add(part.id);
                }
                if (
                  part.type === "tool-result" &&
                  part.providerExecuted !== true &&
                  part.preliminary !== true
                ) {
                  toolResultIds.add(part.id);
                }
                if (part.type === "tool-approval-request") hasApproval = true;
              }),
            ),
            Stream.tap((part) =>
              part.type === "error"
                ? Effect.logError(
                    "Agent model response failed",
                    streamErrorDetails(part.error),
                  )
                : Effect.void,
            ),
            Stream.flatMap((part) =>
              Stream.fromIterable(eventsForPart({ messageId, part, toolkit })),
            ),
          );

          const continuation = Stream.suspend(() => {
            if (hasApproval || toolCallIds.size === 0) return Stream.empty;
            if (![...toolCallIds].every((id) => toolResultIds.has(id))) {
              return Stream.succeed<AgentEvent>({
                type: "error",
                code: "stream-failed",
              });
            }
            return agentRounds({
              conversation,
              messageId,
              prompt: [],
              toolkit,
            });
          });

          return Stream.concat(current, continuation);
        });

      const appendApproval = Effect.fn("AgentService.appendApproval")(
        function* (
          conversation: Chat.Service,
          action: Extract<AgentAction, { readonly type: "approval" }>,
        ) {
          const history = yield* Ref.get(conversation.history);
          let pendingToolCallId: string | undefined;
          const respondedApprovalIds = new Set<string>();
          const resolvedToolCallIds = new Set<string>();

          for (const message of history.content) {
            for (const part of message.content) {
              if (Schema.is(Schema.String)(part)) continue;
              if (
                part.type === "tool-approval-request" &&
                part.approvalId === action.approvalId
              ) {
                pendingToolCallId = part.toolCallId;
              }
              if (part.type === "tool-approval-response") {
                respondedApprovalIds.add(part.approvalId);
              }
              if (part.type === "tool-result") {
                resolvedToolCallIds.add(part.id);
              }
            }
          }

          if (
            !pendingToolCallId ||
            respondedApprovalIds.has(action.approvalId) ||
            resolvedToolCallIds.has(pendingToolCallId)
          ) {
            return yield* new AgentHistoryError();
          }

          yield* Ref.set(
            conversation.history,
            Prompt.concat(history, [
              Prompt.toolMessage({
                content: [
                  Prompt.toolApprovalResponsePart({
                    approvalId: action.approvalId,
                    approved: action.approved,
                  }),
                ],
              }),
            ]),
          );
        },
      );

      const stream = Effect.fn("AgentService.stream")(function* <
        Tools extends Record<string, Tool.Any>,
      >({ action, history, systemPrompt, toolkit }: AgentStreamOptions<Tools>) {
        const model = yield* LanguageModel.LanguageModel;
        const messageId = crypto.randomUUID();
        const conversation = history
          ? yield* Chat.fromJson(history)
          : yield* Chat.fromPrompt([{ role: "system", content: systemPrompt }]);

        yield* Ref.update(conversation.history, Prompt.setSystem(systemPrompt));

        if (action.type === "approval") {
          yield* appendApproval(conversation, action);
        }

        const rounds = agentRounds({
          conversation,
          messageId,
          prompt: action.type === "message" ? action.text : [],
          toolkit,
        });
        const complete = Stream.fromEffect(
          Effect.gen(function* () {
            const history = yield* conversation.exportJson;
            return { type: "history", value: history } satisfies AgentEvent;
          }),
        ).pipe(Stream.concat(Stream.succeed<AgentEvent>({ type: "finish" })));
        const response = Stream.concat(rounds, complete).pipe(
          Stream.provideService(LanguageModel.LanguageModel, model),
          Stream.catch((error) =>
            Stream.fromEffect(
              Effect.logError("Agent stream failed", streamErrorDetails(error)),
            ).pipe(
              Stream.drain,
              Stream.concat(
                Stream.make(
                  {
                    type: "error",
                    code: "stream-failed",
                  } satisfies AgentEvent,
                  { type: "finish" } satisfies AgentEvent,
                ),
              ),
            ),
          ),
        );

        return Stream.concat(
          Stream.succeed<AgentEvent>({ type: "message-start", messageId }),
          response,
        );
      });

      return { stream };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
