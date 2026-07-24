import { Context, Data, Effect, Layer, Option, Ref, Stream } from "effect";
import {
  Chat,
  LanguageModel,
  Prompt,
  type Response,
  Tool,
  Toolkit,
} from "effect/unstable/ai";

import type { ChatAction, ChatEvent } from "./schema";
export type ChatStreamOptions<Tools extends Record<string, Tool.Any>> = {
  readonly action: typeof ChatAction.Type;
  readonly history?: string;
  readonly systemPrompt: string;
  readonly toolkit: Toolkit.WithHandler<Tools>;
};

class ChatHistoryError extends Data.TaggedError("ChatHistoryError") {}

export class ChatService extends Context.Service<ChatService>()("ChatService", {
  make: Effect.gen(function* () {
    const streamErrorDetails = (error: unknown) => {
      if (!error || typeof error !== "object") return { error: String(error) };

      const message = Reflect.get(error, "message");
      const reason = Reflect.get(error, "reason");
      const status = Reflect.get(error, "status");
      const tag = Reflect.get(error, "_tag");

      return {
        ...(typeof message === "string" ? { message } : {}),
        ...(typeof reason === "string" ? { reason } : {}),
        ...(typeof status === "number" ? { status } : {}),
        ...(typeof tag === "string" ? { tag } : {}),
      };
    };

    const eventsForPart = ({
      messageId,
      part,
      toolkit,
    }: {
      readonly messageId: string;
      readonly part: Response.AnyPart;
      readonly toolkit: {
        readonly tools: Record<string, Tool.Any>;
      };
    }): ReadonlyArray<ChatEvent> => {
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
              metadata: {
                ...(title ? { title } : {}),
                ...(tool?.description ? { description: tool.description } : {}),
                destructive: tool
                  ? Context.get(tool.annotations, Tool.Destructive)
                  : false,
              },
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
      chat,
      messageId,
      prompt,
      round,
      toolkit,
    }: {
      readonly chat: Chat.Service;
      readonly messageId: string;
      readonly prompt: Prompt.RawInput;
      readonly round: number;
      readonly toolkit: Toolkit.WithHandler<Tools>;
    }): Stream.Stream<
      ChatEvent,
      unknown,
      | LanguageModel.LanguageModel
      | Tool.HandlerServices<Tools[keyof Tools]>
      | Tool.ResultDecodingServices<Tools[keyof Tools]>
    > =>
      Stream.suspend(() => {
        let hasApproval = false;
        const toolCallIds = new Set<string>();
        const toolResultIds = new Set<string>();

        const current = chat.streamText({ prompt, toolkit }).pipe(
          Stream.tap((part) =>
            Effect.sync(() => {
              if (part.type === "tool-call" && part.providerExecuted !== true) {
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
          Stream.flatMap((part) =>
            Stream.fromIterable(eventsForPart({ messageId, part, toolkit })),
          ),
        );

        const continuation = Stream.suspend(() => {
          if (hasApproval || toolCallIds.size === 0) return Stream.empty;
          if (![...toolCallIds].every((id) => toolResultIds.has(id))) {
            return Stream.succeed<ChatEvent>({
              type: "error",
              code: "stream-failed",
            });
          }
          if (round >= 5) {
            return Stream.succeed<ChatEvent>({
              type: "error",
              code: "round-limit",
            });
          }

          return agentRounds({
            chat,
            messageId,
            prompt: [],
            round: round + 1,
            toolkit,
          });
        });

        return Stream.concat(current, continuation);
      });

    const appendApproval = Effect.fn("ChatService.appendApproval")(function* (
      chat: Chat.Service,
      action: Extract<typeof ChatAction.Type, { readonly type: "approval" }>,
    ) {
      const history = yield* Ref.get(chat.history);
      let pendingToolCallId: string | undefined;
      const respondedApprovalIds = new Set<string>();
      const resolvedToolCallIds = new Set<string>();

      for (const message of history.content) {
        for (const part of message.content) {
          if (typeof part === "string") continue;
          if (
            part.type === "tool-approval-request" &&
            part.approvalId === action.approvalId
          ) {
            pendingToolCallId = part.toolCallId;
          }
          if (part.type === "tool-approval-response") {
            respondedApprovalIds.add(part.approvalId);
          }
          if (part.type === "tool-result") resolvedToolCallIds.add(part.id);
        }
      }

      if (
        !pendingToolCallId ||
        respondedApprovalIds.has(action.approvalId) ||
        resolvedToolCallIds.has(pendingToolCallId)
      ) {
        return yield* new ChatHistoryError();
      }

      yield* Ref.set(
        chat.history,
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
    });

    const stream = Effect.fn("ChatService.stream")(function* <
      Tools extends Record<string, Tool.Any>,
    >({ action, history, systemPrompt, toolkit }: ChatStreamOptions<Tools>) {
      const model = yield* LanguageModel.LanguageModel;
      const messageId = crypto.randomUUID();
      const chat = history
        ? yield* Chat.fromJson(history)
        : yield* Chat.fromPrompt([{ role: "system", content: systemPrompt }]);

      yield* Ref.update(chat.history, Prompt.setSystem(systemPrompt));

      if (action.type === "approval") yield* appendApproval(chat, action);

      const rounds = agentRounds({
        chat,
        messageId,
        prompt: action.type === "message" ? action.text : [],
        round: 1,
        toolkit,
      });
      const complete = Stream.fromEffect(
        Effect.gen(function* () {
          const history = yield* chat.exportJson;
          return { type: "history", value: history } satisfies ChatEvent;
        }),
      ).pipe(Stream.concat(Stream.succeed<ChatEvent>({ type: "finish" })));
      const response = Stream.concat(rounds, complete).pipe(
        Stream.provideService(LanguageModel.LanguageModel, model),
        Stream.catch((error) =>
          Stream.fromEffect(
            Effect.logError("Chat stream failed", streamErrorDetails(error)),
          ).pipe(
            Stream.drain,
            Stream.concat(
              Stream.make(
                { type: "error", code: "stream-failed" } satisfies ChatEvent,
                { type: "finish" } satisfies ChatEvent,
              ),
            ),
          ),
        ),
      );

      return Stream.concat(
        Stream.succeed<ChatEvent>({ type: "message-start", messageId }),
        response,
      );
    });

    return { stream };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
