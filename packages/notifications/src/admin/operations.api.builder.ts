// Host-authorized notification operations handlers.
import { Effect, Layer } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/http-api";
import { CurrentSendAdmin } from "./api.js";
import { SendOperationsApi } from "./operations.api.js";
import { SendOperations } from "./operations.js";
import { SendStorageError } from "./schema.js";
const redact = <A, E, R>(effect: Effect.Effect<A, E | SendStorageError, R>) =>
  Effect.catchTag(effect, "SendStorageError", () =>
    Effect.fail(new HttpApiError.InternalServerError({})),
  );
export const sendOperationsHandlers = HttpApiBuilder.group(
  SendOperationsApi,
  "sendOperations",
  Effect.fn(function* (handlers) {
    const operations = yield* SendOperations;
    return handlers
      .handle("activityTable", ({ query }) =>
        operations.activityTable(query).pipe(redact),
      )
      .handle("feedbackTable", ({ query }) =>
        operations.feedbackTable(query).pipe(redact),
      )
      .handle("suppressionsTable", ({ query }) =>
        operations.suppressionsTable(query.table).pipe(redact),
      )
      .handle("auditTable", ({ query }) =>
        operations.auditTable(query.table).pipe(redact),
      )
      .handle("recipientsTable", ({ query }) =>
        operations.recipientsTable(query).pipe(redact),
      )
      .handle("overview", ({ query }) =>
        operations.overview(query).pipe(redact),
      )
      .handle("activity", ({ query }) =>
        operations.activity(query).pipe(redact),
      )
      .handle("inspect", ({ params }) =>
        operations.inspect(params).pipe(redact),
      )
      .handle("feedback", ({ query }) =>
        operations.feedback(query).pipe(redact),
      )
      .handle("suppressions", ({ query }) =>
        operations.suppressions(query).pipe(redact),
      )
      .handle("audit", ({ query }) => operations.audit(query).pipe(redact))
      .handle("recipients", ({ query }) =>
        operations.recipients(query).pipe(redact),
      )
      .handle("addSuppression", ({ payload }) =>
        Effect.gen(function* () {
          const admin = yield* CurrentSendAdmin;
          return yield* operations.addSuppression({
            payload,
            actor: admin.reference,
          });
        }).pipe(redact),
      )
      .handle("removeSuppression", ({ params, payload }) =>
        Effect.gen(function* () {
          const admin = yield* CurrentSendAdmin;
          return yield* operations.removeSuppression({
            id: params.id,
            payload,
            actor: admin.reference,
          });
        }).pipe(redact),
      );
  }),
);
export const sendOperationsRoutes = HttpApiBuilder.layer(
  SendOperationsApi,
).pipe(Layer.provide(sendOperationsHandlers));
