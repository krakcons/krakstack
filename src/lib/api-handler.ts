import { Config, Effect, Layer, Option } from "effect";
import { HttpRouter, HttpServer } from "effect/http";
import { HttpApiOtlp } from "@krak-stack/registry/opentelemetry/api";
import { Otlp } from "@krak-stack/registry/opentelemetry";
import { Events } from "@krak-stack/registry/events";
import { BrowserCrypto } from "@effect/platform-browser";
import { HttpApiScalar } from "effect/http-api";
import { HealthService } from "@krak-stack/registry/service-health";

import { Api } from "@/api";
import { apiLayer } from "@/lib/api-builder";

const docsLayer = HttpApiScalar.layer(Api, { path: "/api/docs" });
const telemetryLayer = Layer.unwrap(
  Config.option(Config.URL("OTEL_EXPORTER_OTLP_ENDPOINT")).pipe(
    Effect.map((endpoint) =>
      Option.isSome(endpoint)
        ? HttpApiOtlp.layer.pipe(
            Layer.provide(Events.ingestionLayer),
            Layer.provideMerge(
              Events.layerWith({
                geolocation: "cloudflare",
                requireConsent: true,
              }).pipe(
                Layer.provide(BrowserCrypto.layer),
                Layer.provideMerge(Otlp.layer),
              ),
            ),
          )
        : Layer.merge(Otlp.layer, HttpServer.layerServices),
    ),
  ),
);
export const appLayer = Layer.merge(apiLayer, docsLayer).pipe(
  Layer.provideMerge(HealthService.layer),
  Layer.provideMerge(telemetryLayer),
);

const webHandler = HttpRouter.toWebHandler(appLayer);

export const handler = webHandler.handler;
export const dispose = webHandler.dispose;
