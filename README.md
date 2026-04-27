# Krakstack

Open source repository for resources, tools, components, and services used at [Krak Consultants](https://krakconsultants.net).

## Roadmap

| #   | Feature           | Status |
| --- | ----------------- | ------ |
| 1   | Shadcn Repository | Open   |
| 2   | Central Hub       | Open   |
| 3   | Auth              | Open   |
| 4   | Localization      | Open   |
| 5   | Uptime            | Open   |

## Registry

Installable shadcn blocks and services:

- **data-table** — URL-state-driven data table with filtering, sorting, column visibility, CSV export, gallery view, grouping, and drag-and-drop
- **form** — TanStack Form hook with typed field components, submit state, file/image inputs, and dirty-navigation blocking
- **service-database** — Effect service providing a Drizzle PostgreSQL client from `DATABASE_URL`

## Tech Stack

See [`docs/tech.md`](docs/tech.md) for the full stack overview. Highlights:

- **Runtime/Bundler/PM:** Bun, Vite
- **Web:** React, TanStack Start, Tailwind, Shadcn, Effect
- **Database:** PostgreSQL (Drizzle ORM)
- **i18n:** Paraglide.js + inlang
- **Infra:** NixOS, Podman, Caddy, Pulumi, OVHCloud

## Project Structure

```
krakstack/
├── apps/
│   ├── site/       # registry website
│   └── template/   # project template with base services
└── docs/
```

## Getting Started

```bash
bun install
bun run dev
```

## Contributing

We appreciate contributions of all kinds! To get started:

1. **Issues** — Open an issue for bugs, feature requests, or questions on [GitHub](https://github.com/krakcons/krakstack/issues).
2. **Pull requests** — Fork the repo, create a branch, and submit a PR. Make sure existing tests pass and lint is clean (`bun run lint`).
3. **Discussions** — For larger changes, start a discussion before implementing.

Please be respectful and constructive. By contributing, you agree that your work will be licensed under the same terms as this project.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

