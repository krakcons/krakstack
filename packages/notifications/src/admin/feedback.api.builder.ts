// Provider-authenticated notification feedback handlers.
import { Effect, Layer } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/http-api";
import { CurrentFeedbackSource, SendFeedbackApi } from "./feedback.api.js";
import { SendFeedback } from "./feedback.js";

export const sendFeedbackHandlers = HttpApiBuilder.group(
  SendFeedbackApi,
  "sendFeedback",
  Effect.fn(function* (handlers) {
    const feedback = yield* SendFeedback;
    return handlers.handle("record", ({ payload }) =>
      Effect.gen(function* () {
        const source = yield* CurrentFeedbackSource;
        return yield* feedback
          .record({ ...payload, provider: source.provider })
          .pipe(
            Effect.catchTag("SendStorageError", () =>
              Effect.fail(new HttpApiError.InternalServerError({})),
            ),
          );
      }),
    );
  }),
);
export const sendFeedbackRoutes = HttpApiBuilder.layer(SendFeedbackApi).pipe(
  Layer.provide(sendFeedbackHandlers),
);
