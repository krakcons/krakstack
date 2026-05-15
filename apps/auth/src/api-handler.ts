import { Effect, FileSystem, Layer, Path } from "effect";
import {
  Etag,
  HttpEffect,
  HttpPlatform,
  HttpRouter,
  HttpServerResponse,
} from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { effectCorsMiddleware } from "@/lib/http";
import { adminApiHandler } from "@/services/admin/api.builder";
import { authApiHandler } from "@/services/auth/api.builder";
import { auth } from "@/services/auth/config";

const fileSystemLayer = FileSystem.layerNoop({});
const httpPlatformLayer = HttpPlatform.layer.pipe(
  Layer.provide(fileSystemLayer),
);

const platformLayer = Layer.mergeAll(
  Path.layer,
  fileSystemLayer,
  Etag.layerWeak,
  httpPlatformLayer,
);

const authHandlerEffect = HttpEffect.fromWebHandler((request) =>
  Promise.resolve(auth.handler(request)),
).pipe(
  Effect.catch((error) =>
    Effect.sync(() => {
      console.error("[HTTP] auth handler failed:", error);
      return HttpServerResponse.jsonUnsafe(
        { error: "Internal server error" },
        { status: 500 },
      );
    }),
  ),
);

const authRoutesLayer = HttpRouter.add("*", "/api/auth/*", authHandlerEffect);

const apiHandlersLayer = Layer.mergeAll(authApiHandler, adminApiHandler);

const apiLayer = Layer.mergeAll(
  HttpApiBuilder.layer(Api, {
    openapiPath: "/api/openapi.json",
  }).pipe(Layer.provide(apiHandlersLayer)),
  authRoutesLayer,
).pipe(Layer.provide(platformLayer));

const apiWebHandler = HttpEffect.toWebHandlerLayerWith(Layer.empty, {
  toHandler: () => HttpRouter.toHttpEffect(apiLayer).pipe(Effect.scoped),
  middleware: effectCorsMiddleware,
});

export const apiHandler = apiWebHandler.handler;
export const disposeApiHandler = apiWebHandler.dispose;
