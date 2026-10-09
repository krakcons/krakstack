import { Schema } from "effect";

import { compileDocsMarkdown, loadMdxDocsDirectory } from "@/lib/docs.server";
import {
  DocsPageSchema,
  type DocsPage,
  type DocsSection,
} from "@krak-stack/registry/docs";
import { compileMarkdown } from "@/lib/markdown/server";
import {
  getRegistryGroup,
  getRegistryItemMeta,
  registryItems,
} from "@/lib/registry";

const locales = ["en", "fr"] as const;
const firstRegistryPageOrder = 4;

const sectionByGroup = {
  Components: "components",
  Configuration: "configuration",
  Layers: "layers",
  Libraries: "libraries",
  Notifications: "notifications",
  Registry: "registry",
  Services: "services",
} satisfies Record<string, DocsSection>;

const withInstallSection = (source: string, name: string) => {
  if (/^## (?:Install|Installation)\s*$/m.test(source)) return source;

  const section = `\n\n## Install\n\n\`\`\`bash\nbunx shadcn@latest add @krak-stack/${name}\n\`\`\``;
  const nextHeading = source.indexOf("\n## ", source.indexOf("\n") + 1);
  return nextHeading === -1
    ? `${source}${section}`
    : `${source.slice(0, nextHeading)}${section}${source.slice(nextHeading)}`;
};

const registryPages = (
  contentPages: ReadonlyArray<DocsPage>,
  registryGuides: ReadonlyArray<DocsPage>,
): DocsPage[] => {
  const reservedOrders = new Set(contentPages.map((page) => page.order));
  let nextOrder = firstRegistryPageOrder;
  const orderedItems = registryItems.map((item) => {
    while (reservedOrders.has(nextOrder)) nextOrder++;
    return { item, order: nextOrder++ };
  });
  return locales.flatMap((locale) =>
    orderedItems.map(({ item, order }) => {
      const meta = getRegistryItemMeta(item);
      const title = item.title ?? item.name;
      const guide = registryGuides.find(
        (page) => page.slug === item.name && page.locale === locale,
      );
      const compiled = compileDocsMarkdown(
        withInstallSection(
          guide?.source ?? item.docs ?? `## Overview\n\n${item.description}`,
          item.name,
        ),
      );

      return Schema.decodeUnknownSync(DocsPageSchema)({
        slug: item.name,
        path: `/docs/${item.name}`,
        title: guide?.title ?? title,
        description: guide?.description ?? item.description,
        order,
        locale,
        section: sectionByGroup[getRegistryGroup(item)],
        type: "reference",
        createdAt: meta?.createdAt?.toISOString(),
        updatedAt: guide?.updatedAt ?? meta?.updatedAt?.toISOString(),
        sourceFile: `src/content/docs/${locale}/registry/${item.name}.mdx`,
        ...compiled,
      });
    }),
  );
};

export const loadRegistryDocsPages = async () => {
  const contentPages = await loadMdxDocsDirectory("src/content/docs");
  const registryGuides = contentPages.filter((page) =>
    page.sourceFile.includes("/registry/"),
  );
  const standalonePages = contentPages.filter(
    (page) => !page.sourceFile.includes("/registry/"),
  );
  return [
    ...standalonePages,
    ...registryPages(standalonePages, registryGuides),
  ];
};

export const loadAgentsPreviewMarkdown = async () =>
  compileMarkdown(await Bun.file("AGENTS.md").text());
