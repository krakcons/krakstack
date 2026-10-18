// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { Deferred, Effect, Schema } from "effect";
import { createBrowserHistory } from "@tanstack/react-router";
import { FetchHttpClient } from "effect/http";
import { OtlpExporter } from "effect/observability";

import { BrowserEvents } from "./browser";
import { BrowserOtlp } from "../opentelemetry/browser";
import { EventLogRecord, OtlpLogs } from "./schema";

describe("BrowserEvents", () => {
  it.effect(
    "keeps generic events separate from analytics scope and page context",
    () => {
      const requests: string[] = [];
      const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(
          await (
            input instanceof Request ? input : new Request(input, init)
          ).text(),
        );
        return new Response("{}");
      };
      return Effect.gen(function* () {
        yield* BrowserOtlp.event("generic", { count: 1 });
        yield* BrowserEvents.track("analytics", { count: 2 });
        yield* (yield* OtlpExporter.Flusher).flush;
        expect(requests).toHaveLength(2);
        const payloads = yield* Effect.forEach(requests, (body) =>
          Schema.decodeUnknownEffect(Schema.fromJsonString(OtlpLogs))(body),
        );
        const scopes = payloads.flatMap((payload) =>
          payload.resourceLogs.flatMap((resource) => resource.scopeLogs),
        );
        const generic = scopes.find(
          (scope) => scope.scope?.name === "krakstack.events",
        );
        expect(generic?.logRecords).toHaveLength(1);
        expect(generic?.logRecords[0]).toMatchObject({
          eventName: "generic",
          attributes: [{ key: "count", value: { intValue: 1 } }],
        });
        const analytics = scopes.find(
          (scope) => scope.scope?.name === "krakstack.application.events",
        );
        const records = yield* Schema.decodeUnknownEffect(
          Schema.Array(EventLogRecord),
        )(analytics?.logRecords);
        expect(records[0]!.eventName).toBe("analytics");
        expect(records[0]!.attributes).toContainEqual({
          key: "app.count",
          value: { intValue: 2 },
        });
        expect(
          records[0]!.attributes.some(({ key }) => key === "url.path"),
        ).toBe(true);
      }).pipe(
        Effect.provide(
          BrowserEvents.layer({
            serviceName: "both",
            traces: false,
            pageViews: false,
            events: {},
          }),
        ),
        Effect.provideService(
          FetchHttpClient.Fetch,
          Object.assign(fetch, { preconnect: globalThis.fetch.preconnect }),
        ),
      );
    },
  );
  it.effect(
    "owns automatic SPA views and restores history hooks on disposal",
    () => {
      const requests: string[] = [];
      const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(
          await (
            input instanceof Request ? input : new Request(input, init)
          ).text(),
        );
        return new Response("{}");
      };
      const original = location.href;
      return Effect.gen(function* () {
        const router = createBrowserHistory();
        const push = history.pushState;
        const replace = history.replaceState;
        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            router.destroy();
            history.replaceState(null, "", original);
          }),
        );
        yield* Effect.gen(function* () {
          router.push("/analytics-first?token=secret");
          router.flush();
          router.replace("/analytics-first#ignored");
          router.flush();
          router.replace("/analytics-second");
          router.flush();
          yield* (yield* OtlpExporter.Flusher).flush;
        }).pipe(
          Effect.provide(
            BrowserEvents.layer({
              serviceName: "navigation",
              traces: false,
            }),
          ),
          Effect.provideService(
            FetchHttpClient.Fetch,
            Object.assign(fetch, { preconnect: globalThis.fetch.preconnect }),
          ),
        );
        expect(history.pushState).toBe(push);
        expect(history.replaceState).toBe(replace);
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(OtlpLogs),
        )(requests[0]);
        const records = yield* Schema.decodeUnknownEffect(
          Schema.Array(EventLogRecord),
        )(payload.resourceLogs[0]!.scopeLogs[0]!.logRecords);
        expect(records).toHaveLength(3);
        expect(
          records.every((record) => record.eventName === "browser.page_view"),
        ).toBe(true);
        expect(records[1]!.attributes).toContainEqual({
          key: "url.path",
          value: { stringValue: "/analytics-first" },
        });
        expect(records[2]!.attributes).toContainEqual({
          key: "url.path",
          value: { stringValue: "/analytics-second" },
        });
        expect(requests[0]).not.toContain("token=secret");
      }).pipe(Effect.scoped);
    },
  );

  it.effect(
    "binds calls from other runtimes only while a browser layer is active",
    () => {
      const requests: string[] = [];
      const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(
          await (
            input instanceof Request ? input : new Request(input, init)
          ).text(),
        );
        return new Response("{}");
      };
      return Effect.gen(function* () {
        yield* BrowserEvents.track("before-startup");
        yield* Effect.gen(function* () {
          yield* Effect.promise(() =>
            Effect.runPromise(BrowserEvents.track("active")),
          );
          yield* Effect.promise(() =>
            Effect.runPromise(
              BrowserEvents.page({
                path: "/docs",
                name: "Docs",
                category: "Learning",
              }),
            ),
          );
          expect(
            (yield* BrowserEvents.track("").pipe(Effect.result))._tag,
          ).toBe("Failure");
          expect(
            (yield* BrowserEvents.track("invalid", { total: Infinity }).pipe(
              Effect.result,
            ))._tag,
          ).toBe("Failure");
          yield* (yield* OtlpExporter.Flusher).flush;
        }).pipe(
          Effect.provide(
            BrowserEvents.layer({
              serviceName: "runtime",
              traces: false,
              pageViews: false,
            }),
          ),
          Effect.provideService(
            FetchHttpClient.Fetch,
            Object.assign(fetch, { preconnect: globalThis.fetch.preconnect }),
          ),
        );
        yield* BrowserEvents.track("after-disposal");
        expect(requests).toHaveLength(1);
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(OtlpLogs),
        )(requests[0]);
        const records = yield* Schema.decodeUnknownEffect(
          Schema.Array(EventLogRecord),
        )(payload.resourceLogs[0]!.scopeLogs[0]!.logRecords);
        expect(records.map((record) => record.eventName)).toEqual([
          "active",
          "browser.page_view",
        ]);
        expect(records[1]!.attributes).toContainEqual({
          key: "analytics.page.name",
          value: { stringValue: "Docs" },
        });
        expect(records[1]!.attributes).toContainEqual({
          key: "analytics.page.category",
          value: { stringValue: "Learning" },
        });
      });
    },
  );

  it.effect(
    "flushes analytics through the shared telemetry lifecycle with keepalive",
    () =>
      Effect.gen(function* () {
        const sent = yield* Deferred.make<boolean | undefined>();
        const fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
          Deferred.doneUnsafe(sent, Effect.succeed(init?.keepalive));
          return new Response("{}");
        };
        yield* Effect.gen(function* () {
          yield* BrowserEvents.track("pending");
          globalThis.dispatchEvent(new Event("pagehide"));
          expect(yield* Deferred.await(sent)).toBe(true);
        }).pipe(
          Effect.provide(
            BrowserEvents.layer({
              serviceName: "lifecycle",
              traces: false,
              pageViews: false,
            }),
          ),
          Effect.provideService(
            FetchHttpClient.Fetch,
            Object.assign(fetch, { preconnect: globalThis.fetch.preconnect }),
          ),
        );
      }),
  );

  for (const flag of ["doNotTrack", "globalPrivacyControl"]) {
    it.effect(`respects ${flag} by default`, () => {
      let sent = 0;
      const fetch = async () => {
        sent++;
        return new Response("{}");
      };
      return Effect.gen(function* () {
        const original = Object.getOwnPropertyDescriptor(navigator, flag);
        yield* Effect.acquireRelease(
          Effect.sync(() =>
            Object.defineProperty(navigator, flag, {
              configurable: true,
              value: flag === "doNotTrack" ? "1" : true,
            }),
          ),
          () =>
            Effect.sync(() => {
              if (original) Object.defineProperty(navigator, flag, original);
              else Reflect.deleteProperty(navigator, flag);
            }),
        );
        yield* Effect.gen(function* () {
          yield* BrowserEvents.track("Should Not Send");
          const flusher = yield* OtlpExporter.Flusher;
          yield* flusher.flush;
        }).pipe(
          Effect.provide(
            BrowserEvents.layer({ serviceName: "privacy", traces: false }),
          ),
          Effect.provideService(
            FetchHttpClient.Fetch,
            Object.assign(fetch, { preconnect: globalThis.fetch.preconnect }),
          ),
        );
        expect(sent).toBe(0);
      }).pipe(Effect.scoped);
    });
  }

  it.effect(
    "uses the existing OTLP exporter and captures page context at event creation without browser storage",
    () =>
      Effect.gen(function* () {
        const requests: Array<string> = [];
        const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const request =
            input instanceof Request ? input : new Request(input, init);
          expect(request.url).toContain("/api/otel/v1/logs");
          requests.push(await request.text());
          return new Response("{}", {
            headers: { "content-type": "application/json" },
          });
        };
        const original = location.href;
        const cookies = document.cookie;
        const local = localStorage.length;
        const session = sessionStorage.length;
        history.replaceState(
          null,
          "",
          "/orders/42?utm_source=newsletter&token=secret#private",
        );
        yield* Effect.addFinalizer(() =>
          Effect.sync(() => history.replaceState(null, "", original)),
        );
        yield* Effect.gen(function* () {
          yield* BrowserEvents.page();
          yield* BrowserEvents.track(
            "Order Completed",
            { total: 42 },
            { messageId: "order-42-completed" },
          );
          history.pushState(null, "", "/docs");
          yield* BrowserEvents.page();
          const flusher = yield* OtlpExporter.Flusher;
          yield* flusher.flush;
        }).pipe(
          Effect.provide(
            BrowserEvents.layer({
              serviceName: "analytics-web",
              traces: false,
              pageViews: false,
              locale: () => "fr",
              sanitizePath: (path) =>
                path.startsWith("/orders/") ? "/orders/:id" : path,
            }),
          ),
          Effect.provideService(
            FetchHttpClient.Fetch,
            Object.assign(fetch, { preconnect: globalThis.fetch.preconnect }),
          ),
        );
        expect(requests).toHaveLength(1);
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(OtlpLogs),
        )(requests[0]);
        const scope = payload.resourceLogs[0]!.scopeLogs[0]!;
        expect(scope.scope?.name).toBe("krakstack.application.events");
        const records = yield* Schema.decodeUnknownEffect(
          Schema.Array(EventLogRecord),
        )(scope.logRecords);
        const values = records.map((record) =>
          Object.fromEntries(
            record.attributes.map(({ key, value }) => [key, value]),
          ),
        );
        expect(values[0]!["url.path"]).toEqual({ stringValue: "/orders/:id" });
        expect(values[1]!["url.path"]).toEqual({ stringValue: "/orders/:id" });
        expect(values[0]!["analytics.page_view.id"]).toEqual(
          values[1]!["analytics.page_view.id"],
        );
        expect(values[2]!["analytics.page_view.id"]).not.toEqual(
          values[0]!["analytics.page_view.id"],
        );
        expect(values[1]!["app.total"]).toEqual({ intValue: 42 });
        expect(values[1]!["log.record.uid"]).toEqual({
          stringValue: "order-42-completed",
        });
        expect(values[0]!["utm.source"]).toEqual({ stringValue: "newsletter" });
        expect(values[0]!["analytics.locale"]).toEqual({ stringValue: "fr" });
        expect(records[1]!.eventName).toBe("Order Completed");
        expect(requests[0]).not.toContain("token=secret");
        expect(document.cookie).toBe(cookies);
        expect(localStorage.length).toBe(local);
        expect(sessionStorage.length).toBe(session);
      }).pipe(Effect.scoped),
  );

  it.effect("supports explicit analytics opt-out", () => {
    let sent = 0;
    const fetch = async () => {
      sent++;
      return new Response("{}");
    };
    return Effect.gen(function* () {
      yield* BrowserEvents.track("Should Not Send");
      const flusher = yield* OtlpExporter.Flusher;
      yield* flusher.flush;
      expect(sent).toBe(0);
    }).pipe(
      Effect.provide(
        BrowserEvents.layer({
          serviceName: "opt-out",
          enabled: false,
          traces: false,
        }),
      ),
      Effect.provideService(
        FetchHttpClient.Fetch,
        Object.assign(fetch, { preconnect: globalThis.fetch.preconnect }),
      ),
    );
  });
});
