import { RegistryDocsLayout } from "@/components/registry-docs-layout";
import { DocsContent, DocsFooter, DocsHeader, DocsPage } from "@/lib/docs";
import { registryDocs } from "@/lib/registry-docs";
import { getLocale } from "@/paraglide/runtime";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  loader: () => {
    const resolution = registryDocs.resolve(undefined, getLocale());
    if (!resolution) throw notFound();
    return { resolution };
  },
  head: ({ loaderData }) => {
    const options: Parameters<typeof registryDocs.getHead>[0] = {
      locale: loaderData?.resolution.page.locale ?? getLocale(),
    };
    if (loaderData?.resolution.page) options.page = loaderData.resolution.page;
    return registryDocs.getHead(options);
  },
  component: IntroductionDocs,
});

function IntroductionDocs() {
  const { resolution } = Route.useLoaderData();

  return (
    <RegistryDocsLayout>
      <DocsPage docs={registryDocs} resolution={resolution}>
        <DocsHeader docs={registryDocs} resolution={resolution} />
        <DocsContent docs={registryDocs} resolution={resolution} />
        <DocsFooter docs={registryDocs} resolution={resolution} />
      </DocsPage>
    </RegistryDocsLayout>
  );
}
