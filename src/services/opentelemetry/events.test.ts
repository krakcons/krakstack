import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, DateTime, Effect, Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { OtlpExporter } from "effect/observability";

import { Otlp } from "./index";

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
                traceId: Schema.optional(Schema.String),
                spanId: Schema.optional(Schema.String),
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
).annotate({ identifier: "TestEventLogsPayload" });

const setup = (config: Record<string, string | undefined> = {}) => {
  const requests: Array<{ request: Request; body: string }> = [];
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push({ request, body: await request.text() });
    return new Response(null, { status: 200 });
  };
  const provide = <A, E, R>(program: Effect.Effect<A, E, R>) =>
    program.pipe(
      Effect.provide(Otlp.layer),
      Effect.provideService(FetchHttpClient.Fetch, fetch),
      Effect.provide(
        ConfigProvider.layer(
          ConfigProvider.fromUnknown({
            OTEL_SERVICE_NAME: "worker-test",
            OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318/prefix/",
            OTEL_EXPORTER_OTLP_HEADERS: "authorization=Bearer%20secret",
            OTEL_LOGS_EXPORTER: "otlp",
            OTEL_TRACES_EXPORTER: "none",
            OTEL_METRICS_EXPORTER: "none",
            ...config,
          }),
        ),
      ),
    );
  return { requests, provide };
};

describe("OTLP server events", () => {
  for (const signalEndpoint of [false, true]) {
    it.effect(
      `exports events without HTTP wiring (${signalEndpoint ? "signal" : "base"} endpoint)`,
      () => {
        const { requests, provide } = setup({
          OTEL_LOGS_EXPORTER: "console, OTLP ",
          OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: signalEndpoint
            ? "http://collector:4318/custom-logs"
            : undefined,
        });
        return Effect.gen(function* () {
          const context = yield* Effect.gen(function* () {
            const span = yield* Effect.currentSpan;
            yield* Otlp.event("app.order.completed", {
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
          ).toMatchObject({ eventName: "app.order.completed", ...context });
        }).pipe(provide);
      },
    );
  }

  it.effect(
    "inherits scoped identity without allowing overrides or leaking between requests",
    () => {
      const { requests, provide } = setup();
      return Effect.gen(function* () {
        yield* Effect.all(
          [
            Otlp.event(
              "first",
              { "user.id": "property-user", "organization.id": "property-org" },
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
            Otlp.event("second").pipe(
              Effect.annotateLogs({
                "user.id": "user-2",
                "organization.id": "org-2",
              }),
            ),
          ],
          { concurrency: "unbounded" },
        );
        yield* Otlp.event("background");
        yield* (yield* OtlpExporter.Flusher).flush;
        const payload = yield* Schema.decodeUnknownEffect(LogsPayload)(
          requests[0]!.body,
        );
        const records = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords;
        expect(records).toHaveLength(3);
        expect(
          records.find((record) => record.eventName === "first")!.attributes,
        ).toEqual(
          expect.arrayContaining([
            { key: "user.id", value: { stringValue: "user-1" } },
            { key: "organization.id", value: { stringValue: "org-1" } },
            { key: "request.id", value: { stringValue: "request-1" } },
          ]),
        );
        expect(
          records.find((record) => record.eventName === "second")!.attributes,
        ).toEqual(
          expect.arrayContaining([
            { key: "user.id", value: { stringValue: "user-2" } },
            { key: "organization.id", value: { stringValue: "org-2" } },
          ]),
        );
        expect(
          records.find((record) => record.eventName === "background")!
            .attributes,
        ).toEqual([]);
      }).pipe(provide);
    },
  );

  it.effect("maps per-call options without persisting identity", () => {
    const { requests, provide } = setup();
    return Effect.gen(function* () {
      yield* Otlp.event(
        "order",
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
      yield* Otlp.event("next");
      yield* (yield* OtlpExporter.Flusher).flush;
      const payload = yield* Schema.decodeUnknownEffect(LogsPayload)(
        requests[0]!.body,
      );
      const records = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords;
      expect(records[0]!.timeUnixNano).toBe("500000000");
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
    }).pipe(provide);
  });

  it.effect("rejects invalid names and non-finite values", () => {
    const { provide } = setup();
    return Effect.gen(function* () {
      expect((yield* Otlp.event("").pipe(Effect.result))._tag).toBe("Failure");
      expect(
        (yield* Otlp.event("event", { count: Infinity }).pipe(Effect.result))
          ._tag,
      ).toBe("Failure");
    }).pipe(provide);
  });

  for (const config of [
    { OTEL_SDK_DISABLED: "true", OTEL_LOGS_EXPORTER: "otlp" },
    { OTEL_LOGS_EXPORTER: "none" },
  ]) {
    it.effect(
      `does not export disabled events (${JSON.stringify(config)})`,
      () => {
        const { requests, provide } = setup(config);
        return Effect.gen(function* () {
          yield* Otlp.event("order");
          yield* (yield* OtlpExporter.Flusher).flush;
          expect(requests).toHaveLength(0);
        }).pipe(provide);
      },
    );
  }
});
