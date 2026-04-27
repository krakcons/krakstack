import { NodeSdk } from "@effect/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
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
    };
  }),
);

export class OpenTelemetry extends Context.Service<OpenTelemetry>()("@app/OpenTelemetry", {
  make: Effect.log("OpenTelemetry initialized"),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provideMerge(OtelLive));
}
