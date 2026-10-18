// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { OtlpExporter } from "effect/observability";
import type { Metric } from "web-vitals";

import { BrowserOtlp } from "./browser";
import { EventLogRecord, OtlpLogs } from "../events/schema";
import { WebVitals } from "./web-vitals";

describe("browser Web Vitals", () => {
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
            BrowserOtlp.layer({
              serviceName: "disabled",
              traces: false,
              webVitals: true,
            }),
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
            BrowserOtlp.layer({
              serviceName: "vitals",
              traces: false,
              webVitals: true,
            }),
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
});
