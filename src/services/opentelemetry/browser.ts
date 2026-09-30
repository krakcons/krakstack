import { Effect, FiberSet, Layer, Predicate, Schema, Stream } from "effect";
import { FetchHttpClient, HttpClientRequest } from "effect/unstable/http";
import {
  type Otlp,
  OtlpExporter,
  OtlpLogger,
  OtlpMetrics,
  OtlpSerialization,
  OtlpTracer,
} from "effect/unstable/observability";

class BrowserReportedError extends Schema.TaggedError<BrowserReportedError>()(
  "BrowserReportedError",
  {
    type: Schema.Literals(["window.error", "unhandledrejection"]),
    message: Schema.String,
    stack: Schema.optional(Schema.String),
  },
) {}

const reportBrowserException = (exception: BrowserReportedError) =>
  Effect.fail(exception).pipe(
    Effect.withSpan("browser.exception", {
      root: true,
      sampled: true,
      attributes: {
        "exception.type": exception.type,
        "exception.message": exception.message,
        "exception.stacktrace": exception.stack ?? "",
      },
    }),
    Effect.ignoreCause,
  );

const BrowserExceptionTrackingLive = Layer.effectDiscard(
  Stream.merge(
    Stream.fromEventListener<ErrorEvent>(globalThis, "error", {
      bufferSize: 100,
    }).pipe(
      Stream.map((event) => {
        const error: unknown = event.error;
        return new BrowserReportedError({
          type: "window.error",
          message: event.message,
          stack: Predicate.isError(error) ? error.stack : undefined,
        });
      }),
    ),
    Stream.fromEventListener<PromiseRejectionEvent>(
      globalThis,
      "unhandledrejection",
      { bufferSize: 100 },
    ).pipe(
      Stream.map((event) => {
        const reason: unknown = event.reason;
        return new BrowserReportedError(
          Predicate.isError(reason)
            ? {
                type: "unhandledrejection",
                message: reason.message,
                stack: reason.stack,
              }
            : {
                type: "unhandledrejection",
                message: "Unhandled promise rejection",
              },
        );
      }),
    ),
  ).pipe(Stream.runForEach(reportBrowserException), Effect.forkScoped),
);

const BrowserLifecycleFlushingLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const flusher = yield* OtlpExporter.Flusher;
    const fibers = yield* FiberSet.make();
    const run = yield* FiberSet.runtime(fibers)();
    const flush = () => {
      run(
        flusher.flush.pipe(
          Effect.provideService(FetchHttpClient.RequestInit, {
            keepalive: true,
          }),
        ),
      );
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    yield* Effect.acquireRelease(
      Effect.sync(() => {
        document.addEventListener("visibilitychange", onVisibilityChange);
        globalThis.addEventListener("pagehide", flush);
      }),
      () =>
        Effect.sync(() => {
          document.removeEventListener("visibilitychange", onVisibilityChange);
          globalThis.removeEventListener("pagehide", flush);
        }),
    );
  }),
);

type OtlpOptions = Parameters<typeof Otlp.layerJson>[0];

type SignalOptions<Options> = Omit<Options, "url" | "resource" | "headers">;

export interface BrowserOtlpOptions {
  readonly serviceName: string;
  readonly serviceVersion?: string;
  readonly attributes?: NonNullable<OtlpOptions["resource"]>["attributes"];
  readonly baseUrl?: string;
  readonly headers?: OtlpOptions["headers"];
  readonly traces?:
    | false
    | SignalOptions<Parameters<typeof OtlpTracer.layer>[0]>;
  readonly metrics?:
    | false
    | SignalOptions<Parameters<typeof OtlpMetrics.layer>[0]>;
  readonly logs?: false | SignalOptions<Parameters<typeof OtlpLogger.layer>[0]>;
}

export class BrowserOtlp {
  static readonly layer = ({
    attributes,
    baseUrl = "/api/otel",
    logs = false,
    metrics = false,
    serviceName,
    serviceVersion,
    traces = {},
    headers,
  }: BrowserOtlpOptions) => {
    const resource = { attributes, serviceName, serviceVersion };
    const request = HttpClientRequest.get(baseUrl);
    const signalUrl = (signal: "logs" | "metrics" | "traces") =>
      HttpClientRequest.appendUrl(request, `/v1/${signal}`).url;
    const exporters = Layer.mergeAll(
      OtlpExporter.layerFlusher,
      traces !== false
        ? OtlpTracer.layer({
            exportInterval: "30 seconds",
            ...traces,
            url: signalUrl("traces"),
            resource,
            headers,
          })
        : Layer.empty,
      metrics !== false
        ? OtlpMetrics.layer({
            exportInterval: "60 seconds",
            ...metrics,
            url: signalUrl("metrics"),
            resource,
            headers,
          })
        : Layer.empty,
      logs !== false
        ? OtlpLogger.layer({
            excludeLogSpans: true,
            mergeWithExisting: true,
            ...logs,
            url: signalUrl("logs"),
            resource,
            headers,
          })
        : Layer.empty,
    ).pipe(
      Layer.provide(OtlpSerialization.layerJson),
      Layer.provide(FetchHttpClient.layer),
    );

    return Layer.mergeAll(
      BrowserLifecycleFlushingLive,
      traces !== false ? BrowserExceptionTrackingLive : Layer.empty,
    ).pipe(Layer.provideMerge(exporters));
  };
}
