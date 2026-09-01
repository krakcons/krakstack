import { Effect, Schema } from "effect";
import { Activity, Workflow } from "effect/unstable/workflow";

import { ExamplePersistenceError, ExampleSchema } from "./schema";
import { Examples } from "./service";

export const CreateExampleV1 = Workflow.make("CreateExampleV1", {
  payload: {
    requestId: Schema.String,
    userId: Schema.String,
    name: Schema.NonEmptyString,
    description: Schema.optional(Schema.String),
  },
  success: ExampleSchema,
  error: ExamplePersistenceError,
  idempotencyKey: ({ requestId }) => requestId,
});

export const examplesWorkflowLayer = CreateExampleV1.toLayer(
  ({ userId, name, description }) =>
    Effect.gen(function* () {
      const examples = yield* Examples;

      return yield* Activity.make({
        name: "PersistExampleV1",
        success: ExampleSchema,
        error: ExamplePersistenceError,
        execute: examples
          .create({
            userId,
            payload: { name, description },
          })
          .pipe(Effect.mapError((error) => ({ message: String(error) }))),
      });
    }),
);
