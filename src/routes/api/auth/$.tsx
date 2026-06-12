import { createFileRoute } from "@tanstack/react-router";

const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: notFound,
      POST: notFound,
    },
  },
});
