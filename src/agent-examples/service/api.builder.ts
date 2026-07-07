import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { CurrentUser } from "@/services/auth/middleware";
import { Api } from "./api-entry";
import { Examples } from "./service";

const internalServerError = () => new HttpApiError.InternalServerError({});

export const examplesHandler = HttpApiBuilder.group(Api, "examples", (handlers) =>
  handlers
    .handle("listExamples", () =>
      Effect.gen(function* () {
        const examples = yield* Examples;
        const user = yield* CurrentUser;

        return yield* examples
          .list({ userId: user.id })
          .pipe(Effect.mapError(internalServerError));
      }),
    )
    .handle("getExample", ({ params }) =>
      Effect.gen(function* () {
        const examples = yield* Examples;
        const user = yield* CurrentUser;
        const example = yield* examples
          .get({ userId: user.id, id: params.id })
          .pipe(Effect.mapError(internalServerError));

        if (!example) return yield* new HttpApiError.NotFound({});

        return example;
      }),
    )
    .handle("createExample", ({ payload }) =>
      Effect.gen(function* () {
        const examples = yield* Examples;
        const user = yield* CurrentUser;

        return yield* examples
          .create({ userId: user.id, payload })
          .pipe(Effect.mapError(internalServerError));
      }),
    )
    .handle("updateExample", ({ params, payload }) =>
      Effect.gen(function* () {
        const examples = yield* Examples;
        const user = yield* CurrentUser;

        const example = yield* examples
          .update({ userId: user.id, id: params.id, payload })
          .pipe(Effect.mapError(internalServerError));

        if (!example) return yield* new HttpApiError.NotFound({});

        return example;
      }),
    )
    .handle("deleteExample", ({ params }) =>
      Effect.gen(function* () {
        const examples = yield* Examples;
        const user = yield* CurrentUser;

        const example = yield* examples
          .delete({ userId: user.id, id: params.id })
          .pipe(Effect.mapError(internalServerError));

        if (!example) return yield* new HttpApiError.NotFound({});

        return example;
      }),
    ),
);
