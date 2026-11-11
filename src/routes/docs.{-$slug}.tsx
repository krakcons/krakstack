import { RegistryDocsLayout } from "@/components/registry-docs-layout";
import { AgentsPreview } from "@/components/registry-previews/agents-preview";
import { RegistryExample } from "@/components/registry-example";
import { getRegistryPreviewSource } from "@/lib/registry-preview";
import { m } from "@/paraglide/messages";
import { QueryStandard } from "@/lib/query";
import type { RegistryItem } from "@/lib/registry";
import { getRegistryItem } from "@/lib/registry";
import {
  DocsContent,
  DocsFooter,
  DocsHeader,
  DocsNotFound,
  DocsPage,
} from "@krak-stack/registry/docs";
import {
  getAgentsPreviewMarkdown,
  getRegistryDocsPages,
  makeRegistryDocs,
  registryDocsShell,
} from "@/lib/registry-docs";
import { getLocale } from "@/paraglide/runtime";
import { TrackingNotice } from "@/services/events/client/tracking-notice";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
} from "react";

const mapMenuPreview = lazy(() =>
  import("@/components/registry-previews/map-menu-preview").then(
    ({ MapMenuPreview }) => ({
      default: MapMenuPreview,
    }),
  ),
);

const registryPreviews: Readonly<
  Record<string, LazyExoticComponent<ComponentType> | undefined>
