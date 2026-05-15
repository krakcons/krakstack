import {
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";

import {
  AuthBadRequest,
  AuthOkResponse,
  SetPasswordPayload,
  VerifyPasswordPayload,
} from "./schema";

export const AuthApiGroup = HttpApiGroup.make("auth")
  .add(
    HttpApiEndpoint.post("setPassword", "/auth/set-password", {
      payload: SetPasswordPayload,
      success: AuthOkResponse,
      error: AuthBadRequest,
    }).annotateMerge(
      OpenApi.annotations({
        title: "Set password",
        summary: "Set password for the current user",
        description:
          "Sets a password for the authenticated user using schema-validated input.",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.post("verifyPassword", "/auth/verify-password", {
      payload: VerifyPasswordPayload,
      success: AuthOkResponse,
      error: AuthBadRequest,
    }).annotateMerge(
      OpenApi.annotations({
        title: "Verify password",
        summary: "Verify current user password",
        description:
          "Verifies the authenticated user's password using schema-validated input.",
      }),
    ),
  )
  .annotateMerge(
    OpenApi.annotations({
      title: "Auth",
      description: "Custom KrakStack authentication endpoints.",
    }),
  );
