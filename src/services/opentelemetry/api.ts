import { Config, Effect, Layer, Option, Schema, Stream } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpMiddleware,
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/http";
import { ServerOtlp } from "./server";
import { OtlpLogsProcessor, OtlpProcessingError } from "./processor";

export { OtlpLogsProcessor, OtlpProcessingError } from "./processor";

type OtlpSignal = "traces" | "metrics" | "logs";
type OtlpSignalConfig = Uppercase<OtlpSignal>;

const otlpProxyPaths = [
  "/api/otel/v1/traces",
  "/api/otel/v1/metrics",
  "/api/otel/v1/logs",
] as const;

const exporterConfig = (signal: OtlpSignalConfig) =>
  Config.Array(Schema.String, `OTEL_${signal}_EXPORTER`).pipe(
    Config.map((exporters) =>
      exporters.map((exporter) => exporter.toLowerCase().trim()),
    ),
    Config.withDefault<ReadonlyArray<string>>([]),
  );

interface OtlpBodyBuffer {
  chunks: Array<Uint8Array>;
  size: number;
}

const readProcessorBody = Effect.fnUntraced(function* () {
  const incoming = yield* HttpServerRequest.HttpServerRequest;
  const collected = yield* incoming.stream.pipe(
    Stream.mapError(() => new OtlpProcessingError({ status: 400 })),
    Stream.runFoldEffect(
      (): OtlpBodyBuffer => ({
        chunks: [],
        size: 0,
      }),
      (state, chunk) => {
        const size = state.size + chunk.byteLength;
        if (size > 64 * 1024)
          return Effect.fail(new OtlpProcessingError({ status: 413 }));
        state.chunks.push(chunk);
        state.size = size;
        return Effect.succeed(state);
      },
    ),
  );
  const bytes = new Uint8Array(collected.size);
  let offset = 0;
  for (const chunk of collected.chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
});

const proxyOtlp = (
  baseUrl: URL,
  signal: OtlpSignal,
  processor: Option.Option<OtlpLogsProcessor["Service"]>,
) =>
  Effect.gen(function* () {
    const incoming = yield* HttpServerRequest.HttpServerRequest;
    const client = yield* HttpClient.HttpClient;
    const contentType = incoming.headers["content-type"] ?? "application/json";
    const processLogs = signal === "logs" && Option.isSome(processor);
    if (
      processLogs &&
      contentType.split(";", 1)[0]?.trim().toLowerCase() !== "application/json"
    ) {
      return HttpServerResponse.empty({ status: 415 });
    }
    const bytes = processLogs
      ? yield* readProcessorBody()
      : new Uint8Array(yield* incoming.arrayBuffer);
    const processed = processLogs
      ? yield* processor.value.process(bytes)
      : { body: bytes, persisted: false };
    const request = HttpClientRequest.get(baseUrl).pipe(
      HttpClientRequest.appendUrl(`/v1/${signal}`),
      HttpClientRequest.setMethod("POST"),
      HttpClientRequest.bodyUint8Array(processed.body, contentType),
    );
    const forward = Effect.gen(function* () {
      const upstream = yield* client.execute(request);
      const responseBody = new Uint8Array(yield* upstream.arrayBuffer);

      if (processed.persisted) {
        if (upstream.status < 200 || upstream.status >= 300)
          yield* Effect.logWarning("Collector rejected persisted analytics", {
            status: upstream.status,
          });
        return HttpServerResponse.jsonUnsafe({});
      }
      return HttpServerResponse.uint8Array(responseBody, {
        status: upstream.status,
        contentType: upstream.headers["content-type"],
        headers: {
          "retry-after": upstream.headers["retry-after"],
        },
      });
    });
    if (!processed.persisted) return yield* forward;
    return yield* forward.pipe(
      Effect.timeout("5 seconds"),
      Effect.catch((error) =>
        Effect.logWarning(
          "Collector delivery failed after analytics commit",
          error,
        ).pipe(Effect.as(HttpServerResponse.jsonUnsafe({}))),
      ),
    );
  }).pipe(
    Effect.withTracerEnabled(false),
    HttpMiddleware.withLoggerDisabled,
    Effect.catchTag("OtlpProcessingError", (error) =>
      Effect.succeed(HttpServerResponse.empty({ status: error.status })),
    ),
    Effect.catch((error) =>
      Effect.logError("Failed to proxy browser telemetry", error).pipe(
        Effect.as(HttpServerResponse.empty({ status: 502 })),
      ),
    ),
    Effect.provide(FetchHttpClient.layer),
  );

const otlpProxyLayer = Layer.unwrap(
  Effect.gen(function* () {
    const baseUrl = yield* Config.URL("OTEL_EXPORTER_OTLP_ENDPOINT");
    const processor = yield* Effect.serviceOption(OtlpLogsProcessor);
    const exporters = yield* Config.all({
      logs: exporterConfig("LOGS"),
      metrics: exporterConfig("METRICS"),
      traces: exporterConfig("TRACES"),
    });

    return Layer.mergeAll(
      exporters.traces.includes("otlp")
        ? HttpRouter.add(
            "POST",
            otlpProxyPaths[0],
            proxyOtlp(baseUrl, "traces", processor),
          )
        : Layer.empty,
      exporters.metrics.includes("otlp")
        ? HttpRouter.add(
            "POST",
            otlpProxyPaths[1],
            proxyOtlp(baseUrl, "metrics", processor),
          )
        : Layer.empty,
      exporters.logs.includes("otlp")
        ? HttpRouter.add(
            "POST",
            otlpProxyPaths[2],
            proxyOtlp(baseUrl, "logs", processor),
          )
        : Layer.empty,
    );
  }),
);

const serverServices = HttpServer.layerServices.pipe(
  Layer.provideMerge(HttpMiddleware.layerTracerDisabledForUrls(otlpProxyPaths)),
);

export class HttpApiOtlp {
  static readonly layer = Layer.mergeAll(
    ServerOtlp.layer,
    otlpProxyLayer,
    serverServices,
  );
}
