import { auth } from "@/services/auth/config";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return await auth.handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);

        if (url.pathname.endsWith("/api/auth/set-password")) {
          return handleSetPassword(request);
        }

        if (url.pathname.endsWith("/api/auth/verify-password")) {
          return handleVerifyPassword(request);
        }

        return await auth.handler(request);
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
