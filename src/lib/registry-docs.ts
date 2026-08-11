import { createMdxDocsSource, makeDocs, type DocsSection } from "@/lib/docs";
import { krakstackSites } from "@/lib/krakstack-sites";
import { getRegistryGroup, registryItems } from "@/lib/registry";
import { getLocale } from "@/paraglide/runtime";

const locales = ["en", "fr"] as const;

const sectionByGroup = {
  Components: "components",
  Configuration: "configuration",
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

const files = Object.fromEntries(
  locales.flatMap((locale) =>
    registryItems.map((item, index) => {
      const section = sectionByGroup[getRegistryGroup(item)];
      const title = item.title ?? item.name;
      const content = withInstallSection(
        item.docs ?? `## Overview\n\n${item.description}`,
        item.name,
      );
      const documentedContent =
        item.name === "docs"
          ? content.replace(
              "\n## Content Sources",
              `\n## Configure Tailwind\n\nAdd these sources to the application's global stylesheet so Tailwind generates the utility classes used by Streamdown and its code plugin. Paths are relative to the stylesheet and may need additional \`../\` segments in a monorepo.\n\n\`\`\`css\n@source "../node_modules/streamdown/dist/*.js";\n@source "../node_modules/@streamdown/code/dist/*.js";\n\`\`\`\n\n## Content Sources`,
            )
          : content;
      const source = [
        "---",
        `slug: ${JSON.stringify(item.name)}`,
        `path: ${JSON.stringify(index === 0 ? "/docs" : `/docs/${item.name}`)}`,
        `title: ${JSON.stringify(title)}`,
        `description: ${JSON.stringify(item.description)}`,
        `order: ${index + 1}`,
        `locale: ${locale}`,
        `section: ${section}`,
        "type: reference",
        "---",
        "",
        `# ${title}`,
        "",
        documentedContent,
      ].join("\n");

      return [`../content/docs/${locale}/registry/${item.name}.mdx`, source];
    }),
  ),
);

const source = createMdxDocsSource({ files, locales });

const sectionLabels = {
  en: {
    components: "Components",
    configuration: "Configuration",
    libraries: "Libraries",
    notifications: "Notifications",
    registry: "Registry",
    services: "Services",
  },
  fr: {
    components: "Composants",
    configuration: "Configuration",
    libraries: "Bibliothèques",
    notifications: "Notifications",
    registry: "Registre",
    services: "Services",
  },
} as const;

export const registryDocs = makeDocs({
  source,
  basePath: "/docs",
  defaultSlug: "search-menu",
  defaultLocale: "en",
  origin: "https://krakstack.net",
  siteName: "KrakStack Registry",
  sectionOrder: [
    "components",
    "libraries",
    "services",
    "notifications",
    "configuration",
    "registry",
  ],
  brand: {
    label: "KrakStack",
    subtitle: () => "Documentation",
    icon: "lucide:blocks",
    href: "/",
  },
  resources: {
    label: () => (getLocale() === "fr" ? "Ressources" : "Resources"),
    items: [
      {
        label: () =>
          getLocale() === "fr"
            ? "Configuration développeur"
            : "Developer setup",
        href: "/docs/developer-setup",
        icon: "lucide:wrench",
      },
      ...krakstackSites.map((site) => ({
        label: site.title,
        href: site.docsHref,
        icon: "lucide:globe",
      })),
    ],
  },
  messages: (locale) => ({
    title: locale === "fr" ? "Registre" : "Registry",
    description:
      locale === "fr"
        ? "Composants, bibliothèques et services prêts à installer."
        : "Installable components, libraries, and services.",
    sectionLabel: (section) =>
      sectionLabels[locale === "fr" ? "fr" : "en"][
        section as keyof (typeof sectionLabels)["en"]
      ] ?? section,
  }),
});
