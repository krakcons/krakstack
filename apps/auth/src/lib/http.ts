import { Effect } from "effect";
import { HttpEffect, HttpServerResponse } from "effect/unstable/http";

import { corsMiddleware, type CorsOptions } from "@/lib/cors";

export const httpJson = (body: unknown, status = 200) =>
  HttpServerResponse.jsonUnsafe(body, { status });

const readStringField = async (request: Request, field: string) => {
  const body: unknown = await request.json();

  if (typeof body !== "object" || body === null || !(field in body)) {
    return null;
  }

  const value = Reflect.get(body, field);
  return typeof value === "string" ? value : null;
};

export const readStringFieldEffect = (request: Request, field: string) =>
  Effect.tryPromise({
    try: () => readStringField(request, field),
    catch: (error) => error,
  });

export const effectifyWebHandler =
  (handler: (request: Request) => Response | Promise<Response>) =>
  (request: Request) =>
    Effect.tryPromise({
      try: () => Promise.resolve(handler(request)),
      catch: (error) => error,
    }).pipe(Effect.map(HttpServerResponse.fromWeb));

const catchHttpFailure = <E>(
  effect: Effect.Effect<HttpServerResponse.HttpServerResponse, E>,
) =>
  Effect.catchCause(effect, (cause) =>
    Effect.sync(() => {
      console.error("[HTTP] handler failed:", cause);
      return httpJson({ error: "Internal server error" }, 500);
    }),
  );

export const runHttpResponse = <E>(
  request: Request,
  effect: Effect.Effect<HttpServerResponse.HttpServerResponse, E>,
  corsOptions?: CorsOptions,
) =>
  corsMiddleware(
    HttpEffect.toWebHandler(catchHttpFailure(effect)),
    corsOptions,
  )(request);
