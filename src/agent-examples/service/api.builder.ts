import { Effect, Option } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { AuthService } from "@krak-stack/auth/server";

import { Api } from "./api-entry";
import { Examples } from "./service";

const internalServerError = () => new HttpApiError.InternalServerError({});

export const examplesHandler = HttpApiBuilder.group(
  Api,
  "examples",
  (handlers) =>
    handlers
      .handle("listExamples", () =>
        Effect.gen(function* () {
          const examples = yield* Examples;
          const auth = yield* AuthService;
          const session = yield* auth.requireUser();
          return yield* examples
            .find({ userId: session.user.id })
            .pipe(Effect.mapError(internalServerError));
        }),
      )
      .handle("getExample", ({ params }) =>
        Effect.gen(function* () {
          const examples = yield* Examples;
          const auth = yield* AuthService;
          const session = yield* auth.requireUser();
          const example = yield* examples
            .findOne({ userId: session.user.id, id: params.id })
            .pipe(Effect.mapError(internalServerError));

          if (Option.isNone(example)) {
            return yield* new HttpApiError.NotFound({});
          }

          return example.value;
        }),
      )
      .handle("createExample", ({ payload }) =>
        Effect.gen(function* () {
          const examples = yield* Examples;
          const auth = yield* AuthService;
          const session = yield* auth.requireUser();
          return yield* examples
            .create({ userId: session.user.id, payload })
            .pipe(Effect.mapError(internalServerError));
        }),
      )
      .handle("updateExample", ({ params, payload }) =>
        Effect.gen(function* () {
          const examples = yield* Examples;
          const auth = yield* AuthService;
          const session = yield* auth.requireUser();
          const example = yield* examples
            .update({ userId: session.user.id, id: params.id, payload })
            .pipe(Effect.mapError(internalServerError));

          if (Option.isNone(example)) {
            return yield* new HttpApiError.NotFound({});
          }

          return example.value;
        }),
      )
      .handle("deleteExample", ({ params }) =>
        Effect.gen(function* () {
          const examples = yield* Examples;
          const auth = yield* AuthService;
          const session = yield* auth.requireUser();
          const example = yield* examples
            .delete({ userId: session.user.id, id: params.id })
            .pipe(Effect.mapError(internalServerError));

          if (Option.isNone(example)) {
            return yield* new HttpApiError.NotFound({});
          }

          return example.value;
        }),
      ),
);
