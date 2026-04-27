import { m } from "@/paraglide/messages";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="grid gap-6 p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <p className="mt-4 text-lg">{m.home_page()}</p>
      <div className="flex flex-wrap gap-3">
        <Link
          className="rounded-md border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2"
          params={{ slug: "form" }}
          to="/docs/registry/$slug"
        >
          Form docs
        </Link>
        <Link
          className="rounded-md border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2"
          params={{ slug: "data-table" }}
          to="/docs/registry/$slug"
        >
          Data table docs
        </Link>
      </div>
    </div>
  );
}
