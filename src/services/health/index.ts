import { Context, Effect, Exit, Layer } from "effect";

import type {
  HealthCheckData,
  HealthCheckOutcome,
  HealthCheckResult,
  HealthDownResponse,
  HealthUpResponse,
} from "./schema";

export type HealthCheck<Requirements = never> = {
  readonly name: string;
  readonly check: Effect.Effect<HealthCheckOutcome, unknown, Requirements>;
};

export type HealthServiceChecks<Requirements = never> = {
  readonly live?: ReadonlyArray<HealthCheck<Requirements>>;
  readonly ready?: ReadonlyArray<HealthCheck<Requirements>>;
  readonly started?: ReadonlyArray<HealthCheck<Requirements>>;
};

export type HealthServiceOptions<Requirements = never> = {
  readonly checks?: HealthServiceChecks<Requirements>;
};

type RegisteredHealthChecks = {
  readonly live: ReadonlyArray<HealthCheck>;
  readonly ready: ReadonlyArray<HealthCheck>;
  readonly started: ReadonlyArray<HealthCheck>;
};

class HealthServiceConfig extends Context.Service<
  HealthServiceConfig,
  RegisteredHealthChecks
>()("@krak-stack/registry/HealthServiceConfig") {
  static readonly layerWith = <Requirements = never>({
    checks = {},
  }: HealthServiceOptions<Requirements> = {}) =>
    Layer.effect(
      this,
      Effect.gen(function* () {
        const services = yield* Effect.context<Requirements>();
        const resolve = (
          registered: ReadonlyArray<HealthCheck<Requirements>> | undefined,
        ): ReadonlyArray<HealthCheck> =>
          (registered ?? []).map(({ name, check }) => ({
            name,
            check: Effect.provide(check, services),
          }));

        return {
          live: resolve(checks.live),
          ready: resolve(checks.ready),
          started: resolve(checks.started),
        };
      }),
    );
}

export class HealthService extends Context.Service<HealthService>()(
  "@krak-stack/registry/HealthService",
  {
    make: Effect.gen(function* () {
      const checks = yield* HealthServiceConfig;
      const allChecks = Array.from(
        new Set([...checks.live, ...checks.ready, ...checks.started]),
      );
      const execute = Effect.fn("HealthService.execute")(function* (
        healthCheck: HealthCheck,
      ) {
        const exit = yield* Effect.exit(healthCheck.check);

        if (!Exit.isSuccess(exit)) {
          return {
            name: healthCheck.name,
            status: "DOWN",
          } satisfies HealthCheckResult;
        }

        return exit.value.data === undefined
          ? {
              name: healthCheck.name,
              status: exit.value.status,
            }
          : {
              name: healthCheck.name,
              status: exit.value.status,
              data: exit.value.data,
            };
      });
      const run = Effect.fn("HealthService.run")(function* (
        registered: ReadonlyArray<HealthCheck>,
      ) {
        const results = yield* Effect.forEach(registered, execute, {
          concurrency: "unbounded",
        });

        if (results.every(({ status }) => status === "UP")) {
          return {
            status: "UP",
            checks: results,
          } satisfies HealthUpResponse;
        }

        return {
          status: "DOWN",
          checks: results,
        } satisfies HealthDownResponse;
      });

      const aggregate = Effect.fn("HealthService.aggregate")(() =>
        run(allChecks),
      );
      const live = Effect.fn("HealthService.live")(() => run(checks.live));
      const ready = Effect.fn("HealthService.ready")(() => run(checks.ready));
      const started = Effect.fn("HealthService.started")(() =>
        run(checks.started),
      );

      return { aggregate, live, ready, started };
    }),
  },
) {
  static readonly up = (data?: HealthCheckData): HealthCheckOutcome =>
    data === undefined ? { status: "UP" } : { status: "UP", data };

  static readonly down = (data?: HealthCheckData): HealthCheckOutcome =>
    data === undefined ? { status: "DOWN" } : { status: "DOWN", data };

  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(HealthServiceConfig.layerWith()),
  );

  static readonly layerWith = <Requirements = never>(
    options: HealthServiceOptions<Requirements>,
  ) =>
    Layer.effect(this, this.make).pipe(
      Layer.provide(HealthServiceConfig.layerWith(options)),
    );
}

export * from "./api.builder";
export * from "./api.group";
export * from "./schema";
