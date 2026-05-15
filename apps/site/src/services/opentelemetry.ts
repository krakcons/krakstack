import { FetchHttpClient } from "effect/unstable/http";
import { Otlp, OtlpSerialization } from "effect/unstable/observability";
import { Config, Effect, Layer, Context } from "effect";

const OtelLive = Layer.unwrap(
  Effect.gen(function* () {
    const serviceName = yield* Config.string("OTEL_SERVICE_NAME").pipe(
      Config.withDefault("app"),
    );
    const otlpEndpoint = yield* Config.string(
      "OTEL_EXPORTER_OTLP_ENDPOINT",
    ).pipe(Config.withDefault("http://localhost:4318"));

    return Otlp.layer({
      baseUrl: otlpEndpoint,
      resource: {
        serviceName,
      },
    }).pipe(
      Layer.provide(OtlpSerialization.layerJson),
      Layer.provide(FetchHttpClient.layer),
    );
  }),
);

export class OpenTelemetry extends Context.Service<OpenTelemetry>()(
  "OpenTelemetry",
  {
    make: Effect.log("OpenTelemetry initialized"),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provideMerge(OtelLive),
  );
}
