// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { createBrowserHistory } from "@tanstack/react-router";
import { ConfigProvider, DateTime, Deferred, Effect, Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { OtlpExporter } from "effect/observability";
import { TestClock } from "effect/testing";

import { BrowserOtlp as BrowserRuntime } from "./browser";
import { ServerOtlp } from "./server";

const BrowserOtlp = {
  ...BrowserRuntime,
  layer: (options: Parameters<typeof BrowserRuntime.layer>[0]) =>
    BrowserRuntime.layer({
      ...options,
      events: options.events
        ? { pageViews: false, ...options.events }
        : options.events,
    }),
};

const LogsPayload = Schema.fromJsonString(
  Schema.Struct({
    resourceLogs: Schema.Array(
      Schema.Struct({
        resource: Schema.Struct({ attributes: Schema.Array(Schema.Unknown) }),
        scopeLogs: Schema.Array(
          Schema.Struct({
            logRecords: Schema.Array(
              Schema.Struct({
                eventName: Schema.String,
                timeUnixNano: Schema.String,
                observedTimeUnixNano: Schema.String,
                severityNumber: Schema.Number,
                body: Schema.optional(Schema.Unknown),
                severityText: Schema.optional(Schema.String),
                traceId: Schema.optional(Schema.String),
                spanId: Schema.optional(Schema.String),
                attributes: Schema.Array(
                  Schema.Struct({
                    key: Schema.String,
                    value: Schema.Unknown,
                  }),
                ),
              }),
            ),
          }),
        ),
      }),
    ),
  }),
).annotate({ identifier: "TestEventLogsPayload" });

const captureRequests = () => {
  const requests: Array<{ request: Request; body: string }> = [];
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push({ request, body: await request.text() });
    return new Response(null, { status: 200 });
  };
  return { requests, fetch };
};

