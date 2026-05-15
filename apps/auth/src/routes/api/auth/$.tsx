import { auth } from "@/services/auth/config";
import { corsMiddleware } from "@/lib/cors";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
});
