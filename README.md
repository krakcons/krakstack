# KrakStack Site

KrakStack Site is the public registry and documentation site for KrakStack. It publishes installable shadcn registry blocks, service libraries, configuration files, and documentation for building full-stack TanStack Start applications with Effect, Drizzle, Better Auth, Paraglide, and shadcn UI.

## Public Sites

- [template.krakstack.net](https://template.krakstack.net) - The live KrakStack template application. It shows the full-stack starter in action, including TanStack Start routing, Effect HTTP APIs, Drizzle/PostgreSQL persistence, shadcn UI, Paraglide i18n, and the reference CRUD patterns used by the template.
- [auth.krakstack.net](https://auth.krakstack.net) - The hosted KrakStack Auth service. It provides the central identity provider used by KrakStack apps, OAuth sign-in, organization-aware user sessions, and API-key management/verification for services that need shared authentication.
- [krakstack.net](https://krakstack.net) - This registry and docs site. It documents the components and services you can install into a KrakStack project.

## What This Repository Contains

- A TanStack Start site for browsing KrakStack registry items.
- Public registry JSON under `public/r/` for shadcn-compatible installation.
- Source registry definitions in `registry.json` and implementation files under `src/` and `templates/`.
- Documentation pages for UI blocks, auth, services, layers, notifications, agents, lint/format config, and the KrakStack template.

## Getting Started

Install dependencies and start the development server:

```bash
bun install
bun --bun run dev
```

The dev server runs on port `3003` by default.

## Common Commands

```bash
bun run build
bun run test
bun type:check
bun lint
bun fmt
```

When changing custom i18n messages in `src/messages/global`, merge them into the generated root message files:

```bash
bun scripts/merge-messages
```

## Registry

Registry items are published as shadcn-compatible JSON files. For example:

```bash
npx shadcn@latest add https://krakstack.net/r/krakstack-auth.json
```

Use the docs site to browse available components, services, and configuration packages before installing them. Use [template.krakstack.net](https://template.krakstack.net) and the template source on GitHub when starting a full application.

## Stack

- TanStack Start and TanStack Router
- React
- Effect services, HttpApi, OpenAPI, and atoms
- Drizzle ORM and PostgreSQL
- Better Auth
- Paraglide i18n
- shadcn UI and Tailwind CSS
