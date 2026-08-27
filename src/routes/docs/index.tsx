import { RegistryDocsLayout } from "@/components/registry-docs-layout";
import { DocsContent, DocsFooter, DocsHeader, DocsPage } from "@/lib/docs";
import { getRegistryDocsPages, makeRegistryDocs } from "@/lib/registry-docs";
import { getLocale } from "@/paraglide/runtime";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  loader: async () => {
    const pages = await getRegistryDocsPages();
    const docs = makeRegistryDocs(pages);
    const resolution = docs.resolve(undefined, getLocale());
    if (!resolution) throw notFound();
    return { pages, resolution };
  },
  head: ({ loaderData }) => {
    const docs = makeRegistryDocs(loaderData?.pages ?? []);
    const options: Parameters<typeof docs.getHead>[0] = {
      locale: loaderData?.resolution.page.locale ?? getLocale(),
    };
    if (loaderData?.resolution.page) options.page = loaderData.resolution.page;
    return docs.getHead(options);
  },
  component: IntroductionDocs,
});

function IntroductionDocs() {
  const { pages, resolution } = Route.useLoaderData();
  const docs = makeRegistryDocs(pages);

  return (
    <RegistryDocsLayout docs={docs}>
      <DocsPage docs={docs} resolution={resolution}>
        <DocsHeader docs={docs} resolution={resolution} />
        <DocsContent docs={docs} resolution={resolution} />
        <DocsFooter docs={docs} resolution={resolution} />
      </DocsPage>
    </RegistryDocsLayout>
  );
}
