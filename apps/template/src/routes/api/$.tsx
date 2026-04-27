import { createFileRoute } from "@tanstack/react-router";

import { handler as effectHandler } from "@/lib/api-handler";

const handler = effectHandler as (request: Request) => Promise<Response>;

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: async ({ request }) => handler(request),
      POST: async ({ request }) => handler(request),
      PATCH: async ({ request }) => handler(request),
      DELETE: async ({ request }) => handler(request),
    },
  },
});
