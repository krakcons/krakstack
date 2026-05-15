import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { auth } from "@/services/auth/config";

import { AuthBadRequest } from "./schema";

const authError = (fallback: string) => (error: unknown) =>
  new AuthBadRequest({
    message: error instanceof Error ? error.message : fallback,
  });

export const authApiHandler = HttpApiBuilder.group(Api, "auth", (handlers) =>
  handlers
    .handle("setPassword", ({ payload, request }) =>
      Effect.tryPromise({
        try: () =>
          auth.api.setPassword({
            body: { newPassword: payload.newPassword },
            headers: request.headers,
          }),
        catch: authError("Could not set password"),
      }).pipe(Effect.map(() => ({ ok: true }))),
    )
    .handle("verifyPassword", ({ payload, request }) =>
      Effect.tryPromise({
        try: () =>
          auth.api.verifyPassword({
            body: { password: payload.password },
            headers: request.headers,
          }),
        catch: authError("Could not verify password"),
      }).pipe(Effect.map(() => ({ ok: true }))),
    ),
);
