import { InstallCommand } from "@/components/install-command";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegistryItem } from "@/lib/use-registry-item";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/service-database")({ component: ServiceDatabaseDocs });

const registryFallback = {
  name: "service-database",
  description: "An effect and drizzle postgresql database service.",
};

const usageExample = `import { Effect } from "effect";
import { DatabaseService } from "@/services/database";
import { users } from "@/db/schema";

const program = Effect.gen(function* () {
  const db = yield* DatabaseService;
  return yield* db.select().from(users);
});

const usersList = await Effect.runPromise(
  program.pipe(Effect.provide(DatabaseService.layer)),
);`;

function ServiceDatabaseDocs() {
  const registryItem = useRegistryItem("service-database", registryFallback);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid min-w-0 gap-3">
        <p className="text-sm font-semibold tracking-[0.24em] text-[var(--kicker)] uppercase">Services</p>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div className="grid min-w-0 gap-3">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
              {registryItem.title ?? registryItem.name}
            </h1>
            <p className="max-w-2xl text-lg text-[var(--sea-ink-soft)]">{registryItem.description}</p>
          </div>
          <Card className="bg-[var(--surface-strong)]">
            <CardHeader>
              <CardTitle>Effect layer</CardTitle>
              <CardDescription>
                Provides a Drizzle PostgreSQL client from `DATABASE_URL` through an Effect service.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <InstallCommand slug="service-database" />

      <Card className="min-w-0 bg-[var(--surface-strong)]">
        <CardHeader>
          <CardTitle>Example Usage</CardTitle>
          <CardDescription>
            Import the generated service, provide its layer, and yield the database in an Effect.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <pre className="overflow-x-auto rounded-lg border border-[var(--line)] bg-[#1d2e45] p-4 text-sm text-[#e8efff]">
            <code>{usageExample}</code>
          </pre>
        </CardContent>
      </Card>
    </main>
  );
}
