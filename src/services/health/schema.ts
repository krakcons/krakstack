import { Schema } from "effect";
import { HttpApiSchema } from "effect/unstable/httpapi";

export const HealthStatus = Schema.Literals(["UP", "DOWN"]).annotate({
  identifier: "HealthStatus",
  title: "Health Status",
  description: "Whether a health check is up or down",
});
export type HealthStatus = typeof HealthStatus.Type;

export const HealthCheckData = Schema.Record(
  Schema.String,
  Schema.Union([Schema.String, Schema.Boolean, Schema.Number]),
).annotate({
  identifier: "HealthCheckData",
  title: "Health Check Data",
  description: "Non-sensitive diagnostic values for a health check",
});
export type HealthCheckData = typeof HealthCheckData.Type;

export const HealthCheckOutcome = Schema.Struct({
  status: HealthStatus,
  data: Schema.optionalKey(HealthCheckData),
}).annotate({
  identifier: "HealthCheckOutcome",
  title: "Health Check Outcome",
  description: "The status and optional diagnostic data returned by a check",
});
export type HealthCheckOutcome = typeof HealthCheckOutcome.Type;

export const HealthCheckResult = Schema.Struct({
  name: Schema.NonEmptyString,
  status: HealthStatus,
  data: Schema.optionalKey(HealthCheckData),
}).annotate({
  identifier: "HealthCheckResult",
  title: "Health Check Result",
  description: "The outcome of a named health check",
});
export type HealthCheckResult = typeof HealthCheckResult.Type;

export const HealthUpResponse = Schema.Struct({
  status: Schema.Literal("UP"),
  checks: Schema.Array(HealthCheckResult),
}).annotate({
  identifier: "HealthUpResponse",
  title: "Healthy Response",
  description: "A response where all health checks are up",
  examples: [{ status: "UP", checks: [] }],
});
export type HealthUpResponse = typeof HealthUpResponse.Type;

export const HealthDownResponse = Schema.Struct({
  status: Schema.Literal("DOWN"),
  checks: Schema.Array(HealthCheckResult),
})
  .pipe(HttpApiSchema.status(503))
  .annotate({
    identifier: "HealthDownResponse",
    title: "Unhealthy Response",
    description: "A response where one or more health checks are down",
    examples: [
      {
        status: "DOWN",
        checks: [{ name: "database", status: "DOWN" }],
      },
    ],
  });
export type HealthDownResponse = typeof HealthDownResponse.Type;

export const HealthResponse = Schema.Union([
  HealthUpResponse,
  HealthDownResponse,
]).annotate({
  identifier: "HealthResponse",
  title: "Health Response",
  description: "An aggregate health response",
});
export type HealthResponse = typeof HealthResponse.Type;
