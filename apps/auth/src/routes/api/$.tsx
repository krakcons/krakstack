import { createFileRoute } from "@tanstack/react-router";

import { apiHandler } from "@/api-handler";

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: ({ request }) => apiHandler(request),
      POST: ({ request }) => apiHandler(request),
      PUT: ({ request }) => apiHandler(request),
      PATCH: ({ request }) => apiHandler(request),
      DELETE: ({ request }) => apiHandler(request),
      OPTIONS: ({ request }) => apiHandler(request),
    },
  },
});
