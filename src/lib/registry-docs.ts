import { Blocks } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import { Schema } from "effect";

import { createDocsSource, makeDocs } from "@krak-stack/registry/docs";
import { krakstackRepositories } from "@/lib/krakstack-repositories";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import {
  indexToRegistryDocsPages,
  RegistryDocsPageRequest,
  toRegistryDocsIndex,
} from "./registry-docs.schema";

const locales = ["en", "fr"] as const;

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

export const makeRegistryDocs = (pages: ReadonlyArray<unknown>) =>
  makeDocs({
    source: createDocsSource({ pages, locales }),
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
      icon: Blocks,
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
          Object.entries(labels).find(([key]) => key === section)?.[1] ??
          section
        );
      },
    }),
  });

export const registryDocsShell = makeRegistryDocs([]);

const fetchRegistryDocsPages = createServerFn({ method: "GET" }).handler(
  async () => {
    if (import.meta.env.PROD) {
      return (await import("./registry-docs.compiled"))
        .compiledRegistryDocsPages;
    }
    const { loadRegistryDocsPages } = await import("./registry-docs.server");
    return indexToRegistryDocsPages(
      toRegistryDocsIndex(await loadRegistryDocsPages()),
    );
  },
);

export const getRegistryDocsPages = async () => {
  if (import.meta.env.DEV) return fetchRegistryDocsPages();
  return (await import("./registry-docs.compiled")).compiledRegistryDocsPages;
};

const fetchRegistryDocsPage = createServerFn({ method: "GET" })
  .validator(Schema.toStandardSchemaV1(RegistryDocsPageRequest))
  .handler(async ({ data }) => {
    if (import.meta.env.PROD) {
      const { loadCompiledRegistryDocsPage } =
        await import("./registry-docs.compiled");
      return loadCompiledRegistryDocsPage(data.slug, data.locale);
    }
    const { loadRegistryDocsPages } = await import("./registry-docs.server");
    return (await loadRegistryDocsPages()).find(
      (page) => page.slug === data.slug && page.locale === data.locale,
    );
  });

export const getRegistryDocsPage = async (
  data: typeof RegistryDocsPageRequest.Type,
) => {
  if (import.meta.env.DEV) return fetchRegistryDocsPage({ data });
  const { loadCompiledRegistryDocsPage } =
    await import("./registry-docs.compiled");
  return loadCompiledRegistryDocsPage(data.slug, data.locale);
};

const fetchAgentsPreviewMarkdown = createServerFn({
  method: "GET",
}).handler(async () => {
  if (import.meta.env.PROD) {
    return (
      await import("./registry-docs.compiled")
    ).loadCompiledAgentsPreview();
  }
  const { loadAgentsPreviewMarkdown } = await import("./registry-docs.server");
  return loadAgentsPreviewMarkdown();
});

export const getAgentsPreviewMarkdown = async () => {
  if (import.meta.env.DEV) return fetchAgentsPreviewMarkdown();
  return (await import("./registry-docs.compiled")).loadCompiledAgentsPreview();
};
