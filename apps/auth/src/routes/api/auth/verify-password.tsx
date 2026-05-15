import { auth } from "@/services/auth/config";
import { corsMiddleware } from "@/lib/cors";
import { json, readStringField } from "@/lib/http";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/verify-password")({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      POST: async ({ request }) => {
        const password = await readStringField(request, "password");
        if (!password) {
          return json({ error: "Password is required" }, 400);
        }

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
                error instanceof Error
                  ? error.message
                  : "Could not verify password",
            },
            400,
          );
        }
      },
    },
  },
});
