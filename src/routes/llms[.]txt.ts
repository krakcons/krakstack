import { createFileRoute } from "@tanstack/react-router";

const content = `# KrakStack Registry

> KrakStack is an open-source registry of production-ready UI components, Effect services, application patterns, and developer tooling for full-stack TanStack applications.

## Documentation

- Introduction (English): https://krakstack.net/en/docs
- Introduction (French): https://krakstack.net/fr/docs
- Registry: https://krakstack.net/en/
- Developer setup: https://krakstack.net/en/docs/developer-setup

## Installation

- Package: https://www.npmjs.com/package/@krak-stack/registry
- Shadcn registry: https://krakstack.net/r/{name}.json

## Key facts

- The registry provides source-owned shadcn components and package-managed Effect services.
- The primary stack is TanStack Start, React, Effect, Drizzle, PostgreSQL, and shadcn UI.
- Documentation is available in English and French.

## Source

- GitHub: https://github.com/krakcons/krakstack
- Registry package source: https://github.com/krakcons/krakstack-site
- Template: https://github.com/krakcons/krakstack-template
`;

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(content, {
          headers: {
            "cache-control": "public, max-age=3600",
            "content-type": "text/plain; charset=utf-8",
          },
        }),
    },
  },
});
