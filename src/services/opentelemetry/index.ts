import { Config, Context, Effect, Layer, Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import {
  Otlp as EffectOtlp,
  OtlpExporter,
  OtlpResource,
  OtlpSerialization,
} from "effect/observability";

import { OtlpEvents, event } from "./events";

export type { EventAttributes, EventOptions } from "./schema";

const ServerEventsLive = Layer.unwrap(
  Effect.gen(function* () {
    const disabled = yield* Config.Boolean("OTEL_SDK_DISABLED").pipe(
      Config.withDefault(false),
    );
    const exporters = yield* Config.Array(
      Schema.String,
      "OTEL_LOGS_EXPORTER",
    ).pipe(Config.withDefault<ReadonlyArray<string>>([]));
    if (
      disabled ||
      !exporters.some((value) => value.trim().toLowerCase() === "otlp")
    ) {
      return OtlpEvents.disabledLayer;
    }
    const endpoint = yield* Config.URL("OTEL_EXPORTER_OTLP_LOGS_ENDPOINT").pipe(
      Config.orElse(() =>
        Config.URL("OTEL_EXPORTER_OTLP_ENDPOINT").pipe(
          Config.map((url) => {
            url.pathname += `${url.pathname.endsWith("/") ? "" : "/"}v1/logs`;
            return url;
          }),
        ),
      ),
      Config.withDefault(undefined),
    );
    if (!endpoint) {
      return OtlpEvents.disabledLayer;
    }
    const headersConfig = (name: string) =>
      Config.Record(Schema.String, Schema.StringFromUriComponent, name);
    const headers = yield* headersConfig(
      "OTEL_EXPORTER_OTLP_LOGS_HEADERS",
    ).pipe(
      Config.orElse(() => headersConfig("OTEL_EXPORTER_OTLP_HEADERS")),
      Config.withDefault(undefined),
    );
    return OtlpEvents.layer({
      url: endpoint.toString(),
      headers,
      exportInterval: "1 second",
      maxBatchSize: 1000,
      shutdownTimeout: "3 seconds",
    });
  }).pipe(Effect.orDie),
);

/** Runtime-neutral server telemetry for HTTP applications, workers, and CLIs. */
export class Otlp extends Context.Service<
  Otlp,
  {
    readonly resource: Effect.Effect<OtlpResource.Resource>;
  }
>()("krakstack/opentelemetry/Otlp") {
  static readonly event = event;

  static readonly layer = Layer.mergeAll(
    Layer.succeed(this, { resource: OtlpResource.fromConfig() }),
    EffectOtlp.layerFromConfig(),
    ServerEventsLive,
  ).pipe(
    Layer.provideMerge(OtlpExporter.layerFlusher),
    Layer.provide(OtlpSerialization.layerJson),
    Layer.provide(FetchHttpClient.layer),
  );
}
