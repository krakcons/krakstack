import { describe, expect, it } from "@effect/vitest";
import { Effect, FileSystem, Layer, Path } from "effect";
import { HttpServer } from "effect/http";
import { HttpApiError, HttpApiTest } from "effect/http-api";
import { SendFeedback } from "../src/feedback.js";
import {
  CurrentFeedbackSource,
  SendFeedbackAccess,
  SendFeedbackApi,
} from "../src/feedback.api.js";
import { sendFeedbackHandlers } from "../src/feedback.api.builder.js";
import {
  FeedbackPayload,
  RecordFeedback,
  SendStorageError,
} from "../src/schema.js";

const payload = {
  eventId: "provider-event",
  providerMessageId: "provider-message",
  recipientAddress: "person@example.com",
  kind: "complaint",
  occurredAt: new Date(0),
} satisfies typeof FeedbackPayload.Type;

const fixture = (failure?: SendStorageError) => {
  const events: RecordFeedback[] = [];
  const service = Layer.succeed(SendFeedback, {
    record: (input) =>
      failure
        ? Effect.fail(failure)
        : Effect.sync(() => {
            events.push(input);
            return {
              status: "pending",
              deliveryId: null,
              idempotentReplay: false,
            };
          }),
    reconcile: () => Effect.die(new Error("Unexpected operation")),
  });
  const routes = Layer.mergeAll(
    sendFeedbackHandlers.pipe(Layer.provide(service)),
    HttpServer.layerServices,
  ).pipe(
    Layer.provideMerge(Layer.mergeAll(FileSystem.layerNoop({}), Path.layer)),
  );
  return { events, routes };
};

describe("provider feedback authentication boundary", () => {
  it.effect("denies unauthenticated ingestion before persistence", () => {
    const test = fixture();
    return Effect.gen(function* () {
      const client = yield* HttpApiTest.groups(SendFeedbackApi, [
        "sendFeedback",
      ]);
      expect(
        (yield* client.sendFeedback.record({ payload }).pipe(Effect.flip))._tag,
      ).toBe("Unauthorized");
      expect(test.events).toEqual([]);
    }).pipe(
      Effect.provide(test.routes),
      Effect.provideService(SendFeedbackAccess, () =>
        Effect.fail(new HttpApiError.Unauthorized({})),
      ),
    );
  });

  it.effect(
    "takes provider identity from trusted middleware, never the request payload",
    () => {
      const test = fixture();
      return Effect.gen(function* () {
        const client = yield* HttpApiTest.groups(SendFeedbackApi, [
          "sendFeedback",
        ]);
        const spoofed = { ...payload, provider: "attacker" };
        expect(
          (yield* client.sendFeedback.record({ payload: spoofed })).status,
        ).toBe("pending");
        expect(test.events).toHaveLength(1);
        expect(test.events[0].provider).toBe("ses");
      }).pipe(
        Effect.provide(test.routes),
        Effect.provideService(SendFeedbackAccess, (request) =>
          request.pipe(
            Effect.provideService(CurrentFeedbackSource, { provider: "ses" }),
          ),
        ),
      );
    },
  );

  it.effect(
    "redacts persistence failures and signals a retryable server error",
    () => {
      const test = fixture(
        new SendStorageError({
          message: "secret storage detail",
          cause: new Error("password=private"),
        }),
      );
      return Effect.gen(function* () {
        const client = yield* HttpApiTest.groups(SendFeedbackApi, [
          "sendFeedback",
        ]);
        const error = yield* client.sendFeedback
          .record({ payload })
          .pipe(Effect.flip);
        expect(error._tag).toBe("InternalServerError");
        expect(JSON.stringify(error)).not.toContain("private");
        expect(JSON.stringify(error)).not.toContain("secret storage");
      }).pipe(
        Effect.provide(test.routes),
        Effect.provideService(SendFeedbackAccess, (request) =>
          request.pipe(
            Effect.provideService(CurrentFeedbackSource, { provider: "ses" }),
          ),
        ),
      );
    },
  );
});
