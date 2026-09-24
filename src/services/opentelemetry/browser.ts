import { Effect, Layer, Predicate, Schema, Stream } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { Otlp } from "effect/unstable/observability";

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

export class BrowserOtlp {
  static readonly layer = ({
    attributes,
    baseUrl = "/api/otel",
    serviceName,
    serviceVersion,
    ...options
  }: Omit<Parameters<typeof Otlp.layerJson>[0], "baseUrl" | "resource"> & {
    readonly serviceName: string;
    readonly serviceVersion?: string;
    readonly attributes?: NonNullable<
      Parameters<typeof Otlp.layerJson>[0]["resource"]
    >["attributes"];
    readonly baseUrl?: string;
  }) =>
    BrowserExceptionTrackingLive.pipe(
      Layer.provideMerge(
        Otlp.layerJson({
          tracerExportInterval: "5 seconds",
          metricsExportInterval: "30 seconds",
          loggerExcludeLogSpans: true,
          loggerMergeWithExisting: true,
          ...options,
          baseUrl,
          resource: { attributes, serviceName, serviceVersion },
        }).pipe(Layer.provide(FetchHttpClient.layer)),
      ),
    );
}
