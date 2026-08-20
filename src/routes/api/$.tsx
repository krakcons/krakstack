import { createFileRoute } from "@tanstack/react-router";

const apiHandler = async (request: Request) => {
  const { handler } = await import("@/lib/api-handler");

  return handler(request);
};

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: ({ request }) => apiHandler(request),
    },
  },
});
