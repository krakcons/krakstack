import { Context, Effect, Layer } from "effect";
import { HttpServerRequest } from "effect/unstable/http";
import { HttpApiError } from "effect/unstable/httpapi";

import { auth } from "@/services/auth/config";

const internalServerError = () => new HttpApiError.InternalServerError({});

export class Auth extends Context.Service<Auth>()("Auth", {
  make: Effect.gen(function* () {
    const getSession = Effect.fn("Auth.getSession")(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const session = yield* Effect.tryPromise({
        try: () => auth.api.getSession({ headers: new Headers(request.headers) }),
        catch: internalServerError,
      });
      return session;
    });

    const requireUser = Effect.fn("Auth.requireUser")(function* () {
      const session = yield* getSession();
      if (!session) {
        return yield* new HttpApiError.Unauthorized({});
      }
      return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      };
    });

    return { getSession, requireUser };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
