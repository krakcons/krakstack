# Tech Stack

This document explains the standard stack for our tools and projects. It is not a hard requirement and will change as we learn and grow.

## Configuration

- Bundler: Vite
- Formatter: Oxfmt
- Linter: Oxlint
- Package Manager: Bun
- Runtime: Bun
- Testing: Bun
- Schema: Effect Schema

## Database

- Primary: Postgres

## Web Applications

- Framework: React
- Meta Framework: Tanstack Start
- Tables: Tanstack Table
- Forms: Tanstack Form
- Styling: Tailwind
- Components: Shadcn
- Icons: Lucide
- State: Effect Atom
- Server: Effect HTTP
- Server Docs: OpenAPI and Scalar
- i18n: Paraglide.js + inlang
- Auth: Better Auth

## Mobile Applications

- Framework: React Native + Expo
- Notifications: Expo notifications

## External Tools

- Telemetry: [Clickstack (OpenTelemetry, Clickhouse, HyperDX)](https://clickhouse.com/docs/use-cases/observability/clickstack)
- Database Visualization: [Drizzle Gateway](https://db.krakconsultants.net)

## AI

- Harness: Opencode
- Coding Model: GPT-5.4, Opencode Go (GLM, Minimax, Kimi)
- Sdk: Effect AI

## Infrastructure

- Platform (Iac): NixOS
- Cloud (Iac): Pulumi
- Servers: OVHCloud Kimsufi (Beauharnois)
- Containers: Podman
- Proxy: Caddy
- Orchestration: Nomad/Consul
- CDN/Domain: Cloudflare
- Secrets: Sops