describe("OTLP events", () => {
  it.effect(
    "observes TanStack's browser history used by TanStack Start",
    () => {
      const { requests, fetch } = captureRequests();
      return Effect.gen(function* () {
        const originalUrl = location.href;
        const routerHistory = createBrowserHistory();
        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            routerHistory.destroy();
            history.replaceState(null, "", originalUrl);
          }),
        );
        yield* Effect.gen(function* () {
          routerHistory.push("/tanstack-first?token=secret");
          routerHistory.flush();
          routerHistory.replace("/tanstack-second#private");
          routerHistory.flush();
          yield* (yield* OtlpExporter.Flusher).flush;
        }).pipe(
          Effect.provide(
            BrowserRuntime.layer({
              serviceName: "tanstack-test",
              events: {},
              traces: false,
            }),
          ),
          Effect.provideService(FetchHttpClient.Fetch, fetch),
        );
        const payload = yield* Schema.decodeUnknownEffect(LogsPayload)(
          requests[0]!.body,
        );
        const records = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords;
        expect(records).toHaveLength(3);
        expect(records[1]!.attributes).toContainEqual({
          key: "url.path",
          value: { stringValue: "/tanstack-first" },
        });
        expect(records[2]!.attributes).toContainEqual({
          key: "url.path",
          value: { stringValue: "/tanstack-second" },
        });
        expect(requests[0]!.body).not.toContain("secret");
      }).pipe(Effect.scoped);
    },
  );

  it.effect(
    "automatically records initial and SPA pathname changes with occurrence-time identity and scoped history hooks",
    () => {
      const { requests, fetch } = captureRequests();
      const originalPush = history.pushState;
      const originalReplace = history.replaceState;
      const originalUrl = location.href;
      return Effect.gen(function* () {
        yield* Effect.addFinalizer(() =>
          Effect.sync(() =>
            originalReplace.call(history, null, "", originalUrl),
          ),
        );
        history.replaceState(null, "", "/initial?token=secret#private");
        yield* Effect.gen(function* () {
          history.replaceState(null, "", "/initial?other=secret#changed");
          history.pushState(null, "", "/initial#hash-only");
          yield* BrowserRuntime.identify({
            userId: "user-1",
            organizationId: "org-1",
          });
          history.pushState(null, "", "/docs?token=secret");
          history.replaceState(null, "", "/faq#private");
          originalReplace.call(history, null, "", "/docs?back=secret");
          globalThis.dispatchEvent(new PopStateEvent("popstate"));
          yield* BrowserRuntime.identify({ userId: "user-2" });
          history.pushState(null, "", "/next");
          yield* (yield* OtlpExporter.Flusher).flush;
        }).pipe(
          Effect.provide(
            BrowserRuntime.layer({
              serviceName: "pageviews-test",
              events: {},
              traces: false,
            }),
          ),
          Effect.provideService(FetchHttpClient.Fetch, fetch),
        );
        expect(history.pushState).toBe(originalPush);
        expect(history.replaceState).toBe(originalReplace);
        expect(requests).toHaveLength(1);
        const payload = yield* Schema.decodeUnknownEffect(LogsPayload)(
          requests[0]!.body,
        );
        const records = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords;
        expect(records).toHaveLength(5);
        expect(
          records.every((record) => record.eventName === "browser.page_view"),
        ).toBe(true);
        expect(
          records.map(
            (record) =>
              record.attributes.find(({ key }) => key === "url.path")?.value,
          ),
        ).toEqual([
          { stringValue: "/initial" },
          { stringValue: "/docs" },
          { stringValue: "/faq" },
          { stringValue: "/docs" },
          { stringValue: "/next" },
        ]);
        expect(
          records[0]!.attributes.some(({ key }) => key === "user.id"),
        ).toBe(false);
        expect(records[1]!.attributes).toContainEqual({
          key: "user.id",
          value: { stringValue: "user-1" },
        });
        expect(records[4]!.attributes).toContainEqual({
          key: "user.id",
          value: { stringValue: "user-2" },
        });
        expect(requests[0]!.body).not.toContain("secret");
      }).pipe(Effect.scoped);
    },
  );

  it.effect(
    "does not install automatic page tracking when events are disabled or pageViews is false",
    () => {
      const { requests, fetch } = captureRequests();
      const push = history.pushState;
      const replace = history.replaceState;
      return Effect.forEach(
        [
          BrowserRuntime.layer({
            serviceName: "pageviews-test",
            traces: false,
          }),
          BrowserRuntime.layer({
            serviceName: "pageviews-test",
            traces: false,
            events: { pageViews: false },
          }),
        ],
        (layer) =>
          Effect.gen(function* () {
            expect(history.pushState).toBe(push);
            expect(history.replaceState).toBe(replace);
            yield* (yield* OtlpExporter.Flusher).flush;
            expect(requests).toHaveLength(0);
          }).pipe(
            Effect.provide(layer),
            Effect.provideService(FetchHttpClient.Fetch, fetch),
          ),
      );
    },
  );

  it.effect(
    "uses the active exporter from effects run outside its runtime and detaches on disposal",
    () => {
      const { requests, fetch } = captureRequests();
      return Effect.gen(function* () {
        yield* BrowserOtlp.track("app.before_startup");
        yield* Effect.gen(function* () {
          yield* Effect.promise(() =>
            Effect.runPromise(
              BrowserOtlp.identify({
                userId: "user-1",
                organizationId: "org-1",
              }),
            ),
          );
          yield* Effect.promise(() =>
            Effect.runPromise(BrowserOtlp.track("app.first")),
          );
          yield* Effect.promise(() =>
            Effect.runPromise(BrowserOtlp.identify({ userId: "user-2" })),
          );
          yield* Effect.promise(() =>
            Effect.runPromise(BrowserOtlp.page({ path: "/docs" })),
          );
          yield* Effect.promise(() => Effect.runPromise(BrowserOtlp.reset));
          yield* Effect.promise(() =>
            Effect.runPromise(BrowserOtlp.track("app.logged_out")),
          );
          yield* (yield* OtlpExporter.Flusher).flush;
        }).pipe(
          Effect.provide(
            BrowserOtlp.layer({
              serviceName: "events-test",
              events: {},
              traces: false,
            }),
          ),
          Effect.provideService(FetchHttpClient.Fetch, fetch),
        );
        yield* BrowserOtlp.track("app.after_disposal");
        expect(requests).toHaveLength(1);
        const payload = yield* Schema.decodeUnknownEffect(LogsPayload)(
          requests[0]!.body,
        );
        const records = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords;
        expect(records.map((record) => record.eventName)).toEqual([
          "app.first",
          "browser.page_view",
          "app.logged_out",
        ]);
        expect(records[0]!.attributes).toEqual(
          expect.arrayContaining([
            { key: "user.id", value: { stringValue: "user-1" } },
            { key: "organization.id", value: { stringValue: "org-1" } },
          ]),
        );
        expect(records[1]!.attributes).toEqual(
          expect.arrayContaining([
            { key: "user.id", value: { stringValue: "user-2" } },
            { key: "url.path", value: { stringValue: "/docs" } },
          ]),
        );
        expect(
          records[1]!.attributes.some(({ key }) => key === "organization.id"),
        ).toBe(false);
        expect(records[2]!.attributes).toEqual([]);
      });
    },
  );

  it.effect(
    "snapshots browser identity per event and replaces or resets it without rewriting queued events",
    () => {
      const { requests, fetch } = captureRequests();
      return Effect.gen(function* () {
        yield* BrowserOtlp.track("app.anonymous");
        yield* BrowserOtlp.identify({
          userId: "user-1",
          organizationId: "org-1",
        });
        yield* BrowserOtlp.page({ path: "/docs" });
        yield* BrowserOtlp.identify({ userId: "user-2" });
        expect(
          (yield* BrowserOtlp.identify({ userId: "" }).pipe(Effect.result))
            ._tag,
        ).toBe("Failure");
        yield* BrowserOtlp.track(
          "app.switched",
          { "user.id": "property-user" },
          { userId: "option-user" },
        );
        yield* BrowserOtlp.track("app.scoped").pipe(
          Effect.annotateLogs({ "user.id": "scoped-user" }),
        );
        yield* BrowserOtlp.reset;
        yield* BrowserOtlp.track("app.logged_out");
        yield* (yield* OtlpExporter.Flusher).flush;
        expect(requests).toHaveLength(1);
        const payload = yield* Schema.decodeUnknownEffect(LogsPayload)(
          requests[0]!.body,
        );
        const records = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords;
        expect(records).toHaveLength(5);
        expect(records[0]!.attributes).toEqual([]);
        expect(records[1]!.attributes).toEqual(
          expect.arrayContaining([
            { key: "user.id", value: { stringValue: "user-1" } },
            { key: "organization.id", value: { stringValue: "org-1" } },
          ]),
        );
        expect(records[2]!.attributes).toEqual([
          { key: "user.id", value: { stringValue: "user-2" } },
        ]);
        expect(records[3]!.attributes).toEqual([
          { key: "user.id", value: { stringValue: "scoped-user" } },
        ]);
        expect(records[4]!.attributes).toEqual([]);
      }).pipe(
        Effect.provide(
          BrowserOtlp.layer({
            serviceName: "events-test",
            events: {},
            traces: false,
          }),
        ),
        Effect.provideService(FetchHttpClient.Fetch, fetch),
      );
    },
  );

  it.effect("does not share browser identity between runtime scopes", () => {
    const { requests, fetch } = captureRequests();
    const layer = BrowserOtlp.layer({
      serviceName: "events-test",
      events: {},
      traces: false,
    });
    return Effect.gen(function* () {
      yield* BrowserOtlp.identify({ userId: "previous-user" }).pipe(
        Effect.provide(layer),
      );
      yield* Effect.gen(function* () {
        yield* BrowserOtlp.track("app.fresh_runtime");
        yield* (yield* OtlpExporter.Flusher).flush;
      }).pipe(Effect.provide(layer));
      const payload = yield* Schema.decodeUnknownEffect(LogsPayload)(
        requests[0]!.body,
      );
      expect(
        payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!.attributes,
      ).toEqual([]);
    }).pipe(Effect.provideService(FetchHttpClient.Fetch, fetch));
  });

  it.effect(
    "inherits scoped log annotations without allowing identity overrides or leaking between requests",
    () => {
      const { requests, fetch } = captureRequests();
      return Effect.gen(function* () {
        yield* Effect.all(
          [
            ServerOtlp.track(
              "app.request.first",
              {
                "user.id": "property-user",
                "organization.id": "property-org",
              },
              {
                userId: "option-user",
                context: { "organization.id": "context-org" },
              },
            ).pipe(
              Effect.annotateLogs({
                "user.id": "user-1",
                "organization.id": "org-1",
                "request.id": "request-1",
              }),
            ),
            ServerOtlp.track("app.request.second").pipe(
              Effect.annotateLogs({
                "user.id": "user-2",
                "organization.id": "org-2",
              }),
            ),
          ],
          { concurrency: "unbounded" },
        );
        yield* ServerOtlp.track("app.background");
        yield* (yield* OtlpExporter.Flusher).flush;
        const payload = yield* Schema.decodeUnknownEffect(LogsPayload)(
          requests[0]!.body,
        );
        const records = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords;
        expect(records).toHaveLength(3);
        expect(
          records.find((record) => record.eventName === "app.request.first")!
            .attributes,
        ).toEqual(
          expect.arrayContaining([
            { key: "organization.id", value: { stringValue: "org-1" } },
            { key: "user.id", value: { stringValue: "user-1" } },
            { key: "request.id", value: { stringValue: "request-1" } },
          ]),
        );
        expect(
          records.find((record) => record.eventName === "app.request.second")!
            .attributes,
        ).toEqual(
          expect.arrayContaining([
            { key: "user.id", value: { stringValue: "user-2" } },
            { key: "organization.id", value: { stringValue: "org-2" } },
          ]),
        );
        expect(
          records.find((record) => record.eventName === "app.background")!
            .attributes,
        ).toEqual([]);
      }).pipe(
        Effect.provide(ServerOtlp.layer),
        Effect.provideService(FetchHttpClient.Fetch, fetch),
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({
              OTEL_SERVICE_NAME: "events-test",
              OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
              OTEL_LOGS_EXPORTER: "otlp",
              OTEL_TRACES_EXPORTER: "none",
              OTEL_METRICS_EXPORTER: "none",
            }),
          ),
        ),
      );
    },
  );

  it.effect("flushes pending browser events with keepalive on pagehide", () =>
    Effect.gen(function* () {
      const sent = yield* Deferred.make<boolean | undefined>();
      const fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        Deferred.doneUnsafe(sent, Effect.succeed(init?.keepalive));
        return new Response(null, { status: 200 });
      };
      yield* Effect.gen(function* () {
        yield* BrowserOtlp.track("app.checkout.started");
        globalThis.dispatchEvent(new Event("pagehide"));
        expect(yield* Deferred.await(sent)).toBe(true);
      }).pipe(
        Effect.provide(
          BrowserOtlp.layer({
            serviceName: "events-test",
            events: {},
            traces: false,
          }),
        ),
        Effect.provideService(FetchHttpClient.Fetch, fetch),
      );
    }),
  );

  it.effect(
    "exports named browser events independently of logs, metrics, and traces",
    () => {
      const { requests, fetch } = captureRequests();
      return Effect.gen(function* () {
        yield* TestClock.adjust("1 second");
        yield* BrowserOtlp.track("app.checkout.started", {
          "checkout.items": 2,
          "checkout.guest": true,
          "checkout.tags": ["sale", "web"],
        });
        yield* BrowserOtlp.pageView({ path: "/docs?token=secret#private" });
        yield* (yield* OtlpExporter.Flusher).flush;
        expect(requests).toHaveLength(1);
        expect(requests[0]!.request.url).toBe(
          "http://localhost:3000/api/otel/v1/logs",
        );
        expect(requests[0]!.request.headers.has("traceparent")).toBe(false);
        const payload = yield* Schema.decodeUnknownEffect(LogsPayload)(
          requests[0]!.body,
        );
        const records = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords;
        expect(records).toHaveLength(2);
        expect(records[0]).toMatchObject({
          eventName: "app.checkout.started",
          severityNumber: 9,
          attributes: [
            { key: "checkout.items", value: { intValue: 2 } },
            { key: "checkout.guest", value: { boolValue: true } },
            {
              key: "checkout.tags",
              value: {
                arrayValue: {
                  values: [{ stringValue: "sale" }, { stringValue: "web" }],
                },
              },
            },
          ],
        });
        expect(records[0]!.timeUnixNano).toBe("1000000000");
        expect(records[0]!.observedTimeUnixNano).toBe(records[0]!.timeUnixNano);
        expect(records[0]!.body).toBeUndefined();
        expect(records[0]!.severityText).toBeUndefined();
        expect(records[0]!.traceId).toBeUndefined();
        expect(records[1]).toMatchObject({
          eventName: "browser.page_view",
          attributes: [{ key: "url.path", value: { stringValue: "/docs" } }],
        });
        expect(requests[0]!.body).not.toContain("secret");
      }).pipe(
        Effect.provide(
          BrowserOtlp.layer({
            serviceName: "events-test",
            events: {},
            traces: false,
          }),
        ),
        Effect.provideService(FetchHttpClient.Fetch, fetch),
      );
    },
  );

  it.effect("keeps browser event export opt-in", () => {
    const { requests, fetch } = captureRequests();
    return Effect.gen(function* () {
      yield* BrowserOtlp.track("app.checkout.started");
      yield* (yield* OtlpExporter.Flusher).flush;
      expect(requests).toHaveLength(0);
    }).pipe(
      Effect.provide(
        BrowserOtlp.layer({ serviceName: "events-test", traces: false }),
      ),
      Effect.provideService(FetchHttpClient.Fetch, fetch),
    );
  });

  it.effect(
    "maps per-call Segment-inspired options without leaking identity to later events",
    () => {
      const { requests, fetch } = captureRequests();
      return Effect.gen(function* () {
        yield* TestClock.adjust("1 second");
        yield* BrowserOtlp.track(
          "app.order.completed",
          { "app.plan": "pro", "user.id": "overridden" },
          {
            userId: "user-1",
            anonymousId: "anonymous-1",
            sessionId: "session-1",
            messageId: "message-1",
            timestamp: DateTime.makeUnsafe(500),
            context: { "app.plan": "free", "app.locale": "fr" },
          },
        );
        yield* BrowserOtlp.track("app.order.completed");
        yield* BrowserOtlp.page({
          name: "Docs",
          category: "Learning",
          path: "/docs?secret=1",
          properties: { "url.path": "/wrong" },
        });
        yield* (yield* OtlpExporter.Flusher).flush;
        const payload = yield* Schema.decodeUnknownEffect(LogsPayload)(
          requests[0]!.body,
        );
        const records = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords;
        expect(records[0]).toMatchObject({
          timeUnixNano: "500000000",
          observedTimeUnixNano: "1000000000",
        });
        expect(records[0]!.attributes).toEqual(
          expect.arrayContaining([
            { key: "user.id", value: { stringValue: "user-1" } },
            {
              key: "analytics.anonymous_id",
              value: { stringValue: "anonymous-1" },
            },
            { key: "session.id", value: { stringValue: "session-1" } },
            { key: "log.record.uid", value: { stringValue: "message-1" } },
            { key: "app.plan", value: { stringValue: "pro" } },
            { key: "app.locale", value: { stringValue: "fr" } },
          ]),
        );
        expect(records[1]!.attributes).toEqual([]);
        expect(records[2]!.attributes).toEqual(
          expect.arrayContaining([
            { key: "analytics.page.name", value: { stringValue: "Docs" } },
            {
              key: "analytics.page.category",
              value: { stringValue: "Learning" },
            },
            { key: "url.path", value: { stringValue: "/docs" } },
          ]),
        );
      }).pipe(
        Effect.provide(
          BrowserOtlp.layer({
            serviceName: "events-test",
            events: {},
            traces: false,
          }),
        ),
        Effect.provideService(FetchHttpClient.Fetch, fetch),
      );
    },
  );

  it.effect(
    "rejects invalid event names and non-finite attribute values",
    () => {
      return Effect.gen(function* () {
        expect((yield* BrowserOtlp.track("").pipe(Effect.result))._tag).toBe(
          "Failure",
        );
        expect(
          (yield* BrowserOtlp.track("app.event", { count: Infinity }).pipe(
            Effect.result,
          ))._tag,
        ).toBe("Failure");
      }).pipe(
        Effect.provide(
          BrowserOtlp.layer({ serviceName: "events-test", traces: false }),
        ),
      );
    },
  );

  for (const signalEndpoint of [false, true]) {
    it.effect(
      `exports server events without HTTP wiring (${signalEndpoint ? "signal" : "base"} endpoint)`,
      () => {
        const { requests, fetch } = captureRequests();
        return Effect.gen(function* () {
          const context = yield* Effect.gen(function* () {
            const span = yield* Effect.currentSpan;
            yield* ServerOtlp.track("app.order.completed", {
              "order.id": "order-1",
            });
            return { traceId: span.traceId, spanId: span.spanId };
          }).pipe(Effect.withSpan("order"));
          yield* (yield* OtlpExporter.Flusher).flush;
          expect(requests).toHaveLength(1);
          expect(requests[0]!.request.url).toBe(
            signalEndpoint
              ? "http://collector:4318/custom-logs"
              : "http://collector:4318/prefix/v1/logs",
          );
          expect(requests[0]!.request.headers.get("authorization")).toBe(
            "Bearer secret",
          );
          expect(requests[0]!.request.headers.has("traceparent")).toBe(false);
          const payload = yield* Schema.decodeUnknownEffect(LogsPayload)(
            requests[0]!.body,
          );
          expect(payload.resourceLogs[0]!.resource.attributes).toContainEqual({
            key: "service.name",
            value: { stringValue: "worker-test" },
          });
          expect(
            payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0],
          ).toMatchObject({
            eventName: "app.order.completed",
            ...context,
          });
        }).pipe(
          Effect.provide(ServerOtlp.layer),
          Effect.provideService(FetchHttpClient.Fetch, fetch),
          Effect.provide(
            ConfigProvider.layer(
              ConfigProvider.fromUnknown({
                OTEL_SERVICE_NAME: "worker-test",
                OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318/prefix/",
                OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: signalEndpoint
                  ? "http://collector:4318/custom-logs"
                  : undefined,
                OTEL_EXPORTER_OTLP_HEADERS: "authorization=Bearer%20secret",
                OTEL_LOGS_EXPORTER: "console, OTLP ",
                OTEL_TRACES_EXPORTER: "none",
                OTEL_METRICS_EXPORTER: "none",
              }),
            ),
          ),
        );
      },
    );
  }

  for (const config of [
    { OTEL_SDK_DISABLED: "true", OTEL_LOGS_EXPORTER: "otlp" },
    { OTEL_LOGS_EXPORTER: "none" },
  ]) {
    it.effect(
      `does not export disabled server events (${JSON.stringify(config)})`,
      () => {
        const { requests, fetch } = captureRequests();
        return Effect.gen(function* () {
          yield* ServerOtlp.track("app.order.completed");
          yield* (yield* OtlpExporter.Flusher).flush;
          expect(requests).toHaveLength(0);
        }).pipe(
          Effect.provide(ServerOtlp.layer),
          Effect.provideService(FetchHttpClient.Fetch, fetch),
          Effect.provide(
            ConfigProvider.layer(ConfigProvider.fromUnknown(config)),
          ),
        );
      },
    );
  }
});
