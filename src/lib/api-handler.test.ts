import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { FetchHttpClient, HttpRouter } from "effect/http";

import { appLayer } from "./api-handler";

describe("site telemetry integration", () => {
  it.effect("serves the API without a configured collector", () =>
    Effect.gen(function* () {
      const web = HttpRouter.toWebHandler(
        appLayer.pipe(
          Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))),
        ),
        { disableLogger: true },
      );
      yield* Effect.addFinalizer(() => Effect.promise(web.dispose));
      const response = yield* Effect.promise(() =>
        web.handler(new Request("http://localhost/api/openapi.json")),
      );
      expect(response.status).toBe(200);
      expect(yield* Effect.promise(() => response.json())).toMatchObject({
        info: { title: "KrakStack Site API", version: "1.0.0" },
      });
      for (const path of [
        "/api/health",
        "/api/health/live",
        "/api/health/ready",
        "/api/health/started",
      ]) {
        const health = yield* Effect.promise(() =>
          web.handler(new Request(`http://localhost${path}`)),
        );
        expect(health.status).toBe(200);
        expect(yield* Effect.promise(() => health.json())).toEqual({
          status: "UP",
          checks: [],
        });
      }
      const documentation = yield* Effect.promise(() =>
        web.handler(new Request("http://localhost/api/docs")),
      );
      expect(documentation.status).toBe(200);
      expect(documentation.headers.get("content-type")).toContain("text/html");
    }).pipe(Effect.scoped),
  );

  it.effect(
    "enriches browser events without SQL and strips untrusted identity",
    () =>
      Effect.gen(function* () {
        const requests: Request[] = [];
        const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          requests.push(
            input instanceof Request ? input : new Request(input, init),
          );
          return new Response("{}", { status: 202 });
        };
        const web = HttpRouter.toWebHandler(
          appLayer.pipe(
            Layer.provide(
              ConfigProvider.layer(
                ConfigProvider.fromUnknown({
                  OTEL_SDK_DISABLED: "true",
                  OTEL_SERVICE_NAME: "krakstack-site-api",
                  VITE_SITE_URL: "http://localhost",
                  APP_SECRET: "test-events-secret-at-least-32-characters",
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
        yield* Effect.addFinalizer(() => Effect.promise(web.dispose));
        const attribute = (key: string, value: string) => ({
          key,
          value: { stringValue: value },
        });
        const body = JSON.stringify({
          resourceLogs: [
            {
              scopeLogs: [
                {
                  scope: { name: "krakstack.application.events" },
                  logRecords: [
                    {
                      eventName: "browser.page_view",
                      timeUnixNano: (
                        BigInt(Date.now()) * 1_000_000n
                      ).toString(),
                      attributes: [
                        attribute("app.event.schema.version", "1"),
                        attribute("log.record.uid", crypto.randomUUID()),
                        attribute(
                          "analytics.page_view.id",
                          crypto.randomUUID(),
                        ),
                        attribute("url.path", "/en/"),
                        attribute("user.id", "forged-browser-user"),
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
        const response = yield* Effect.promise(() =>
          web.handler(
            new Request("http://localhost/api/otel/v1/logs", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                origin: "http://localhost",
                "cf-connecting-ip": "203.0.113.42",
                "cf-ipcountry": "CA",
                "cf-region-code": "ON",
                "cf-ipcity": "Ottawa",
              },
              body,
            }),
          ),
        );
        expect(response.status).toBe(202);
        expect(requests).toHaveLength(1);
        expect(requests[0]?.url).toBe("http://collector:4318/v1/logs");
        expect(requests[0]?.method).toBe("POST");
        const forwarded = yield* Effect.promise(() => requests[0]!.text());
        expect(forwarded).toContain("browser.page_view");
        expect(forwarded).toContain(
          '"key":"app.event.source","value":{"stringValue":"browser"}',
        );
        expect(forwarded).not.toContain("forged-browser-user");
        expect(forwarded).toContain(
          '"key":"geo.country.iso_code","value":{"stringValue":"CA"}',
        );
        expect(forwarded).toContain(
          '"key":"geo.region.iso_code","value":{"stringValue":"CA-ON"}',
        );
        expect(forwarded).toContain(
          '"key":"geo.locality.name","value":{"stringValue":"Ottawa"}',
        );
        expect(forwarded).not.toContain("203.0.113.42");
      }).pipe(Effect.scoped),
  );
});
