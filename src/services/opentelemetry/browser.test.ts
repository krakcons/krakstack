// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { Deferred, Effect, Schema } from "effect";
import {
  FetchHttpClient,
  Headers,
  HttpClient,
  HttpTraceContext,
} from "effect/http";
import { OtlpExporter } from "effect/observability";
import { afterEach, vi } from "vitest";

import { BrowserOtlp } from "./browser";
import { Otlp } from "./index";

const EventPayload = Schema.fromJsonString(
  Schema.Struct({
    resourceLogs: Schema.Array(
      Schema.Struct({
        scopeLogs: Schema.Array(
          Schema.Struct({
            scope: Schema.Struct({ name: Schema.String }),
            logRecords: Schema.Array(
              Schema.Struct({
                eventName: Schema.String,
                severityNumber: Schema.Number,
                attributes: Schema.Array(
                  Schema.Struct({ key: Schema.String, value: Schema.Unknown }),
                ),
              }),
            ),
          }),
        ),
      }),
    ),
  }),
).annotate({ identifier: "BrowserEventPayload" });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BrowserOtlp", () => {
  it.effect(
    "formats generic OTLP events with the same stateless event API as the server",
    () => {
      const requests: Array<{ url: string; body: string }> = [];
      const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const request =
          input instanceof Request ? input : new Request(input, init);
        requests.push({ url: request.url, body: await request.text() });
        return new Response("{}");
      };
      const push = history.pushState;
      return Effect.gen(function* () {
        expect(BrowserOtlp.event).toBe(Otlp.event);
        yield* BrowserOtlp.event(
          "checkout.started",
          { items: 2 },
          { messageId: "event-1" },
        );
        yield* BrowserOtlp.event("checkout.next");
        expect(history.pushState).toBe(push);
        yield* (yield* OtlpExporter.Flusher).flush;
        expect(requests).toHaveLength(1);
        expect(requests[0]!.url).toBe("http://localhost:3000/api/otel/v1/logs");
        const payload = yield* Schema.decodeUnknownEffect(EventPayload)(
          requests[0]!.body,
        );
        const scope = payload.resourceLogs[0]!.scopeLogs[0]!;
        expect(scope.scope.name).toBe("krakstack.events");
        expect(scope.logRecords[0]).toEqual({
          eventName: "checkout.started",
          severityNumber: 9,
          attributes: [
            { key: "items", value: { intValue: 2 } },
            { key: "log.record.uid", value: { stringValue: "event-1" } },
          ],
        });
        expect(scope.logRecords[1]!.attributes).toEqual([]);
      }).pipe(
        Effect.provide(
          BrowserOtlp.layer({
            serviceName: "browser-events",
            events: {},
            traces: false,
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
    "supports explicit event export opt-out and validates event input",
    () => {
      let sent = 0;
      const fetch = async () => {
        sent++;
        return new Response("{}");
      };
      return Effect.gen(function* () {
        yield* BrowserOtlp.event("disabled");
        expect((yield* BrowserOtlp.event("").pipe(Effect.result))._tag).toBe(
          "Failure",
        );
        yield* (yield* OtlpExporter.Flusher).flush;
        expect(sent).toBe(0);
      }).pipe(
        Effect.provide(
          BrowserOtlp.layer({
            serviceName: "disabled-events",
            traces: false,
            events: false,
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
    "does not install analytics page tracking or export page events",
    () => {
      const push = history.pushState;
      const replace = history.replaceState;
      let sent = 0;
      const fetch = async () => {
        sent++;
        return new Response("{}");
      };
      return Effect.gen(function* () {
        expect(history.pushState).toBe(push);
        expect(history.replaceState).toBe(replace);
        yield* (yield* OtlpExporter.Flusher).flush;
        expect(sent).toBe(0);
      }).pipe(
        Effect.provide(
          BrowserOtlp.layer({ serviceName: "telemetry-only", traces: false }),
        ),
        Effect.provideService(
          FetchHttpClient.Fetch,
          Object.assign(fetch, { preconnect: globalThis.fetch.preconnect }),
        ),
      );
    },
  );
  it.effect("removes lifecycle listeners when the layer is disposed", () => {
    const addDocument = vi.spyOn(document, "addEventListener");
    const removeDocument = vi.spyOn(document, "removeEventListener");
    const addWindow = vi.spyOn(globalThis, "addEventListener");
    const removeWindow = vi.spyOn(globalThis, "removeEventListener");

    return Effect.gen(function* () {
      yield* Effect.void.pipe(
        Effect.provide(BrowserOtlp.layer({ serviceName: "browser-test" })),
      );
      const visibilityListener = addDocument.mock.calls.find(
        ([name]) => name === "visibilitychange",
      )?.[1];
      const pageHideListener = addWindow.mock.calls.find(
        ([name]) => name === "pagehide",
      )?.[1];
      expect(visibilityListener).toBeDefined();
      expect(pageHideListener).toBeDefined();
      expect(removeDocument).toHaveBeenCalledWith(
        "visibilitychange",
        visibilityListener,
      );
      expect(removeWindow).toHaveBeenCalledWith("pagehide", pageHideListener);
    });
  });

  it.effect(
    "propagates request trace context without tracing telemetry exports",
    () => {
      const requests: Array<Request> = [];
      const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const request =
          input instanceof Request ? input : new Request(input, init);
        requests.push(request);
        return new Response(null, { status: 200 });
      };

      return Effect.gen(function* () {
        const traceId = yield* Effect.gen(function* () {
          const span = yield* Effect.currentSpan;
          const client = yield* HttpClient.HttpClient;
          yield* client.get("http://localhost:3000/api/example");
          return span.traceId;
        }).pipe(
          Effect.withSpan("browser.request"),
          Effect.provide(FetchHttpClient.layer),
        );
        const flusher = yield* OtlpExporter.Flusher;
        yield* flusher.flush;

        const apiRequest = requests.find((request) =>
          request.url.endsWith("/api/example"),
        );
        expect(apiRequest).toBeDefined();
        const parent = HttpTraceContext.fromHeaders(
          Headers.fromInput(apiRequest!.headers),
        );
        expect(parent).toMatchObject({ _tag: "Some", value: { traceId } });
        const exportRequest = requests.find((request) =>
          request.url.endsWith("/v1/traces"),
        );
        expect(exportRequest).toBeDefined();
        expect(exportRequest!.headers.has("traceparent")).toBe(false);
      }).pipe(
        Effect.provide(BrowserOtlp.layer({ serviceName: "browser-test" })),
        Effect.provideService(FetchHttpClient.Fetch, fetch),
      );
    },
  );

  for (const eventName of ["pagehide", "visibilitychange"]) {
    it.effect(`flushes pending traces on ${eventName} with keepalive`, () =>
      Effect.gen(function* () {
        const sent = yield* Deferred.make<{
          url: string;
          keepalive: boolean | undefined;
        }>();
        const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const request =
            input instanceof Request ? input : new Request(input, init);
          Deferred.doneUnsafe(
            sent,
            Effect.succeed({ url: request.url, keepalive: init?.keepalive }),
          );
          return new Response(null, { status: 200 });
        };

        yield* Effect.gen(function* () {
          yield* Effect.void.pipe(Effect.withSpan("pending-request"));
          if (eventName === "visibilitychange") {
            vi.spyOn(document, "visibilityState", "get").mockReturnValue(
              "hidden",
            );
            document.dispatchEvent(new Event(eventName));
          } else {
            globalThis.dispatchEvent(new Event(eventName));
          }
          const result = yield* Deferred.await(sent);
          expect(result).toEqual({
            url: "http://localhost:3000/api/otel/v1/traces",
            keepalive: true,
          });
        }).pipe(
          Effect.provide(BrowserOtlp.layer({ serviceName: "browser-test" })),
          Effect.provideService(FetchHttpClient.Fetch, fetch),
        );
      }),
    );
  }

  it.effect(
    "exports failed spans without enabling browser logs or metrics",
    () => {
      const requests: Array<{ readonly body: string; readonly url: string }> =
        [];
      const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const request =
          input instanceof Request ? input : new Request(input, init);
        requests.push({ body: await request.text(), url: request.url });
        return new Response(null, { status: 200 });
      };

      return Effect.gen(function* () {
        yield* Effect.fail(new Error("Browser failure")).pipe(
          Effect.withSpan("browser.exception", { root: true, sampled: true }),
          Effect.ignoreCause,
        );

        const flusher = yield* OtlpExporter.Flusher;
        yield* flusher.flush;

        expect(requests).toHaveLength(1);
        expect(requests[0]?.url).toBe(
          "http://localhost:3000/api/otel/v1/traces",
        );
        expect(requests[0]?.body).toContain("browser.exception");
        expect(requests[0]?.body).toContain("Browser failure");
      }).pipe(
        Effect.provide(BrowserOtlp.layer({ serviceName: "browser-test" })),
        Effect.provideService(FetchHttpClient.Fetch, fetch),
        Effect.scoped,
      );
    },
  );
});
