import { createFileRoute } from "@tanstack/react-router";

import { auth } from "@/lib/auth";

const handler = (request: Request) => {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith("/api/auth")) {
    return auth.handler(request);
  }

  return Response.json({ error: "Not found" }, { status: 404 });
};

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: async ({ request }) => handler(request),
      POST: async ({ request }) => handler(request),
      PUT: async ({ request }) => handler(request),
      PATCH: async ({ request }) => handler(request),
      DELETE: async ({ request }) => handler(request),
      OPTIONS: async ({ request }) => handler(request),
    },
  },
});
