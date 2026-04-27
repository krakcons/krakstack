import { NodeSdk } from "@effect/opentelemetry";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Config, Context, Effect, Layer } from "effect";

const OtelLive = NodeSdk.layer(
  Effect.gen(function* () {
    const serviceName = yield* Config.string("OTEL_SERVICE_NAME").pipe(Config.withDefault("app"));
    const otlpEndpoint = yield* Config.string("OTEL_EXPORTER_OTLP_ENDPOINT").pipe(
      Config.withDefault("http://localhost:4318"),
    );

    return {
      resource: { serviceName },
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }),
      ),
      logRecordProcessor: new BatchLogRecordProcessor(
        new OTLPLogExporter({ url: `${otlpEndpoint}/v1/logs` }),
      ),
      metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ url: `${otlpEndpoint}/v1/metrics` }),
        exportIntervalMillis: 10000,
      }),
    };
  }),
);

export class OpenTelemetry extends Context.Service<OpenTelemetry>()("@app/OpenTelemetry", {
  make: Effect.log("OpenTelemetry initialized"),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provideMerge(OtelLive));
}
