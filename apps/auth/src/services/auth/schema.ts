import { Schema } from "effect";

export const SetPasswordPayload = Schema.Struct({
  newPassword: Schema.NonEmptyString,
}).annotate({
  identifier: "SetPasswordPayload",
  title: "Set password payload",
  description:
    "Payload used to set a password for the current authenticated user.",
  examples: [{ newPassword: "correct-horse-battery-staple" }],
});

export const VerifyPasswordPayload = Schema.Struct({
  password: Schema.NonEmptyString,
}).annotate({
  identifier: "VerifyPasswordPayload",
  title: "Verify password payload",
  description:
    "Payload used to verify the current authenticated user's password.",
  examples: [{ password: "correct-horse-battery-staple" }],
});

export const AuthOkResponse = Schema.Struct({
  ok: Schema.Boolean,
}).annotate({
  identifier: "AuthOkResponse",
  title: "Auth operation response",
  description: "Successful response for custom auth actions.",
  examples: [{ ok: true }],
});

export class AuthBadRequest extends Schema.ErrorClass<AuthBadRequest>(
  "AuthBadRequest",
)(
  {
    _tag: Schema.tag("AuthBadRequest"),
    message: Schema.String,
  },
  {
    identifier: "AuthBadRequest",
    title: "Auth bad request",
    description: "The auth operation could not be completed.",
    httpApiStatus: 400,
  },
) {}
