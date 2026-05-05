import { Context, Effect, Layer } from "effect";
import { HttpApiError, HttpApiMiddleware } from "effect/unstable/httpapi";

import { Auth } from "@/services/auth";

export class CurrentUser extends Context.Service<
  CurrentUser,
  {
    id: string;
    name: string;
    email: string;
  }
>()("site/CurrentUser") {}

export class AuthMiddleware extends HttpApiMiddleware.Service<
  AuthMiddleware,
  {
    provides: CurrentUser;
  }
>()("site/AuthMiddleware", {
  error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
}) {}

export const AuthMiddlewareLive = Layer.effect(
  AuthMiddleware,
  Effect.gen(function* () {
    const authService = yield* Auth;
    return (httpEffect) =>
      Effect.gen(function* () {
        const user = yield* authService.requireUser();
        return yield* Effect.provideService(httpEffect, CurrentUser, user);
      });
  }),
).pipe(Layer.provide(Auth.layer));
