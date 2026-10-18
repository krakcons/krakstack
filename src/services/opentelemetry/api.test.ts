import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { FetchHttpClient, HttpRouter } from "effect/http";

import { HttpApiOtlp, OtlpLogsProcessor, OtlpProcessingError } from "./api";

describe("HttpApiOtlp", () => {
  for (const failure of ["http", "network"] as const) {
    it.effect(
      `acknowledges committed analytics on ${failure} failure but preserves generic delivery failures`,
      () =>
        Effect.gen(function* () {
          const fetch = async () => {
            if (failure === "network")
              throw new TypeError("collector unavailable");
            return new Response("unavailable", { status: 503 });
          };
          const web = HttpRouter.toWebHandler(
            HttpApiOtlp.layer.pipe(
              Layer.provide(
                Layer.succeed(OtlpLogsProcessor, {
                  process: (body) =>
                    Effect.succeed({
                      body,
                      persisted: new TextDecoder().decode(body) === "committed",
                    }),
                }),
              ),
              Layer.provide(
                ConfigProvider.layer(
                  ConfigProvider.fromUnknown({
                    OTEL_SDK_DISABLED: "true",
                    OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
                    OTEL_LOGS_EXPORTER: "otlp",
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
          for (const body of ["committed", "generic"]) {
            const response = yield* Effect.promise(() =>
              web.handler(
                new Request("http://localhost/api/otel/v1/logs", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body,
                }),
              ),
            );
            expect(response.status).toBe(
              body === "committed" ? 200 : failure === "http" ? 503 : 502,
            );
            if (body === "committed")
              expect(yield* Effect.promise(() => response.text())).toBe("{}");
          }
        }).pipe(Effect.scoped),
    );
  }

  it.effect(
    "applies an optional processor only to logs and enforces limits before forwarding",
    () =>
      Effect.gen(function* () {
        const requests: Array<{ url: string; body: string }> = [];
        let processed = 0;
        const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const request =
            input instanceof Request ? input : new Request(input, init);
          requests.push({ url: request.url, body: await request.text() });
          return new Response("{}", {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        };
        const web = HttpRouter.toWebHandler(
          HttpApiOtlp.layer.pipe(
            Layer.provide(
              Layer.succeed(OtlpLogsProcessor, {
                process: (bytes) => {
                  processed++;
                  return new TextDecoder().decode(bytes) === "reject"
                    ? Effect.fail(new OtlpProcessingError({ status: 403 }))
                    : Effect.succeed({
                        body: new TextEncoder().encode('{"resourceLogs":[]}'),
                        persisted: false,
                      });
                },
              }),
            ),
            Layer.provide(
              ConfigProvider.layer(
                ConfigProvider.fromUnknown({
                  OTEL_SDK_DISABLED: "true",
                  OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
                  OTEL_LOGS_EXPORTER: "otlp",
                  OTEL_TRACES_EXPORTER: "otlp",
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
        const send = (
          signal: string,
          body: string,
          contentType = "application/json",
        ) =>
          Effect.promise(() =>
            web.handler(
              new Request(`http://localhost/api/otel/v1/${signal}`, {
                method: "POST",
                headers: { "content-type": contentType },
                body,
              }),
            ),
          );
        expect((yield* send("logs", "{}")).status).toBe(200);
        expect(requests[0]!.body).toBe('{"resourceLogs":[]}');
        expect(
          (yield* send("traces", "unchanged", "application/x-protobuf")).status,
        ).toBe(200);
        expect(requests[1]!.body).toBe("unchanged");
        expect((yield* send("logs", "reject")).status).toBe(403);
        expect(
          (yield* send("logs", "{}", "application/x-protobuf")).status,
        ).toBe(415);
        expect((yield* send("logs", "x".repeat(64 * 1024 + 1))).status).toBe(
          413,
        );
        expect(processed).toBe(2);
        expect(requests).toHaveLength(2);
      }).pipe(Effect.scoped),
  );

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
