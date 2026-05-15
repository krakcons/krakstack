import { Context, Effect, Layer, Schema } from "effect";
import { HttpApiMiddleware } from "effect/unstable/httpapi";

import { Auth } from "@/services/auth";

export class CurrentUser extends Context.Service<
  CurrentUser,
  {
    id: string;
    name: string;
    email: string;
  }
>()("site/CurrentUser") {}

export class Unauthorized extends Schema.TaggedErrorClass<Unauthorized>()(
  "Unauthorized",
  {
    message: Schema.String,
  },
  { httpApiStatus: 401 },
) {}

export class AuthMiddleware extends HttpApiMiddleware.Service<
  AuthMiddleware,
  {
    provides: CurrentUser;
  }
>()("site/AuthMiddleware", {
  error: Unauthorized,
}) {}

export const AuthMiddlewareLive = Layer.effect(
  AuthMiddleware,
  Effect.gen(function* () {
    const authService = yield* Auth;
    return (httpEffect) =>
      Effect.gen(function* () {
        const user = yield* authService
          .requireUser()
          .pipe(
            Effect.mapError(
              () => new Unauthorized({ message: "Authentication required" }),
            ),
          );
        return yield* Effect.provideService(httpEffect, CurrentUser, user);
      });
  }),
).pipe(Layer.provide(Auth.layer));
