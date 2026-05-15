import { auth } from "@/services/auth/config";
import { trustedOrigins } from "@/lib/trusted-origins";
import { createFileRoute } from "@tanstack/react-router";

const isDev = process.env.NODE_ENV === "development";

function corsHeaders(request: Request): Record<string, string> {
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

function withCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(request))) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function withCorsAndError(
  request: Request,
  fn: () => Promise<Response>,
): Promise<Response> {
  return fn().catch((error: unknown) => {
    if (isDev) {
      console.error("[Auth] error:", error);
    }
    return withCors(json({ error: "Internal server error" }, 500), request);
  });
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
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
          headers: corsHeaders(request),
        });
      },
      GET: async ({ request }) => {
        return withCorsAndError(request, async () => {
          const res = await auth.handler(request);
          return withCors(res, request);
        });
      },
      POST: async ({ request }) => {
        return withCorsAndError(request, async () => {
          const url = new URL(request.url);
          let res: Response;
          if (url.pathname.endsWith("/api/auth/set-password")) {
            res = await handleSetPassword(request);
          } else if (url.pathname.endsWith("/api/auth/verify-password")) {
            res = await handleVerifyPassword(request);
          } else {
            res = await auth.handler(request);
          }
          return withCors(res, request);
        });
      },
    },
  },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const readStringField = async (request: Request, field: string) => {
  const body: unknown = await request.json();

  if (typeof body !== "object" || body === null || !(field in body)) {
    return null;
  }

  const value = (body as Record<string, unknown>)[field];
  return typeof value === "string" ? value : null;
};

const handleSetPassword = async (request: Request) => {
  const newPassword = await readStringField(request, "newPassword");

  if (!newPassword) return json({ error: "New password is required" }, 400);

  try {
    await auth.api.setPassword({
      body: { newPassword },
      headers: request.headers,
    });

    return json({ ok: true });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Could not set password",
      },
      400,
    );
  }
};

const handleVerifyPassword = async (request: Request) => {
  const password = await readStringField(request, "password");

  if (!password) return json({ error: "Password is required" }, 400);

  try {
    await auth.api.verifyPassword({
      body: { password },
      headers: request.headers,
    });

    return json({ ok: true });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Could not verify password",
      },
      400,
    );
  }
};
