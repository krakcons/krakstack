import { Schema } from "effect";

import { compileDocsMarkdown, loadMdxDocsDirectory } from "@/lib/docs.server";
import { DocsPageSchema, type DocsPage, type DocsSection } from "@/lib/docs";
import { compileMarkdown } from "@/lib/markdown/server";
import {
  getRegistryGroup,
  getRegistryItemMeta,
  registryItems,
} from "@/lib/registry";

const locales = ["en", "fr"] as const;
const firstRegistryPageOrder = 4;
const notificationGuideOrder = 17;

const registryPageOrder = (index: number) => {
  const order = index + firstRegistryPageOrder;
  return order >= notificationGuideOrder ? order + 1 : order;
};

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
  if (/^## Install\s*$/m.test(source)) return source;

  const section = `\n\n## Install\n\n\`\`\`bash\nbunx shadcn@latest add @krak-stack/${name}\n\`\`\``;
  const nextHeading = source.indexOf("\n## ", source.indexOf("\n") + 1);
  return nextHeading === -1
    ? `${source}${section}`
    : `${source.slice(0, nextHeading)}${section}${source.slice(nextHeading)}`;
};

const registryPages = (): DocsPage[] =>
  locales.flatMap((locale) =>
    registryItems.map((item, index) => {
      const meta = getRegistryItemMeta(item);
      const title = item.title ?? item.name;
      const source = withInstallSection(
        item.docs ?? `## Overview\n\n${item.description}`,
        item.name,
      );

      return Schema.decodeUnknownSync(DocsPageSchema)({
        slug: item.name,
        path: `/docs/${item.name}`,
        title,
        description: item.description,
        order: registryPageOrder(index),
        locale,
        section: sectionByGroup[getRegistryGroup(item)],
        type: "reference",
        createdAt: meta?.createdAt?.toISOString(),
        updatedAt: meta?.updatedAt?.toISOString(),
        sourceFile: `src/content/docs/${locale}/registry/${item.name}.mdx`,
        ...compileDocsMarkdown(source),
      });
    }),
  );

export const loadRegistryDocsPages = async () => [
  ...(await loadMdxDocsDirectory("src/content/docs")),
  ...registryPages(),
];

export const loadAgentsPreviewMarkdown = async () =>
  compileMarkdown(await Bun.file("AGENTS.md").text());
