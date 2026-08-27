import { RegistryDocsLayout } from "@/components/registry-docs-layout";
import { AgentsPreview } from "@/components/registry-previews/agents-preview";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RegistryItem } from "@/lib/registry";
import { getRegistryItem } from "@/lib/registry";
import {
  DocsContent,
  DocsFooter,
  DocsHeader,
  DocsNotFound,
  DocsPage,
} from "@/lib/docs";
import { QueryStandard } from "@/lib/query";
import {
  getAgentsPreviewMarkdown,
  getRegistryDocsPages,
  makeRegistryDocs,
  registryDocsShell,
} from "@/lib/registry-docs";
import { getLocale } from "@/paraglide/runtime";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
} from "react";

const registryPreviews = new Map<string, LazyExoticComponent<ComponentType>>([
  [
    "data-table",
    lazy(() =>
      import("@/components/registry-previews/data-table-preview").then(
        ({ DataTablePreview }) => ({ default: DataTablePreview }),
      ),
    ),
  ],
  [
    "form",
    lazy(() =>
      import("@/components/registry-previews/form-preview").then(
        ({ FormPreview }) => ({ default: FormPreview }),
      ),
    ),
  ],
  [
    "effect-form",
    lazy(() =>
      import("@/components/registry-previews/effect-form-preview").then(
        ({ EffectFormPreview }) => ({ default: EffectFormPreview }),
      ),
    ),
  ],
  [
    "file-picker",
    lazy(() =>
      import("@/components/registry-previews/file-picker-preview").then(
        ({ FilePickerPreview }) => ({ default: FilePickerPreview }),
      ),
    ),
  ],
  [
    "lint-format",
    lazy(() =>
      import("@/components/registry-previews/lint-format-preview").then(
        ({ LintFormatPreview }) => ({ default: LintFormatPreview }),
      ),
    ),
  ],
  [
    "copy-button",
    lazy(() =>
      import("@/components/registry-previews/copy-button-preview").then(
        ({ CopyButtonPreview }) => ({ default: CopyButtonPreview }),
      ),
    ),
  ],
  [
    "agent",
    lazy(() =>
      import("@/components/registry-previews/agent-preview").then(
        ({ AgentPreview }) => ({ default: AgentPreview }),
      ),
    ),
  ],
  [
    "loading",
    lazy(() =>
      import("@/components/registry-previews/loading-preview").then(
        ({ LoadingPreview }) => ({ default: LoadingPreview }),
      ),
    ),
  ],
  [
    "pagination",
    lazy(() =>
      import("@/components/registry-previews/pagination-preview").then(
        ({ PaginationPreview }) => ({ default: PaginationPreview }),
      ),
    ),
  ],
  [
    "icon-input",
    lazy(() =>
      import("@/components/registry-previews/icon-input-preview").then(
        ({ IconInputPreview }) => ({ default: IconInputPreview }),
      ),
    ),
  ],
  [
    "virtualized-combobox",
    lazy(() =>
      import("@/components/registry-previews/virtualized-combobox-preview").then(
        ({ VirtualizedComboboxPreview }) => ({
          default: VirtualizedComboboxPreview,
        }),
      ),
    ),
  ],
]);

export const Route = createFileRoute("/docs/{-$slug}")({
  validateSearch: QueryStandard,
  loader: async ({ params }) => {
    const pages = await getRegistryDocsPages();
    const docs = makeRegistryDocs(pages);
    const resolution = docs.resolve(params.slug, getLocale());
    if (!resolution) throw notFound();
    if (!resolution.canonical) {
      throw redirect({ to: resolution.page.path, statusCode: 301 });
    }
    const item = getRegistryItem(resolution.page.slug);
    const agentsPreviewMarkdown =
      item?.name === "agents" ? await getAgentsPreviewMarkdown() : undefined;
    return { agentsPreviewMarkdown, item, pages, resolution };
  },
  head: ({ loaderData }) => {
    const docs = makeRegistryDocs(loaderData?.pages ?? []);
    const options: Parameters<typeof docs.getHead>[0] = {
      locale: loaderData?.resolution.page.locale ?? getLocale(),
    };
    if (loaderData?.resolution.page) options.page = loaderData.resolution.page;
    return docs.getHead(options);
  },
  component: RegistryDocs,
  notFoundComponent: () => (
    <DocsNotFound docs={registryDocsShell} locale={getLocale()} />
  ),
});

