import { createFileRoute } from "@tanstack/react-router";

const handler = () => {
  return Response.json({ error: "Not found" }, { status: 404 });
};

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      PATCH: handler,
      DELETE: handler,
      OPTIONS: handler,
    },
  },
});
