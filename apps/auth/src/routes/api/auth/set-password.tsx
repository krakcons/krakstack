import { auth } from "@/services/auth/config";
import { corsMiddleware } from "@/lib/cors";
import { json, readStringField } from "@/lib/http";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/set-password")({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      POST: async ({ request }) => {
        const newPassword = await readStringField(request, "newPassword");
        if (!newPassword) {
          return json({ error: "New password is required" }, 400);
        }

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
                error instanceof Error
                  ? error.message
                  : "Could not set password",
            },
            400,
          );
        }
      },
    },
  },
});