function RegistryDocs() {
  const { agentsPreviewMarkdown, item, pages, resolution } =
    Route.useLoaderData();
  const docs = makeRegistryDocs(pages);

  return (
    <RegistryDocsLayout docs={docs}>
      <DocsPage docs={docs} resolution={resolution}>
        <DocsHeader docs={docs} resolution={resolution} />
        <DocsContent docs={docs} resolution={resolution} />
        {item ? (
          <div className="mt-12 grid gap-8">
            <Dependencies item={item} />
            <RegistryPreview
              agentsMarkdown={agentsPreviewMarkdown}
              slug={item.name}
            />
          </div>
        ) : null}
        <DocsFooter docs={docs} resolution={resolution} />
      </DocsPage>
    </RegistryDocsLayout>
  );
}

function Dependencies({ item }: { item: RegistryItem }) {
  const sections = [
    { title: "Dependencies", items: item.dependencies, getHref: getNpmHref },
    {
      title: "Dev Dependencies",
      items: item.devDependencies,
      getHref: getNpmHref,
    },
    {
      title: "Registry Dependencies",
      items: item.registryDependencies,
      getHref: getRegistryDependencyHref,
    },
  ].filter((section) => section.items?.length);

  if (sections.length === 0) return null;
  const columnsClass =
    sections.length === 1
      ? "md:grid-cols-1"
      : sections.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader className="gap-1 pb-3">
        <CardTitle className="text-base">Dependencies</CardTitle>
        <CardDescription className="text-sm">
          Packages and shadcn components required by this registry item.
        </CardDescription>
      </CardHeader>
      <div className={`grid gap-4 px-6 pb-5 ${columnsClass}`}>
        {sections.map((section) => (
          <section className="grid content-start gap-2" key={section.title}>
            <h2 className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
              {section.title}
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {section.items?.map((dependency) => {
                const href = section.getHref(dependency);
                const external = !href.startsWith("/");

                return (
                  <li key={dependency}>
                    <a
                      className="bg-background text-foreground hover:border-primary hover:text-primary inline-flex rounded-md border px-2 py-1 font-mono text-xs transition-colors"
                      href={href}
                      rel={external ? "noreferrer" : undefined}
                      target={external ? "_blank" : undefined}
                    >
                      {dependency}
                    </a>
                  </li>
                );
              })}
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
  const versionSeparator = dependency.indexOf(
    "@",
    dependency.startsWith("@") ? 1 : 0,
  );
  return versionSeparator === -1
    ? dependency
    : dependency.slice(0, versionSeparator);
}

function getRegistryDependencyHref(dependency: string) {
  const registryPrefix = "@krak-stack/";
  if (dependency.startsWith(registryPrefix)) {
    return `/docs/${encodeURIComponent(dependency.slice(registryPrefix.length))}`;
  }

  return `https://ui.shadcn.com/docs/components/${dependency}`;
}

function RegistryPreview({
  agentsMarkdown,
  slug,
}: {
  agentsMarkdown?: Awaited<ReturnType<typeof getAgentsPreviewMarkdown>>;
  slug: string;
}) {
  const Preview = registryPreviews.get(slug);
  if (!Preview && !(slug === "agents" && agentsMarkdown)) return null;

  return (
    <section className="grid gap-3">
      <h2 className="text-foreground text-3xl font-semibold tracking-tight">
        Preview
      </h2>
      <Suspense fallback={null}>
        {slug === "agents" && agentsMarkdown ? (
          <AgentsPreview markdown={agentsMarkdown} />
        ) : Preview ? (
          <Preview />
        ) : null}
      </Suspense>
    </section>
  );
}
