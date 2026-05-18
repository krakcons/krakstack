import { Schema } from "effect";

export const ApiKeyConfigId = Schema.Union([
  Schema.Literal("user"),
  Schema.Literal("organization"),
]).annotate({
  identifier: "ApiKeyConfigId",
  title: "API key configuration ID",
  description: "The configured API key owner type to verify against.",
  examples: ["user"],
});

export const ApiKeyPermissions = Schema.Record(
  Schema.String,
  Schema.Array(Schema.String),
).annotate({
  identifier: "ApiKeyPermissions",
  title: "API key permissions",
  description: "Resource/action permissions required for API key verification.",
  examples: [{ projects: ["read"] }],
});

export const VerifyApiKeyPayload = Schema.Struct({
  key: Schema.NonEmptyString,
  configId: Schema.optional(ApiKeyConfigId),
  permissions: Schema.optional(ApiKeyPermissions),
}).annotate({
  identifier: "VerifyApiKeyPayload",
  title: "Verify API key payload",
  description: "Payload used to verify a KrakStack API key remotely.",
  examples: [
    {
      key: "user_1234567890",
      configId: "user",
      permissions: { projects: ["read"] },
    },
  ],
});

export const ApiKeyVerificationError = Schema.Struct({
  message: Schema.String,
  code: Schema.String,
}).annotate({
  identifier: "ApiKeyVerificationError",
  title: "API key verification error",
  description: "Structured reason returned when an API key is invalid.",
  examples: [{ message: "API key is invalid", code: "INVALID_API_KEY" }],
});

export const VerifiedApiKey = Schema.Struct({
  id: Schema.String,
  configId: Schema.String,
  name: Schema.NullOr(Schema.String),
  start: Schema.NullOr(Schema.String),
  prefix: Schema.NullOr(Schema.String),
  referenceId: Schema.String,
  enabled: Schema.NullOr(Schema.Boolean),
  expiresAt: Schema.NullOr(Schema.DateFromString),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
  permissions: Schema.NullOr(ApiKeyPermissions),
  metadata: Schema.NullOr(Schema.Unknown),
}).annotate({
  identifier: "VerifiedApiKey",
  title: "Verified API key metadata",
  description: "Non-secret metadata for a verified API key.",
  examples: [
    {
      id: "api-key-id",
      configId: "user",
      name: "Production key",
      start: "user_1234",
      prefix: "user_",
      referenceId: "user-id",
      enabled: true,
      expiresAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      permissions: { projects: ["read"] },
      metadata: null,
    },
  ],
});

export const VerifyApiKeyResponse = Schema.Struct({
  valid: Schema.Boolean,
  error: Schema.NullOr(ApiKeyVerificationError),
  key: Schema.NullOr(VerifiedApiKey),
}).annotate({
  identifier: "VerifyApiKeyResponse",
  title: "Verify API key response",
  description: "Result of verifying a remote API key.",
  examples: [
    {
      valid: true,
      error: null,
      key: {
        id: "api-key-id",
        configId: "user",
        name: "Production key",
        start: "user_1234",
        prefix: "user_",
        referenceId: "user-id",
        enabled: true,
        expiresAt: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        permissions: { projects: ["read"] },
        metadata: null,
      },
    },
  ],
});

export type VerifyApiKeyPayload = typeof VerifyApiKeyPayload.Type;
export type VerifyApiKeyResponse = typeof VerifyApiKeyResponse.Type;
