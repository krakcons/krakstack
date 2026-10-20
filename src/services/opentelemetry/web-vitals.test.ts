// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { OtlpExporter } from "effect/observability";
import type { Metric } from "web-vitals";

import { BrowserOtlp } from "./browser";
import { EventLogRecord, OtlpLogs } from "../events/schema";
import { BrowserWebVitals, WebVitals } from "./web-vitals";
import { OtlpEvents } from "./events";
import { BrowserEvents } from "../events/browser";
import { ANALYTICS_CONSENT_COOKIE, saveAnalyticsPreference } from "./consent";

describe("browser Web Vitals", () => {
  it.effect(
    "does not replay a document when acceptance happens after page load",
    () => {
      let subscriptions = 0;
      return Effect.gen(function* () {
        document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Max-Age=0; Path=/`;
        yield* Effect.gen(function* () {
          saveAnalyticsPreference("accepted");
          expect(subscriptions).toBe(0);
        }).pipe(Effect.provide(BrowserWebVitals.layer()));
      }).pipe(
        Effect.provideService(OtlpEvents, { push: () => {} }),
        Effect.provideService(WebVitals, {
          subscribe: () => {
            subscriptions++;
            return () => {};
          },
        }),
        Effect.ensuring(
          Effect.sync(() => {
            document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Max-Age=0; Path=/`;
          }),
        ),
      );
    },
  );
  it.effect(
    "stops document measurements permanently on withdrawal and discards queued metrics",
    () => {
      let observer: ((metric: Metric) => void) | undefined;
      let subscriptions = 0;
      const records: Array<Parameters<OtlpEvents["Service"]["push"]>[0]> = [];
      return Effect.gen(function* () {
        const issuedAt = Math.floor(performance.timeOrigin) - 1;
        document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ version: "1", choice: "accepted", revision: "before-navigation", issuedAt, expiresAt: issuedAt + 180 * 86400000 }))}; Path=/`;
        yield* Effect.gen(function* () {
          expect(subscriptions).toBe(1);
          const metric: Metric = {
            name: "LCP",
            id: "document",
            value: 100,
            delta: 100,
            rating: "good",
            navigationType: "navigate",
            entries: [],
          };
          observer?.(metric);
          expect(records).toHaveLength(1);
          saveAnalyticsPreference("declined");
          expect(observer).toBeUndefined();
          saveAnalyticsPreference("accepted");
          expect(subscriptions).toBe(1);
          expect(observer).toBeUndefined();
          expect(records[0]?.canExport?.()).toBe(false);
        }).pipe(Effect.provide(BrowserWebVitals.layer()));
      }).pipe(
        Effect.provideService(OtlpEvents, {
          push: (record) => records.push(record),
        }),
        Effect.provideService(WebVitals, {
          subscribe: (callback) => {
            subscriptions++;
            observer = callback;
            return () => {
              observer = undefined;
            };
          },
        }),
        Effect.ensuring(
          Effect.sync(() => {
            document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Max-Age=0; Path=/`;
          }),
        ),
      );
    },
  );
  it.effect(
    "is opt-in and privacy-gated, emits semantic conventions without analytics context, and releases subscribers",
    () => {
      const observers = new Set<(metric: Metric) => void>();
      const report = (metric: Metric) => {
        for (const observer of observers) observer(metric);
      };
      const requests: string[] = [];
      const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(
          await (
            input instanceof Request ? input : new Request(input, init)
          ).text(),
        );
        return new Response("{}");
      };
      const metric: Metric = {
        name: "LCP",
        id: "v5-example",
        value: 100,
        delta: 100,
        rating: "good",
        navigationType: "navigate",
        entries: [],
      };
      const originalDnt = Object.getOwnPropertyDescriptor(
        navigator,
        "doNotTrack",
      );
      return Effect.gen(function* () {
        Object.defineProperty(navigator, "doNotTrack", {
          configurable: true,
          value: "1",
        });
        yield* Effect.void.pipe(
          Effect.provide(
            BrowserWebVitals.layer({ requireConsent: false }).pipe(
              Layer.provideMerge(
                BrowserOtlp.layer({
                  serviceName: "disabled",
                  traces: false,
                  events: {},
                }),
              ),
            ),
          ),
        );
        Object.defineProperty(navigator, "doNotTrack", {
          configurable: true,
          value: "0",
        });
        yield* Effect.void.pipe(
          Effect.provide(
            BrowserOtlp.layer({ serviceName: "default", traces: false }),
          ),
        );
        expect(observers.size).toBe(0);
        yield* Effect.gen(function* () {
          expect(observers.size).toBe(1);
          report(metric);
          report(metric);
          history.pushState(null, "", "/another-route");
          report({ ...metric, value: 200 });
          yield* (yield* OtlpExporter.Flusher).flush;
        }).pipe(
          Effect.provide(
            BrowserWebVitals.layer({ requireConsent: false }).pipe(
              Layer.provideMerge(
                BrowserOtlp.layer({
                  serviceName: "vitals",
                  traces: false,
                  events: {},
                }),
              ),
            ),
          ),
        );
        const payloads = yield* Effect.forEach(requests, (body) =>
          Schema.decodeUnknownEffect(Schema.fromJsonString(OtlpLogs))(body),
        );
        const scopes = payloads.flatMap((payload) =>
          payload.resourceLogs.flatMap((resource) => resource.scopeLogs),
        );
        expect(
          scopes.every((scope) => scope.scope?.name === "krakstack.events"),
        ).toBe(true);
        const records = yield* Schema.decodeUnknownEffect(
          Schema.Array(EventLogRecord),
        )(scopes.flatMap((scope) => scope.logRecords));
        expect(records).toHaveLength(2);
        expect(
          records.every((record) => record.eventName === "browser.web_vital"),
        ).toBe(true);
        const attribute = (record: EventLogRecord, key: string) =>
          record.attributes.find((attribute) => attribute.key === key)?.value;
        expect(
          attribute(records[0]!, "analytics.page_view.id"),
        ).toBeUndefined();
        expect(attribute(records[0]!, "url.path")).toBeUndefined();
        expect(attribute(records[0]!, "browser.web_vital.name")).toEqual({
          stringValue: "lcp",
        });
        expect(attribute(records[0]!, "browser.web_vital.id")).toEqual({
          stringValue: "v5-example",
        });
        expect(attribute(records[0]!, "browser.web_vital.delta")).toEqual({
          doubleValue: 100,
        });
        expect(attribute(records[0]!, "browser.web_vital.rating")).toEqual({
          stringValue: "good",
        });
        expect(
          attribute(records[0]!, "browser.web_vital.navigation_type"),
        ).toEqual({ stringValue: "navigate" });
        expect(attribute(records[1]!, "browser.web_vital.value")).toEqual({
          doubleValue: 200,
        });
        expect(attribute(records[0]!, "log.record.uid")).not.toEqual(
          attribute(records[1]!, "log.record.uid"),
        );
        expect(observers.size).toBe(0);
        const count = requests.length;
        report({ ...metric, value: 300 });
        expect(requests).toHaveLength(count);
      }).pipe(
        Effect.provideService(WebVitals, {
          subscribe: (callback) => {
            observers.add(callback);
            return () => {
              observers.delete(callback);
            };
          },
        }),
        Effect.ensuring(
          Effect.sync(() => {
            history.replaceState(null, "", "/");
            if (originalDnt)
              Object.defineProperty(navigator, "doNotTrack", originalDnt);
            else Reflect.deleteProperty(navigator, "doNotTrack");
          }),
        ),
        Effect.provideService(
          FetchHttpClient.Fetch,
          Object.assign(fetch, { preconnect: globalThis.fetch.preconnect }),
        ),
      );
    },
  );

  for (const signal of ["dnt", "gpc"] as const) {
    for (const respectDoNotTrack of [true, false]) {
      it.effect(
        `${respectDoNotTrack ? "respects" : "explicitly overrides"} ${signal}`,
        () => {
          let subscribed = 0;
          const property =
            signal === "dnt" ? "doNotTrack" : "globalPrivacyControl";
          const original = Object.getOwnPropertyDescriptor(navigator, property);
          return Effect.gen(function* () {
            Object.defineProperty(navigator, property, {
              configurable: true,
              value: signal === "dnt" ? "1" : true,
            });
            yield* Effect.void.pipe(
              Effect.provide(
                BrowserWebVitals.layer({
                  respectDoNotTrack,
                  requireConsent: false,
                }),
              ),
            );
            expect(subscribed).toBe(respectDoNotTrack ? 0 : 1);
          }).pipe(
            Effect.provideService(OtlpEvents, { push: () => {} }),
            Effect.provideService(WebVitals, {
              subscribe: () => {
                subscribed++;
                return () => {};
              },
            }),
            Effect.ensuring(
              Effect.sync(() => {
                if (original)
                  Object.defineProperty(navigator, property, original);
                else Reflect.deleteProperty(navigator, property);
              }),
            ),
          );
        },
      );
    }
  }

  it.effect(
    "composes with BrowserEvents without changing application event scope",
    () => {
      const requests: string[] = [];
      const observers = new Set<(metric: Metric) => void>();
      const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(
          await (
            input instanceof Request ? input : new Request(input, init)
          ).text(),
        );
        return new Response("{}");
      };
      return Effect.gen(function* () {
        yield* BrowserEvents.track("order.completed", { total: 42 });
        expect(observers.size).toBe(1);
        for (const observer of observers) {
          observer({
            name: "LCP",
            id: "v5-composed",
            value: 100,
            delta: 100,
            rating: "good",
            navigationType: "navigate",
            entries: [],
          });
        }
        yield* (yield* OtlpExporter.Flusher).flush;
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            BrowserEvents.layer({ pageViews: false, requireConsent: false }),
            BrowserWebVitals.layer({ requireConsent: false }),
          ).pipe(
            Layer.provideMerge(
              BrowserOtlp.layer({ serviceName: "composed", traces: false }),
            ),
          ),
        ),
        Effect.provideService(WebVitals, {
          subscribe: (observer) => {
            observers.add(observer);
            return () => {
              observers.delete(observer);
            };
          },
        }),
        Effect.provideService(
          FetchHttpClient.Fetch,
          Object.assign(fetch, { preconnect: globalThis.fetch.preconnect }),
        ),
        Effect.flatMap(() =>
          Effect.gen(function* () {
            expect(observers.size).toBe(0);
            expect(requests).toHaveLength(1);
            const payloads = yield* Effect.forEach(requests, (body) =>
              Schema.decodeUnknownEffect(Schema.fromJsonString(OtlpLogs))(body),
            );
            const scopes = payloads.flatMap((payload) =>
              payload.resourceLogs.flatMap((resource) => resource.scopeLogs),
            );
            const generic = yield* Schema.decodeUnknownEffect(
              Schema.Array(EventLogRecord),
            )(
              scopes.find((scope) => scope.scope?.name === "krakstack.events")
                ?.logRecords,
            );
            const application = yield* Schema.decodeUnknownEffect(
              Schema.Array(EventLogRecord),
            )(
              scopes.find(
                (scope) => scope.scope?.name === "krakstack.application.events",
              )?.logRecords,
            );
            expect(generic.map((record) => record.eventName)).toEqual([
              "browser.web_vital",
            ]);
            expect(application.map((record) => record.eventName)).toEqual([
              "order.completed",
            ]);
          }),
        ),
      );
    },
  );
});
