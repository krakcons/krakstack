import { RegistryDocsLayout } from "@/components/registry-docs-layout";
import {
  DocsContent,
  DocsFooter,
  DocsHeader,
  DocsPage,
} from "@krak-stack/registry/docs";
import {
  getRegistryDocsPage,
  getRegistryDocsPages,
  makeRegistryDocs,
} from "@/lib/registry-docs";
import { getLocale } from "@/paraglide/runtime";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  loader: async () => {
    const pages = await getRegistryDocsPages();
    const docs = makeRegistryDocs(pages);
    const locale = getLocale();
    const resolution = docs.resolve(undefined, locale);
    if (!resolution) throw notFound();
    const page = await getRegistryDocsPage({
      slug: resolution.page.slug,
      locale,
    });
    if (!page) throw notFound();
    return { pages, resolution: { ...resolution, page } };
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
