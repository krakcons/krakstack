# Krakstack Auth

Central Better Auth server for Krakstack projects. It owns user credentials, sessions, OAuth clients, and OIDC metadata so other apps can authenticate through one service. Set it up yourself or use krakstack.net.

## Tech Stack

| Layer     | Technology                       |
| --------- | -------------------------------- |
| Runtime   | Bun                              |
| Framework | TanStack Start                   |
| Auth      | Better Auth + OAuth Provider     |
| Database  | PostgreSQL                       |
| Styling   | Tailwind CSS + shadcn components |
| i18n      | Paraglide.js + inlang            |

## Local Development

```bash
cp .env.example .env
bun install
bun run auth:migrate
bun run dev
```

## Environment

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/krakstack_auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3001,http://localhost:3000
BETTER_AUTH_VALID_AUDIENCES=http://localhost:3001,http://localhost:3000
```

Generate a production secret with:

```bash
openssl rand -base64 32
```

## Scripts

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `bun run dev`           | Start the auth server on port `3001`   |
| `bun run build`         | Production build                       |
| `bun run preview`       | Preview production build               |
| `bun run lint`          | Run Oxlint                             |
| `bun run fmt`           | Run Oxfmt                              |
| `bun run type:check`    | Run TypeScript checks                  |
| `bun run auth:generate` | Generate Better Auth schema/migrations |
| `bun run auth:migrate`  | Apply Better Auth migrations           |

## Auth Endpoints

| Path                                               | Purpose                             |
| -------------------------------------------------- | ----------------------------------- |
| `/api/auth/*`                                      | Better Auth API                     |
| `/sign-in`                                         | Central sign-in page                |
| `/sign-up`                                         | Central sign-up page                |
| `/consent`                                         | OAuth consent page                  |
| `/.well-known/openid-configuration`                | OIDC discovery                      |
| `/api/auth/.well-known/openid-configuration`       | Issuer-path OIDC discovery          |
| `/.well-known/oauth-authorization-server/api/auth` | OAuth authorization server metadata |

## Consumer Apps

Use `http://localhost:3001` as the local auth issuer/base URL. Production consumers should use the deployed auth domain in `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, and `BETTER_AUTH_VALID_AUDIENCES`.
