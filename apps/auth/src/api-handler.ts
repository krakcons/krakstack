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

const scalarDocsConfig = {
  theme: "default",
  sources: [
    {
      title: "KrakStack API",
      slug: "krakstack-api",
      url: "/api/openapi.json",
    },
    {
      title: "Better Auth",
      slug: "better-auth",
      url: "/api/auth/open-api/generate-schema",
    },
  ],
};

const docsHtml = `<!doctype html>
<html>
  <head>
    <title>KrakStack Auth API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference('#app', ${JSON.stringify(scalarDocsConfig)})
    </script>
  </body>
</html>`;

const docsLayer = HttpRouter.add(
  "GET",
  "/api/docs",
  Effect.succeed(HttpServerResponse.html(docsHtml)),
);

const apiLayer = Layer.mergeAll(
  HttpApiBuilder.layer(Api, {
    openapiPath: "/api/openapi.json",
  }).pipe(Layer.provide(apiHandlersLayer)),
  docsLayer,
  authRoutesLayer,
).pipe(Layer.provide(platformLayer));

const apiWebHandler = HttpEffect.toWebHandlerLayerWith(Layer.empty, {
  toHandler: () => HttpRouter.toHttpEffect(apiLayer).pipe(Effect.scoped),
  middleware: effectCorsMiddleware,
});

export const apiHandler = apiWebHandler.handler;
export const disposeApiHandler = apiWebHandler.dispose;
