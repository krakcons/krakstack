// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { Deferred, Effect } from "effect";
import {
  FetchHttpClient,
  Headers,
  HttpClient,
  HttpTraceContext,
} from "effect/http";
import { OtlpExporter } from "effect/observability";
import { afterEach, vi } from "vitest";

import { BrowserOtlp } from "./browser";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BrowserOtlp", () => {
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
