import { describe, expect, it } from "@effect/vitest";
import { Deferred, Effect, Fiber, Layer, Schema, Stream } from "effect";
import { TestClock } from "effect/testing";
import { LanguageModel, type Response, Toolkit } from "effect/unstable/ai";
import { FetchHttpClient, HttpRouter, HttpServer } from "effect/unstable/http";
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiClient,
} from "effect/unstable/httpapi";

import { AgentService } from "./index";
import { type AgentEvent, makeAgentApiGroup } from "./schema";

const finish: Response.StreamPartEncoded = {
  type: "finish",
  reason: "stop",
  usage: {
    inputTokens: { total: 0, uncached: 0, cacheRead: 0, cacheWrite: 0 },
    outputTokens: { total: 0, text: 0, reasoning: 0 },
  },
};

const modelLayer = (response: Stream.Stream<Response.StreamPartEncoded>) =>
  Layer.effect(
    LanguageModel.LanguageModel,
    LanguageModel.make({
      generateText: () => Effect.die("Expected streaming request"),
      streamText: () => response,
    }),
  );

const quietModel = modelLayer(
  Stream.fromEffect(Effect.sleep("15 seconds").pipe(Effect.as(finish))),
);

const agentStream = Effect.gen(function* () {
  const agent = yield* AgentService;
  const toolkit = yield* Toolkit.make();
  return yield* agent.stream({
    action: { type: "message", text: "Hello" },
    systemPrompt: "Reply briefly.",
    toolkit,
  });
}).pipe(Effect.provide(AgentService.layer));

describe("agent stream heartbeats", () => {
  it.effect(
    "emits heartbeats during silence and terminates with the response",
    () =>
      Effect.gen(function* () {
        const events: Array<AgentEvent> = [];
        const started = yield* Deferred.make<void>();
        const model = modelLayer(
          Stream.fromEffect(
            Deferred.succeed(started, undefined).pipe(
              Effect.andThen(Effect.sleep("15 seconds")),
              Effect.as(finish),
            ),
          ),
        );
        const fiber = yield* agentStream.pipe(
          Effect.flatMap((stream) =>
            Stream.runForEach(stream, (event) =>
              Effect.sync(() => {
                events.push(event);
              }),
            ),
          ),
          Effect.provide(model),
          Effect.forkChild,
        );

        yield* Deferred.await(started);
        yield* TestClock.adjust("6 seconds");
        expect(events[0]?.type).toBe("message-start");
        expect(events.some((event) => event.type === "heartbeat")).toBe(true);
        expect(events.some((event) => event.type === "finish")).toBe(false);

        yield* TestClock.adjust("10 seconds");
        yield* Fiber.join(fiber);
        expect(events.at(-1)?.type).toBe("finish");
        const count = events.length;
        yield* TestClock.adjust("10 seconds");
        expect(events).toHaveLength(count);
      }),
  );

  it.effect(
    "cancels the model and heartbeat producer when consumption stops",
    () =>
      Effect.gen(function* () {
        const started = yield* Deferred.make<void>();
        const interrupted = yield* Deferred.make<void>();
        const model = modelLayer(
          Stream.fromEffect(
            Deferred.succeed(started, undefined).pipe(
              Effect.andThen(Effect.never),
              Effect.onInterrupt(() =>
                Deferred.succeed(interrupted, undefined),
              ),
            ),
          ),
        );
        const events: Array<AgentEvent> = [];
        const heartbeat = yield* Deferred.make<void>();
        const fiber = yield* agentStream.pipe(
          Effect.flatMap((stream) =>
            Stream.runForEach(stream, (event) =>
              Effect.sync(() => {
                events.push(event);
              }).pipe(
                Effect.andThen(
                  event.type === "heartbeat"
                    ? Deferred.succeed(heartbeat, undefined)
                    : Effect.void,
                ),
              ),
            ),
          ),
          Effect.provide(model),
          Effect.forkChild,
        );
        yield* Deferred.await(started);
        yield* TestClock.adjust("6 seconds");
        yield* Deferred.await(heartbeat);
        yield* Fiber.interrupt(fiber);
        expect(events.map((event) => event.type)).toEqual([
          "message-start",
          "heartbeat",
        ]);
        yield* Deferred.await(interrupted);
      }),
  );

  it.live(
    "keeps Bun's default HTTP connection alive across 15 seconds of model silence",
    () =>
      Effect.gen(function* () {
        const api = HttpApi.make("HeartbeatTest").add(
          makeAgentApiGroup(Schema.Never),
        );
        const group = HttpApiBuilder.group(api, "agent", (handlers) =>
          handlers.handle("stream", () =>
            agentStream.pipe(Effect.provide(quietModel), Effect.orDie),
          ),
        );
        const web = HttpRouter.toWebHandler(
          HttpApiBuilder.layer(api).pipe(
            Layer.provide(group),
            Layer.provide(HttpServer.layerServices),
          ),
          { disableLogger: true },
        );
        yield* Effect.addFinalizer(() => Effect.promise(() => web.dispose()));
        const server = yield* Effect.acquireRelease(
          Effect.sync(() =>
            Bun.serve({
              hostname: "127.0.0.1",
              port: 0,
              fetch: (request) => web.handler(request),
            }),
          ),
          (server) => Effect.promise(() => server.stop(true)),
        );
        const client = yield* HttpApiClient.make(api, { baseUrl: server.url });
        const stream = yield* client.agent.stream({
          payload: { action: { type: "message", text: "Hello" } },
        });
        const events = yield* Stream.runCollect(stream);
        expect(
          events.filter((event) => event.type === "heartbeat").length,
        ).toBeGreaterThanOrEqual(2);
        expect(events.at(-1)?.type).toBe("finish");
      }).pipe(Effect.scoped, Effect.provide(FetchHttpClient.layer)),
    { timeout: 25000 },
  );
});
