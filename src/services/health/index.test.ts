import { describe, expect, it } from "@effect/vitest";
import { Context, Effect, Layer } from "effect";
import { HttpApi, HttpApiBuilder, OpenApi } from "effect/unstable/httpapi";

import {
  HealthApiGroup,
  healthHandler,
  HealthService,
  type HealthCheck,
} from "./index";

class Dependency extends Context.Service<
  Dependency,
  { readonly available: boolean }
>()("HealthTest/Dependency") {}

describe("Health", () => {
  it("maps DOWN responses to HTTP 503", () => {
    const api = HttpApi.make("HealthApi").add(HealthApiGroup);
    const spec = OpenApi.fromApi(api);

    expect(spec.paths["/health"]?.get?.responses["503"]).toBeDefined();
  });

  it.effect("provides empty healthy defaults", () =>
    Effect.gen(function* () {
      const health = yield* HealthService;

      expect(yield* health.aggregate()).toEqual({ status: "UP", checks: [] });
      expect(yield* health.live()).toEqual({ status: "UP", checks: [] });
      expect(yield* health.ready()).toEqual({ status: "UP", checks: [] });
      expect(yield* health.started()).toEqual({ status: "UP", checks: [] });
    }).pipe(Effect.provide(HealthService.layer)),
  );

  it.effect("combines registered check results", () => {
    const healthLayer = HealthService.layerWith({
      checks: {
        ready: [
          {
            name: "process",
            check: Effect.succeed(HealthService.up({ eventLoop: true })),
          } satisfies HealthCheck,
          {
            name: "database",
            check: Effect.succeed(HealthService.down()),
          } satisfies HealthCheck,
        ],
      },
    });

    return Effect.gen(function* () {
      const health = yield* HealthService;

      expect(yield* health.ready()).toEqual({
        status: "DOWN",
        checks: [
          { name: "process", status: "UP", data: { eventLoop: true } },
          { name: "database", status: "DOWN" },
        ],
      });
    }).pipe(Effect.provide(healthLayer));
  });

  it.effect("converts failed effects and defects to DOWN", () => {
    const healthLayer = HealthService.layerWith({
      checks: {
        ready: [
          {
            name: "failure",
            check: Effect.fail("unavailable"),
          } satisfies HealthCheck,
          {
            name: "defect",
            check: Effect.die("broken"),
          } satisfies HealthCheck,
        ],
      },
    });

    return Effect.gen(function* () {
      const health = yield* HealthService;

      expect(yield* health.ready()).toEqual({
        status: "DOWN",
        checks: [
          { name: "failure", status: "DOWN" },
          { name: "defect", status: "DOWN" },
        ],
      });
    }).pipe(Effect.provide(healthLayer));
  });

  it.effect("captures check dependencies in layerWith", () => {
    const healthLayer = HealthService.layerWith({
      checks: {
        ready: [
          {
            name: "dependency",
            check: Effect.map(Dependency, ({ available }) =>
              available ? HealthService.up() : HealthService.down(),
            ),
          } satisfies HealthCheck<Dependency>,
        ],
      },
    }).pipe(Layer.provide(Layer.succeed(Dependency, { available: false })));

    return Effect.gen(function* () {
      const health = yield* HealthService;

      expect(yield* health.live()).toEqual({ status: "UP", checks: [] });
      expect(yield* health.ready()).toEqual({
        status: "DOWN",
        checks: [{ name: "dependency", status: "DOWN" }],
      });
      expect(yield* health.aggregate()).toEqual({
        status: "DOWN",
        checks: [{ name: "dependency", status: "DOWN" }],
      });
    }).pipe(Effect.provide(healthLayer));
  });

  it("exposes public standard health endpoints", () => {
    const endpoints = HealthApiGroup.endpoints;

    expect(endpoints.getHealth.path).toBe("/health");
    expect(endpoints.getLiveness.path).toBe("/health/live");
    expect(endpoints.getReadiness.path).toBe("/health/ready");
    expect(endpoints.getStartup.path).toBe("/health/started");
    expect(
      Object.values(endpoints).every(
        (endpoint) => endpoint.middlewares.size === 0,
      ),
    ).toBe(true);
  });

  it("builds a handler for a prefixed parent API", () => {
    const api = HttpApi.make("ParentApi").add(HealthApiGroup).prefix("/api");
    const handler = HttpApiBuilder.group(api, "health", healthHandler).pipe(
      Layer.provide(HealthService.layer),
    );
    const apiLayer = HttpApiBuilder.layer(api).pipe(Layer.provide(handler));

    expect(apiLayer).toBeDefined();
  });
});