> = Object.fromEntries([
  [
    "image-crop-editor",
    lazy(() =>
      import("@/components/registry-previews/image-crop-editor-preview").then(
        ({ ImageCropEditorPreview }) => ({ default: ImageCropEditorPreview }),
      ),
    ),
  ],
  [
    "timezone-select",
    lazy(() =>
      import("@/components/registry-previews/timezone-select-preview").then(
        ({ TimezoneSelectPreview }) => ({ default: TimezoneSelectPreview }),
      ),
    ),
  ],
  [
    "async-action-button",
    lazy(() =>
      import("@/components/registry-previews/async-action-button-preview").then(
        ({ AsyncActionButtonPreview }) => ({
          default: AsyncActionButtonPreview,
        }),
      ),
    ),
  ],
  [
    "unsaved-changes-guard",
    lazy(() =>
      import("@/components/registry-previews/unsaved-changes-guard-preview").then(
        ({ UnsavedChangesGuardPreview }) => ({
          default: UnsavedChangesGuardPreview,
        }),
      ),
    ),
  ],
  [
    "danger-confirmation",
    lazy(() =>
      import("@/components/registry-previews/danger-confirmation-preview").then(
        ({ DangerConfirmationPreview }) => ({
          default: DangerConfirmationPreview,
        }),
      ),
    ),
  ],
  [
    "editable-text",
    lazy(() =>
      import("@/components/registry-previews/editable-text-preview").then(
        ({ EditableTextPreview }) => ({ default: EditableTextPreview }),
      ),
    ),
  ],
  [
    "presence-transition",
    lazy(() =>
      import("@/components/registry-previews/presence-transition-preview").then(
        ({ PresenceTransitionPreview }) => ({
          default: PresenceTransitionPreview,
        }),
      ),
    ),
  ],
  [
    "auto-height",
    lazy(() =>
      import("@/components/registry-previews/auto-height-preview").then(
        ({ AutoHeightPreview }) => ({ default: AutoHeightPreview }),
      ),
    ),
  ],
  [
    "animated-list",
    lazy(() =>
      import("@/components/registry-previews/animated-list-preview").then(
        ({ AnimatedListPreview }) => ({ default: AnimatedListPreview }),
      ),
    ),
  ],
  [
    "animated-number",
    lazy(() =>
      import("@/components/registry-previews/animated-number-preview").then(
        ({ AnimatedNumberPreview }) => ({ default: AnimatedNumberPreview }),
      ),
    ),
  ],
  [
    "app-switcher",
    lazy(() =>
      import("@/components/registry-previews/app-switcher-preview").then(
        ({ AppSwitcherPreview }) => ({ default: AppSwitcherPreview }),
      ),
    ),
  ],
  [
    "secret-value",
    lazy(() =>
      import("@/components/registry-previews/secret-value-preview").then(
        ({ SecretValuePreview }) => ({ default: SecretValuePreview }),
      ),
    ),
  ],
  [
    "bulk-list-input",
    lazy(() =>
      import("@/components/registry-previews/bulk-list-input-preview").then(
        ({ BulkListInputPreview }) => ({ default: BulkListInputPreview }),
      ),
    ),
  ],
  [
    "choice-cards",
    lazy(() =>
      import("@/components/registry-previews/choice-cards-preview").then(
        ({ ChoiceCardsPreview }) => ({ default: ChoiceCardsPreview }),
      ),
    ),
  ],
  [
    "upload-attachment",
    lazy(() =>
      import("@/components/registry-previews/upload-attachment-preview").then(
        ({ UploadAttachmentPreview }) => ({ default: UploadAttachmentPreview }),
      ),
    ),
  ],
  ["map-menu", mapMenuPreview],
  [
    "stepper",
    lazy(() =>
      import("@/components/registry-previews/stepper-preview").then(
        ({ StepperPreview }) => ({
          default: StepperPreview,
        }),
      ),
    ),
  ],
  [
    "error-component",
    lazy(() =>
      import("@/components/registry-previews/error-component-preview").then(
        ({ ErrorComponentPreview }) => ({ default: ErrorComponentPreview }),
      ),
    ),
  ],
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
        ({ FormPreview }) => ({
          default: FormPreview,
        }),
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
        ({ AgentPreview }) => ({
          default: AgentPreview,
        }),
      ),
    ),
  ],
  [
    "loading",
    lazy(() =>
      import("@/components/registry-previews/loading-preview").then(
        ({ LoadingPreview }) => ({
          default: LoadingPreview,
        }),
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
    "color-picker",
    lazy(() =>
      import("@/components/registry-previews/color-picker-preview").then(
        ({ ColorPickerPreview }) => ({ default: ColorPickerPreview }),
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
    const previewSource =
      item && registryPreviews[item.name]
        ? await getRegistryPreviewSource({ data: item.name })
        : null;
    return { agentsPreviewMarkdown, item, pages, resolution, previewSource };
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
  const { agentsPreviewMarkdown, item, pages, resolution, previewSource } =
    Route.useLoaderData();
  const docs = makeRegistryDocs(pages);

  return (
    <RegistryDocsLayout docs={docs}>
      <DocsPage docs={docs} resolution={resolution}>
        <DocsHeader docs={docs} resolution={resolution} />
        {item ? (
          <RegistryPreview
            agentsMarkdown={agentsPreviewMarkdown}
            slug={item.name}
            source={previewSource}
          />
        ) : null}
        <DocsContent docs={docs} resolution={resolution} />
        {item ? (
          <div className="mt-12">
            <Dependencies item={item} />
          </div>
        ) : null}
        <DocsFooter docs={docs} resolution={resolution} />
        {item?.name === "service-events" ? (
          <TrackingNotice locale={getLocale()} />
        ) : null}
      </DocsPage>
    </RegistryDocsLayout>
  );
}

function Dependencies({ item }: { item: RegistryItem }) {
  const sections = [
    {
      title: m.registry_docs_dependencies(),
      items: item.dependencies,
      getHref: getNpmHref,
    },
    {
      title: m.registry_docs_dev_dependencies(),
      items: item.devDependencies,
      getHref: getNpmHref,
    },
    {
      title: m.registry_docs_registry_dependencies(),
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
    <section
      className="border-t pt-8"
      aria-label={m.registry_docs_dependencies()}
    >
      <h2 className="text-xl font-semibold tracking-tight">
        {m.registry_docs_dependencies()}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        {m.registry_docs_dependencies_description()}
      </p>
      <div className={`mt-5 grid gap-6 ${columnsClass}`}>
        {sections.map((section) => (
          <section className="grid content-start gap-2" key={section.title}>
            <h3 className="text-sm font-medium">{section.title}</h3>
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
    </section>
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
  source,
}: {
  agentsMarkdown?: Awaited<ReturnType<typeof getAgentsPreviewMarkdown>>;
  slug: string;
  source?: string | null;
}) {
  const Preview = registryPreviews[slug];
  if (!Preview && !(slug === "agents" && agentsMarkdown)) return null;

  return (
    <RegistryExample source={source}>
      <Suspense fallback={null}>
        {slug === "agents" && agentsMarkdown ? (
          <AgentsPreview markdown={agentsMarkdown} />
        ) : Preview ? (
          <Preview />
        ) : null}
      </Suspense>
    </RegistryExample>
  );
}
