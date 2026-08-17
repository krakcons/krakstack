import introductionEn from "@/content/docs/en/introduction.mdx?raw";
import notificationsEn from "@/content/docs/en/notifications.mdx?raw";
import technologiesEn from "@/content/docs/en/technologies.mdx?raw";
import introductionFr from "@/content/docs/fr/introduction.mdx?raw";
import notificationsFr from "@/content/docs/fr/notifications.mdx?raw";
import technologiesFr from "@/content/docs/fr/technologies.mdx?raw";
import { createMdxDocsSource, makeDocs, type DocsSection } from "@/lib/docs";
import { krakstackSites } from "@/lib/krakstack-sites";
import {
  getRegistryGroup,
  getRegistryItemMeta,
  registryItems,
} from "@/lib/registry";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

const locales = ["en", "fr"] as const;
const notificationGuideOrder = 17;

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

const introductionFiles = {
  en: ["../content/docs/en/introduction.mdx", introductionEn],
  fr: ["../content/docs/fr/introduction.mdx", introductionFr],
} as const;

const notificationFiles = {
  en: ["../content/docs/en/notifications.mdx", notificationsEn],
  fr: ["../content/docs/fr/notifications.mdx", notificationsFr],
} as const;

const technologyFiles = {
  en: ["../content/docs/en/technologies.mdx", technologiesEn],
  fr: ["../content/docs/fr/technologies.mdx", technologiesFr],
} as const;

const files = Object.fromEntries([
  ...locales.map((locale) => introductionFiles[locale]),
  ...locales.map((locale) => technologyFiles[locale]),
  ...locales.map((locale) => notificationFiles[locale]),
  ...locales.flatMap((locale) =>
    registryItems.map((item, index) => {
      const section = sectionByGroup[getRegistryGroup(item)];
      const meta = getRegistryItemMeta(item);
      const title = item.title ?? item.name;
      const content = withInstallSection(
        item.docs ?? `## Overview\n\n${item.description}`,
        item.name,
      );
      const documentedContent =
        item.name === "docs"
          ? content.replace(
              "\n## Content Sources",
              '\n## Configure Tailwind\n\nAdd these sources to the application\'s global stylesheet so Tailwind generates the utility classes used by Streamdown and its code plugin. Paths are relative to the stylesheet and may need additional `../` segments in a monorepo.\n\n```css\n@source "../node_modules/streamdown/dist/*.js";\n@source "../node_modules/@streamdown/code/dist/*.js";\n```\n\n## Content Sources',
            )
          : content;
      const source = [
        "---",
        `slug: ${JSON.stringify(item.name)}`,
        `path: ${JSON.stringify(`/docs/${item.name}`)}`,
        `title: ${JSON.stringify(title)}`,
        `description: ${JSON.stringify(item.description)}`,
        `order: ${index + 3 >= notificationGuideOrder ? index + 4 : index + 3}`,
        `locale: ${locale}`,
        `section: ${section}`,
        "type: reference",
        ...(meta?.createdAt
          ? [`createdAt: ${JSON.stringify(meta.createdAt.toISOString())}`]
          : []),
        ...(meta?.updatedAt
          ? [`updatedAt: ${JSON.stringify(meta.updatedAt.toISOString())}`]
          : []),
        "---",
        "",
        `# ${title}`,
        "",
        documentedContent,
      ].join("\n");

      return [`../content/docs/${locale}/registry/${item.name}.mdx`, source];
    }),
  ),
]);

const source = createMdxDocsSource({ files, locales });

const sectionLabels = {
  en: {
    "getting-started": "Getting started",
    components: "Components",
    configuration: "Configuration",
    layers: "Layers",
    libraries: "Libraries",
    notifications: "Notifications",
    registry: "Registry",
    services: "Services",
  },
  fr: {
    "getting-started": "Pour commencer",
    components: "Composants",
    configuration: "Configuration",
    layers: "Couches",
    libraries: "Bibliothèques",
    notifications: "Notifications",
    registry: "Registre",
    services: "Services",
  },
} as const;

export const registryDocs = makeDocs({
  source,
  basePath: "/docs",
  defaultSlug: "introduction",
  defaultLocale: "en",
  origin: "https://krakstack.net",
  siteName: "KrakStack Registry",
  github: {
    url: "https://github.com/krakcons/krakstack-site",
  },
  editable: (page) => !page.sourceFile.includes("/registry/"),
  sectionOrder: [
    "getting-started",
    "components",
    "libraries",
    "layers",
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
    newLabel: m.registry_new({}, { locale: locale === "fr" ? "fr" : "en" }),
    lastUpdated: (date) =>
      m.registry_last_updated(
        {
          date: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
            date,
          ),
        },
        { locale: locale === "fr" ? "fr" : "en" },
      ),
    sectionLabel: (section) => {
      const labels = sectionLabels[locale === "fr" ? "fr" : "en"];
      return (
        Object.entries(labels).find(([key]) => key === section)?.[1] ?? section
      );
    },
  }),
});
