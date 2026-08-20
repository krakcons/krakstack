import {
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";

import { HealthDownResponse, HealthUpResponse } from "./schema";

const errors = [HealthDownResponse, HttpApiError.InternalServerError] as const;

export const HealthApiGroup = HttpApiGroup.make("health")
  .annotateMerge(
    OpenApi.annotations({
      title: "Health",
      description: "Application health checks",
    }),
  )
  .add(
    HttpApiEndpoint.get("getHealth", "/health", {
      success: HealthUpResponse,
      error: errors,
    }).annotateMerge(
      OpenApi.annotations({
        summary: "Get aggregate health",
        description:
          "Runs all registered liveness, readiness, and startup checks.",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.get("getLiveness", "/health/live", {
      success: HealthUpResponse,
      error: errors,
    }).annotateMerge(
      OpenApi.annotations({
        summary: "Get application liveness",
        description: "Returns whether the application process is responsive.",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.get("getReadiness", "/health/ready", {
      success: HealthUpResponse,
      error: errors,
    }).annotateMerge(
      OpenApi.annotations({
        summary: "Get application readiness",
        description:
          "Returns whether the application is ready to serve traffic.",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.get("getStartup", "/health/started", {
      success: HealthUpResponse,
      error: errors,
    }).annotateMerge(
      OpenApi.annotations({
        summary: "Get application startup status",
        description: "Returns whether the application has completed startup.",
      }),
    ),
  );
