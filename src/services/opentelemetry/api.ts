import { Config, Effect, Layer } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpMiddleware,
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/unstable/http";
import { Otlp, OtlpSerialization } from "effect/unstable/observability";

const OpenTelemetryLive = Otlp.layerFromConfig().pipe(
  Layer.provide(OtlpSerialization.layerJson),
  Layer.provide(FetchHttpClient.layer),
);

type OtlpSignal = "traces" | "metrics" | "logs";

const otlpProxyPaths = [
  "/api/otel/v1/traces",
  "/api/otel/v1/metrics",
  "/api/otel/v1/logs",
] as const;

const proxyOtlp = (baseUrl: URL, signal: OtlpSignal) =>
  Effect.gen(function* () {
    const incoming = yield* HttpServerRequest.HttpServerRequest;
    const client = yield* HttpClient.HttpClient;
    const contentType = incoming.headers["content-type"] ?? "application/json";
    const body = new Uint8Array(yield* incoming.arrayBuffer);
    const request = HttpClientRequest.get(baseUrl).pipe(
      HttpClientRequest.appendUrl(`/v1/${signal}`),
      HttpClientRequest.setMethod("POST"),
      HttpClientRequest.bodyUint8Array(body, contentType),
    );
    const upstream = yield* client.execute(request);
    const responseBody = new Uint8Array(yield* upstream.arrayBuffer);

    return HttpServerResponse.uint8Array(responseBody, {
      status: upstream.status,
      contentType: upstream.headers["content-type"],
      headers: {
        "retry-after": upstream.headers["retry-after"],
      },
    });
  }).pipe(
    Effect.withTracerEnabled(false),
    HttpMiddleware.withLoggerDisabled,
    Effect.catch((error) =>
      Effect.logError("Failed to proxy browser telemetry", error).pipe(
        Effect.as(HttpServerResponse.empty({ status: 502 })),
      ),
    ),
    Effect.provide(FetchHttpClient.layer),
  );

const otlpProxyLayer = Layer.unwrap(
  Effect.map(
    Config.url("OTEL_COLLECTOR_PROXY_URL").pipe(
      Config.withDefault(new URL("http://localhost:4318")),
    ),
    (baseUrl) =>
      Layer.mergeAll(
        HttpRouter.add("POST", otlpProxyPaths[0], proxyOtlp(baseUrl, "traces")),
        HttpRouter.add(
          "POST",
          otlpProxyPaths[1],
          proxyOtlp(baseUrl, "metrics"),
        ),
        HttpRouter.add("POST", otlpProxyPaths[2], proxyOtlp(baseUrl, "logs")),
      ),
  ),
);

const serverServices = HttpServer.layerServices.pipe(
  Layer.provideMerge(HttpMiddleware.layerTracerDisabledForUrls(otlpProxyPaths)),
);

export class HttpApiOtlp {
  static readonly layer = Layer.mergeAll(
    OpenTelemetryLive,
    otlpProxyLayer,
    serverServices,
  );
}
