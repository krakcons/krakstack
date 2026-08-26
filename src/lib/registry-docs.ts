import introductionEn from "@/content/docs/en/introduction.mdx?raw";
import notificationsEn from "@/content/docs/en/notifications.mdx?raw";
import servicePersistenceEn from "@/content/docs/en/service-persistence.mdx?raw";
import technologiesEn from "@/content/docs/en/technologies.mdx?raw";
import introductionFr from "@/content/docs/fr/introduction.mdx?raw";
import notificationsFr from "@/content/docs/fr/notifications.mdx?raw";
import servicePersistenceFr from "@/content/docs/fr/service-persistence.mdx?raw";
import technologiesFr from "@/content/docs/fr/technologies.mdx?raw";
import { createMdxDocsSource, makeDocs, type DocsSection } from "@/lib/docs";
import { krakstackRepositories } from "@/lib/krakstack-repositories";
import {
  getRegistryGroup,
  getRegistryItemMeta,
  registryItems,
} from "@/lib/registry";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

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

const introductionFiles = {
  en: ["../content/docs/en/introduction.mdx", introductionEn],
  fr: ["../content/docs/fr/introduction.mdx", introductionFr],
} as const;

const notificationFiles = {
  en: ["../content/docs/en/notifications.mdx", notificationsEn],
  fr: ["../content/docs/fr/notifications.mdx", notificationsFr],
} as const;

const servicePersistenceFiles = {
  en: ["../content/docs/en/service-persistence.mdx", servicePersistenceEn],
  fr: ["../content/docs/fr/service-persistence.mdx", servicePersistenceFr],
} as const;

const technologyFiles = {
  en: ["../content/docs/en/technologies.mdx", technologiesEn],
  fr: ["../content/docs/fr/technologies.mdx", technologiesFr],
} as const;

const files = Object.fromEntries([
  ...locales.map((locale) => introductionFiles[locale]),
  ...locales.map((locale) => technologyFiles[locale]),
  ...locales.map((locale) => servicePersistenceFiles[locale]),
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
        `order: ${registryPageOrder(index)}`,
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
  navigation: (page) => page.slug !== "service-persistence",
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
  sidebarGroups: [
    {
      label: () => m.home_repositories_title(),
      items: krakstackRepositories.map((repository) => ({
        badge: repository.isNew ? () => m.registry_new() : undefined,
        label: repository.title,
        href: repository.href,
        external: true,
      })),
    },
  ],
  resources: {
    label: () => (getLocale() === "fr" ? "Ressources" : "Resources"),
    items: [
      {
        badge: () =>
          m.registry_new({}, { locale: getLocale() === "fr" ? "fr" : "en" }),
        label: () =>
          getLocale() === "fr"
            ? "Persistance des services"
            : "Service Persistence",
        href: "/docs/service-persistence",
      },
      {
        label: () =>
          getLocale() === "fr"
            ? "Configuration développeur"
            : "Developer setup",
        href: "/docs/developer-setup",
      },
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
