import { InstallCommand } from "@/components/install-command";
import { Markdown } from "@/components/markdown";
import { DataTablePreview, TableSearchSchema } from "@/components/registry-previews/data-table-preview";
import { FormPreview } from "@/components/registry-previews/form-preview";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegistryItem } from "@/lib/registry";
import { getRegistryGroup, getRegistryItem } from "@/lib/registry";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/registry/$slug")({
  validateSearch: TableSearchSchema,
  loader: ({ params }) => {
    const item = getRegistryItem(params.slug);
    if (!item) throw notFound();
    return item;
  },
  component: RegistryDocs,
});

function RegistryDocs() {
  const item = Route.useLoaderData();
  const group = getRegistryGroup(item);

  return (
    <main className="mx-auto flex min-h-screen w-full min-w-0 max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid min-w-0 gap-3">
        <p className="text-sm font-semibold tracking-[0.24em] text-[var(--kicker)] uppercase">{group}</p>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="grid min-w-0 gap-3">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
              {item.title ?? item.name}
            </h1>
            <p className="max-w-3xl text-lg text-[var(--sea-ink-soft)]">{item.description}</p>
          </div>
          <Card className="bg-[var(--surface-strong)]">
            <CardHeader>
              <CardTitle>{item.type.replace("registry:", "Registry ")}</CardTitle>
              <CardDescription>Install this item directly from the generated shadcn registry endpoint.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <InstallCommand slug={item.name} />

      {item.docs ? <Markdown content={item.docs} /> : null}
      <Dependencies item={item} />
      <RegistryPreview slug={item.name} />
    </main>
  );
}

function Dependencies({ item }: { item: RegistryItem }) {
  const sections = [
    { title: "Dependencies", items: item.dependencies, getHref: getNpmHref },
    { title: "Dev Dependencies", items: item.devDependencies, getHref: getNpmHref },
    { title: "Registry Dependencies", items: item.registryDependencies, getHref: getShadcnHref },
  ].filter((section) => section.items?.length);

  if (sections.length === 0) return null;
  const columnsClass = sections.length === 1 ? "md:grid-cols-1" : sections.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader className="gap-1 pb-3">
        <CardTitle className="text-base">Dependencies</CardTitle>
        <CardDescription className="text-sm">Packages and shadcn components required by this registry item.</CardDescription>
      </CardHeader>
      <div className={`grid gap-4 px-6 pb-5 ${columnsClass}`}>
        {sections.map((section) => (
          <section className="grid content-start gap-2" key={section.title}>
            <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--kicker)] uppercase">{section.title}</h2>
            <ul className="flex flex-wrap gap-1.5">
              {section.items?.map((dependency) => (
                <li key={dependency}>
                  <a
                    className="inline-flex rounded-md border border-[var(--line)] bg-background px-2 py-1 font-mono text-xs text-[var(--sea-ink)] transition-colors hover:border-[var(--kicker)] hover:text-[var(--kicker)]"
                    href={section.getHref(dependency)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {dependency}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  );
}

function getNpmHref(dependency: string) {
  return `https://www.npmjs.com/package/${encodeURIComponent(getPackageName(dependency))}`;
}

function getPackageName(dependency: string) {
  if (dependency.startsWith("@")) return dependency.split("@").slice(0, 3).join("@");
  return dependency.split("@")[0] ?? dependency;
}

function getShadcnHref(dependency: string) {
  return `https://ui.shadcn.com/docs/components/${dependency}`;
}

function RegistryPreview({ slug }: { slug: string }) {
  if (slug === "data-table") return <DataTablePreview />;
  if (slug === "form") return <FormPreview />;
  return null;
}
