import { createFileRoute } from "@tanstack/react-router";

import { handler as effectHandler } from "@/lib/api-handler";

const handler = effectHandler as (request: Request) => Promise<Response>;

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handler(request),
      POST: async ({ request }: { request: Request }) => handler(request),
      PATCH: async ({ request }: { request: Request }) => handler(request),
      DELETE: async ({ request }: { request: Request }) => handler(request),
    },
  },
});
