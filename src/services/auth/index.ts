import { Context, Effect, Layer } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
  HttpServerRequest,
} from "effect/unstable/http";
import { HttpApiError } from "effect/unstable/httpapi";

import { auth } from "@/services/auth/config";

import { VerifyApiKeyPayload, VerifyApiKeyResponse } from "./schema";

const internalServerError = () => new HttpApiError.InternalServerError({});

const authBaseUrl = () => {
  const value =
    process.env.KRAKSTACK_AUTH_URL ?? process.env.VITE_KRAKSTACK_AUTH_URL;

  if (!value) {
    throw new Error("KRAKSTACK_AUTH_URL is not configured");
  }

  return value.replace(/\/$/, "");
};

export class Auth extends Context.Service<Auth>()("Auth", {
  make: Effect.gen(function* () {
    const http = yield* HttpClient.HttpClient;

    const getSession = Effect.fn("Auth.getSession")(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const session = yield* Effect.tryPromise({
        try: () =>
          auth.api.getSession({ headers: new Headers(request.headers) }),
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

    const verifyApiKey = Effect.fn("Auth.verifyApiKey")(function* (
      payload: VerifyApiKeyPayload,
    ) {
      return yield* HttpClientRequest.post(
        `${authBaseUrl()}/api/auth/verify-api-key`,
      ).pipe(
        HttpClientRequest.bodyJson(payload),
        Effect.flatMap((request) => http.execute(request)),
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.flatMap(HttpClientResponse.schemaBodyJson(VerifyApiKeyResponse)),
        Effect.mapError(internalServerError),
      );
    });

    return { getSession, requireUser, verifyApiKey };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(FetchHttpClient.layer),
  );
}
