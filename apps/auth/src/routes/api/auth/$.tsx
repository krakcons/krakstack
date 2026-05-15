import { auth } from "@/services/auth/config";
import { createFileRoute } from "@tanstack/react-router";

const parseCsv = (value: string | undefined) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const allowedOrigins = new Set([
  process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  ...parseCsv(process.env.BETTER_AUTH_TRUSTED_ORIGINS),
]);

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

const corsOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins.has(origin)) return null;
  return origin;
};

const withCors = async (request: Request, handler: () => Promise<Response>) => {
  const origin = corsOrigin(request);

  if (request.method === "OPTIONS") {
    if (!origin) return new Response("CORS not allowed", { status: 403 });
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Origin": origin,
      },
    });
  }

  const response = await handler();
  if (!origin) return response;

  const corsResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(corsHeaders)) {
    corsResponse.headers.set(key, value);
  }
  corsResponse.headers.set("Access-Control-Allow-Origin", origin);
  return corsResponse;
};

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return await withCors(request, () => auth.handler(request));
      },
      OPTIONS: async ({ request }: { request: Request }) => {
        return await withCors(request, async () => new Response(null));
      },
      POST: async ({ request }: { request: Request }) => {
        return await withCors(request, async () => {
          const url = new URL(request.url);

          if (url.pathname.endsWith("/api/auth/set-password")) {
            return handleSetPassword(request);
          }

          if (url.pathname.endsWith("/api/auth/verify-password")) {
            return handleVerifyPassword(request);
          }

          return await auth.handler(request);
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

  const value = Object.entries(body).find(([key]) => key === field)?.[1];
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
