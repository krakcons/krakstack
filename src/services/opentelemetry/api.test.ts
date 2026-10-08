import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { FetchHttpClient, HttpRouter } from "effect/http";

import { HttpApiOtlp } from "./api";

describe("HttpApiOtlp", () => {
  for (const exporters of ["otlp", "console, OTLP "]) {
    it.effect(`registers and forwards all proxy signals for ${exporters}`, () =>
      Effect.gen(function* () {
        const requests: Array<Request> = [];
        const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const request =
            input instanceof Request ? input : new Request(input, init);
          requests.push(request);
          return new Response("{}", {
            status: 202,
            headers: { "content-type": "application/json" },
          });
        };
        const web = HttpRouter.toWebHandler(
          HttpApiOtlp.layer.pipe(
            Layer.provide(
              ConfigProvider.layer(
                ConfigProvider.fromUnknown({
                  OTEL_SDK_DISABLED: "true",
                  OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
                  OTEL_TRACES_EXPORTER: exporters,
                  OTEL_METRICS_EXPORTER: exporters,
                  OTEL_LOGS_EXPORTER: exporters,
                }),
              ),
            ),
            Layer.provide(
              Layer.succeed(
                FetchHttpClient.Fetch,
                Object.assign(fetch, {
                  preconnect: globalThis.fetch.preconnect,
                }),
              ),
            ),
          ),
          { disableLogger: true },
        );
        yield* Effect.addFinalizer(() => Effect.promise(() => web.dispose()));

        for (const signal of ["traces", "metrics", "logs"]) {
          const body = "{}";
          const response = yield* Effect.promise(() =>
            web.handler(
              new Request(`http://localhost/api/otel/v1/${signal}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body,
              }),
            ),
          );
          expect(response.status).toBe(202);
          expect(yield* Effect.promise(() => response.text())).toBe("{}");
          const upstream = requests.at(-1)!;
          expect(upstream.url).toBe(`http://collector:4318/v1/${signal}`);
          expect(upstream.method).toBe("POST");
          expect(upstream.headers.get("content-type")).toBe("application/json");
          expect(yield* Effect.promise(() => upstream.text())).toBe(body);
        }
        expect(requests).toHaveLength(3);
      }).pipe(Effect.scoped),
    );
  }

  it.effect("does not register signals without an OTLP exporter", () =>
    Effect.gen(function* () {
      const web = HttpRouter.toWebHandler(
        HttpApiOtlp.layer.pipe(
          Layer.provide(
            ConfigProvider.layer(
              ConfigProvider.fromUnknown({
                OTEL_SDK_DISABLED: "true",
                OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
                OTEL_METRICS_EXPORTER: "none",
                OTEL_LOGS_EXPORTER: "console",
              }),
            ),
          ),
        ),
        { disableLogger: true },
      );
      yield* Effect.addFinalizer(() => Effect.promise(() => web.dispose()));

      for (const signal of ["traces", "metrics", "logs"]) {
        const response = yield* Effect.promise(() =>
          web.handler(
            new Request(`http://localhost/api/otel/v1/${signal}`, {
              method: "POST",
              body: "{}",
            }),
          ),
        );
        expect(response.status).toBe(404);
      }
    }).pipe(Effect.scoped),
  );
});
