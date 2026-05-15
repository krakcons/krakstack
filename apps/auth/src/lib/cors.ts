import { createMiddleware } from "@tanstack/react-start";
import { trustedOrigins } from "@/lib/trusted-origins";

const isDev = process.env.NODE_ENV === "development";

function buildCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowedOrigin =
    origin && trustedOrigins.includes(origin) ? origin : null;

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      request.headers.get("access-control-request-headers") ??
      "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin, Access-Control-Request-Headers",
  };

  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }

  return headers;
}

function applyCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(buildCorsHeaders(request))) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Adds CORS headers to every response and catches errors,
 * returning a CORS-wrapped 500 instead of leaking stack traces.
 *
 * OPTIONS preflights are short-circuited here so individual
 * handlers don't need to implement them.
 */
export const corsMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, request }) => {
    if (request.method === "OPTIONS") {
      if (isDev) {
        console.log("[CORS] OPTIONS", request.url);
        console.log("[CORS] Origin:", request.headers.get("origin"));
        console.log(
          "[CORS] ACRH:",
          request.headers.get("access-control-request-headers"),
        );
      }
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(request),
      });
    }

    try {
      const result = await next();
      return applyCors(result.response, request);
    } catch (error) {
      if (isDev) {
        console.error("[Auth] error:", error);
      }
      return applyCors(
        new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
        request,
      );
    }
  },
);
