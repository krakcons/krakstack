# KrakStack Template

A full-stack web application template built with TanStack Start, Effect, Drizzle ORM, and Tailwind CSS. Ships with a task CRUD demo featuring optimistic updates, i18n, and auto-generated API documentation.

## Tech Stack

| Layer           | Technology                                       |
| --------------- | ------------------------------------------------ |
| Runtime         | Bun                                              |
| Framework       | TanStack Start (React + SSR)                     |
| State           | Effect Atom (optimistic atoms)                   |
| API             | Effect HTTP (OpenAPI + Scalar docs)              |
| Database        | PostgreSQL via Drizzle ORM                       |
| Styling         | Tailwind CSS + Shadcn (base-vega) + Lucide icons |
| Forms           | TanStack Form                                    |
| Tables          | TanStack Table                                   |
| i18n            | Paraglide.js + inlang (English & French)         |
| Dev Environment | devenv (Nix)                                     |
| Linting         | Oxlint                                           |
| Formatting      | Oxfmt                                            |

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- PostgreSQL (provided via devenv or self-hosted)

## Running Locally

### Option A: devenv (recommended)

The project includes a `devenv.nix` that auto-provisions PostgreSQL 18 with PostGIS and pgvector extensions, and starts both the dev server and Drizzle Studio as background processes.

1. Install [devenv](https://devenv.sh/getting-started/)
2. Enter the shell:

```bash
devenv shell
```

Or if you use [direnv](https://direnv.net/):

```bash
direnv allow
```

This will:

- Provision PostgreSQL with a `billyhawkes` superuser and a `postgres` app user (`postgres` password)
- Start `bun run dev` (Vite on port 3000) and `bunx drizzle-kit studio` as managed processes

3. Copy the environment file:

```bash
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to a valid PostgreSQL connection string:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

4. Push the database schema:

```bash
bunx drizzle-kit push
```

5. Open [http://localhost:3000](http://localhost:3000)

### Option B: Manual setup

1. Install [Bun](https://bun.sh/)

2. Set up a PostgreSQL database (version 14+, with `pgvector` and `postgis` extensions recommended) and note the connection string

3. Copy the environment file and fill in your database URL:

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

4. Install dependencies:

```bash
bun install
```

5. Push the database schema:

```bash
bunx drizzle-kit push
```

6. Start the dev server:

```bash
bun --bun run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `bun --bun run dev`     | Start Vite dev server on port 3000 |
| `bun --bun run build`   | Production build                   |
| `bun --bun run preview` | Preview production build           |
| `bun run lint`          | Run Oxlint                         |
| `bun run fmt`           | Run Oxfmt                          |
| `bun run type:check`    | Run TypeScript type checking       |

## Database

Drizzle ORM manages the PostgreSQL schema. The schema is defined in `src/db/schema.ts`.

| Command                     | Description                                  |
| --------------------------- | -------------------------------------------- |
| `bunx drizzle-kit push`     | Push schema changes directly to the database |
| `bunx drizzle-kit generate` | Generate migration files from schema changes |
| `bunx drizzle-kit migrate`  | Run pending migrations                       |
| `bunx drizzle-kit studio`   | Open Drizzle Studio (database browser)       |

### Current schema

- **tasks** — `id` (UUID), `title`, `description`, `completed`, `created_at`, `updated_at`

## Project Structure

```
src/
├── api.ts                  # Effect HTTP API definition (endpoints & groups)
├── server.ts               # TanStack Start server entry (Paraglide middleware)
├── router.tsx              # TanStack Router config with i18n URL rewriting
├── styles.css              # Tailwind CSS entry point
├── db/
│   └── schema.ts           # Drizzle ORM schema definitions
├── services/
│   ├── database.ts         # Effect-managed Drizzle + PostgreSQL connection
│   └── task/
│       ├── index.ts        # Tasks (CRUD operations with Effect)
│       ├── schema.ts       # Effect Schema validation (Task, CreateTask, UpdateTask)
│       └── handler.ts      # Effect HTTP API handlers wired to Tasks
├── lib/
│   ├── api-builder.ts      # Effect Layer wiring (API + handlers + services)
│   ├── api-client.ts       # Client-side API client (Effect Atom HTTP)
│   ├── api-handler.ts      # Exposes API + Scalar docs as a Web Handler
│   ├── utils.ts            # Utility functions (cn, etc.)
│   └── atoms/
│       └── tasks.ts        # Effect Atom atoms (queries + optimistic mutations)
├── components/
│   ├── ui/                 # Shadcn UI primitives (button, dialog, input, etc.)
│   ├── data-table/         # Reusable data-table component (TanStack Table)
│   ├── form/               # Reusable form component (TanStack Form)
│   └── tasks/              # Task-specific components (dialog, table)
├── messages/
│   ├── en.json             # English translations
│   ├── fr.json             # French translations
│   └── components/         # Component-scoped translations
├── paraglide/              # Auto-generated Paraglide runtime (do not edit)
└── routes/
    ├── __root.tsx           # Root layout (HTML shell, locale awareness)
    ├── index.tsx            # Home page (task table + create dialog)
    └── api/                 # API route handlers
```

## API Documentation

The Effect HTTP API is served at `/api` with auto-generated docs:

- **Scalar docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **OpenAPI spec**: [http://localhost:3000/api/openapi.json](http://localhost:3000/api/openapi.json)

### Endpoints

| Method | Path             | Description      |
| ------ | ---------------- | ---------------- |
| GET    | `/api/tasks`     | List all tasks   |
| POST   | `/api/tasks`     | Create a task    |
| GET    | `/api/tasks/:id` | Get a task by ID |
| PATCH  | `/api/tasks/:id` | Update a task    |
| DELETE | `/api/tasks/:id` | Delete a task    |

## Internationalization (i18n)

The app supports **English** and **French** via [Paraglide.js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) and [inlang](https://inlang.com/).

- Locales are configured in `project.inlang/settings.json`
- Translation messages live in `src/messages/{locale}.json`
- URL-based locale detection with patterns like `/en/...` and `/fr/...`
- API routes (`/api/...`) are excluded from locale routing

The Paraglide runtime in `src/paraglide/` is auto-generated — do not edit it directly.

## Components

Shadcn components are configured in `components.json` using the `base-vega` style. Add new components with:

```bash
bunx shadcn@latest add <component>
```

## Building for Production

```bash
bun --bun run build
```

The output is written to `dist/`.

## Demo Files

The task CRUD feature serves as a reference implementation. To remove it, delete:

- `src/services/task/`
- `src/components/tasks/`
- `src/components/data-table/`
- `src/lib/atoms/tasks.ts`
- `src/db/schema.ts` (the `tasks` table)
- `src/api.ts` (the task endpoints)
- `src/lib/api-builder.ts`, `src/lib/api-client.ts`, `src/lib/api-handler.ts`

Then update `src/routes/index.tsx` with your own content.
