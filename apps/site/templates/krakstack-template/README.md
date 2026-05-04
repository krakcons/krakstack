# KrakStack Template

A full-stack TanStack Start template with Effect HTTP, Drizzle PostgreSQL, Paraglide i18n, shadcn UI, and a task CRUD reference implementation.

Source: https://github.com/krakcons/krakstack/tree/main/apps/template

## Use The Template

```bash
git clone https://github.com/krakcons/krakstack.git
cd krakstack/apps/template
bun install
cp .env.example .env
bunx drizzle-kit push
bun --bun run dev
```

See the source README for devenv setup, database details, generated API documentation, and demo-removal notes.
