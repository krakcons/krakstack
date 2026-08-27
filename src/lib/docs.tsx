import { Schema } from "effect";
import {
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
  forwardRef,
  useDeferredValue,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { AppBrand } from "@/components/ui/app-brand";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/lib/markdown/content";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SearchMenu, type SearchMenuGroup } from "@/components/ui/search-menu";
import { SidebarLayout, type NavGroup } from "@/components/ui/sidebar-layout";
import { createSeo, type SeoDefaults } from "@/lib/seo";

type DocsIconProps = ComponentPropsWithoutRef<"svg"> & {
  absoluteStrokeWidth?: boolean;
  size?: string | number;
};
export type DocsIcon = ForwardRefExoticComponent<
  DocsIconProps & RefAttributes<SVGSVGElement>
>;

const makeIcon = (name: string, paths: ReactNode): DocsIcon => {
  const Icon = forwardRef<SVGSVGElement, DocsIconProps>(
    (
      { absoluteStrokeWidth: _absoluteStrokeWidth, size = 24, ...props },
      ref,
    ) => (
      <svg
        aria-hidden="true"
        fill="none"
        height={size}
        ref={ref}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        {...props}
      >
        {paths}
      </svg>
    ),
  );
  Icon.displayName = name;
  return Icon;
};

const ArrowLeft = makeIcon(
  "ArrowLeft",
  <>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </>,
);
const ArrowRight = makeIcon(
  "ArrowRight",
  <>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </>,
);
const BookOpen = makeIcon(
  "BookOpen",
  <>
    <path d="M12 7v14" />
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4Z" />
  </>,
);
const ChevronDown = makeIcon("ChevronDown", <path d="m6 9 6 6 6-6" />);
const ExternalLink = makeIcon(
  "ExternalLink",
  <>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </>,
);
const Hash = makeIcon(
  "Hash",
  <>
    <line x1="4" x2="20" y1="9" y2="9" />
    <line x1="4" x2="20" y1="15" y2="15" />
    <line x1="10" x2="8" y1="3" y2="21" />
    <line x1="16" x2="14" y1="3" y2="21" />
  </>,
);

export type DocsLocale = string;

export const DocsSection = Schema.String.annotate({
  identifier: "DocsSection",
});

export type DocsSection = typeof DocsSection.Type;

export const DocsPageType = Schema.Literals([
  "concept",
  "tutorial",
  "how-to",
  "reference",
  "runbook",
]).annotate({ identifier: "DocsPageType" });

export type DocsPageType = typeof DocsPageType.Type;

const DocsDate = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((date) =>
      Number.isNaN(new Date(date).getTime())
        ? "Expected a valid date"
        : undefined,
    ),
  ),
);
const NEW_DOCS_PAGE_DAYS = 14;

const isDocsPageNew = (createdAt: string | undefined, now = new Date()) => {
  if (!createdAt) return false;

  const age = now.getTime() - new Date(createdAt).getTime();
  return age >= 0 && age < NEW_DOCS_PAGE_DAYS * 24 * 60 * 60 * 1000;
};

export const DocsFrontmatter = Schema.Struct({
  slug: Schema.String,
  path: Schema.String,
  title: Schema.String,
  description: Schema.String,
  icon: Schema.optional(Schema.String),
  order: Schema.Number,
  locale: Schema.String,
  section: DocsSection,
  type: DocsPageType,
  createdAt: Schema.optional(DocsDate),
  updatedAt: Schema.optional(DocsDate),
  legacySlugs: Schema.optional(Schema.Array(Schema.String)),
  tags: Schema.optional(Schema.Array(Schema.NonEmptyString)),
}).annotate({ identifier: "DocsFrontmatter" });

export const DocsHeadingSchema = Schema.Struct({
  depth: Schema.Literals([2, 3]),
  id: Schema.String,
  title: Schema.String,
}).annotate({ identifier: "DocsHeading" });

export type DocsHeading = typeof DocsHeadingSchema.Type;

export const DocsCodeBlockSchema = Schema.Struct({
  code: Schema.String,
  language: Schema.String,
}).annotate({ identifier: "DocsCodeBlock" });

export const DocsPageSchema = Schema.Struct({
  ...DocsFrontmatter.fields,
  codeBlocks: Schema.Array(DocsCodeBlockSchema),
  headings: Schema.Array(DocsHeadingSchema),
  html: Schema.String,
  searchText: Schema.String,
  sourceFile: Schema.String,
  source: Schema.String,
}).annotate({ identifier: "DocsPage" });

export type DocsPage = typeof DocsPageSchema.Type;

export const slugifyDocsHeading = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

type DocsSourceOptions = {
  locales: ReadonlyArray<DocsLocale>;
  requireLocaleParity?: boolean;
  matchesLocale?: (file: string, locale: DocsLocale) => boolean;
};

export type DocsSourceConfig = DocsSourceOptions & {
  pages: ReadonlyArray<unknown>;
};

const validateDocsPages = (
  pages: ReadonlyArray<DocsPage>,
  config: DocsSourceOptions,
) => {
  const configuredLocales = new Set(config.locales);
  for (const page of pages) {
    if (!configuredLocales.has(page.locale)) {
      throw new Error(
        `${page.sourceFile} uses unconfigured locale ${page.locale}`,
      );
    }
  }

  for (const locale of config.locales) {
    const localized = pages.filter((page) => page.locale === locale);
    const slugs = new Set<string>();
    const paths = new Set<string>();
    const orders = new Set<number>();
    const routeSlugs = new Set<string>();

    for (const page of localized) {
      if (
        config.matchesLocale &&
        !config.matchesLocale(page.sourceFile, locale)
      ) {
        throw new Error(`${page.sourceFile} does not match locale ${locale}`);
      }
      if (!Number.isInteger(page.order) || page.order <= 0) {
        throw new Error(`${page.sourceFile} must use a positive integer order`);
      }
      if (slugs.has(page.slug))
        throw new Error(`Duplicate ${locale} slug ${page.slug}`);
      if (paths.has(page.path))
        throw new Error(`Duplicate ${locale} path ${page.path}`);
      if (orders.has(page.order))
        throw new Error(`Duplicate ${locale} order ${page.order}`);
      if (routeSlugs.has(page.slug))
        throw new Error(`Duplicate ${locale} route slug ${page.slug}`);

      slugs.add(page.slug);
      paths.add(page.path);
      orders.add(page.order);
      routeSlugs.add(page.slug);
      for (const legacySlug of page.legacySlugs ?? []) {
        if (routeSlugs.has(legacySlug)) {
          throw new Error(`Duplicate ${locale} route slug ${legacySlug}`);
        }
        routeSlugs.add(legacySlug);
      }
    }
  }

  if (config.requireLocaleParity !== false && config.locales.length > 1) {
    const baseLocale = config.locales[0];
    const basePages = pages.filter((page) => page.locale === baseLocale);
    for (const locale of config.locales.slice(1)) {
      const localizedBySlug = new Map(
        pages
          .filter((page) => page.locale === locale)
          .map((page) => [page.slug, page]),
      );
      for (const page of basePages) {
        const localized = localizedBySlug.get(page.slug);
        if (!localized) {
          throw new Error(`Missing ${locale} page for ${page.slug}`);
        }
        if (
          page.path !== localized.path ||
          page.order !== localized.order ||
          page.section !== localized.section ||
          page.type !== localized.type ||
          page.icon !== localized.icon ||
          page.createdAt !== localized.createdAt ||
          page.updatedAt !== localized.updatedAt ||
          JSON.stringify(page.tags ?? []) !==
            JSON.stringify(localized.tags ?? []) ||
          JSON.stringify(page.legacySlugs ?? []) !==
            JSON.stringify(localized.legacySlugs ?? [])
        ) {
          throw new Error(
            `Metadata differs between ${baseLocale} and ${locale} for ${page.slug}`,
          );
        }
      }
      if (basePages.length !== localizedBySlug.size) {
        throw new Error(
          `${baseLocale} and ${locale} documentation page counts differ`,
        );
      }
    }
  }

  return pages;
};

export const createDocsSource = (config: DocsSourceConfig) => {
  if (config.locales.length === 0) {
    throw new Error("Documentation source requires at least one locale");
  }
  if (new Set(config.locales).size !== config.locales.length) {
    throw new Error("Documentation source locales must be unique");
  }

  const pages = validateDocsPages(
    config.pages.map((page) => Schema.decodeUnknownSync(DocsPageSchema)(page)),
    config,
  );
  const getPage = (slug: string, locale: DocsLocale) =>
    pages.find((page) => page.slug === slug && page.locale === locale);
  const resolvePage = (slug: string, locale: DocsLocale) =>
    pages.find(
      (page) =>
        page.locale === locale &&
        (page.slug === slug || page.legacySlugs?.includes(slug)),
    );
  const getPages = (locale: DocsLocale) =>
    pages
      .filter((page) => page.locale === locale)
      .sort((left, right) => left.order - right.order);
  const getPageNeighbors = (slug: string, locale: DocsLocale) => {
    const localized = getPages(locale);
    const index = localized.findIndex((page) => page.slug === slug);

    return {
      previous: index > 0 ? localized[index - 1] : undefined,
      next:
        index >= 0 && index < localized.length - 1
          ? localized[index + 1]
          : undefined,
    };
  };

  return {
    locales: config.locales,
    pages,
    getPage,
    getPageNeighbors,
    getPages,
    resolvePage,
  };
};

export type DocsSource = ReturnType<typeof createDocsSource>;

export type DocsSearchResult = {
  page: DocsPage;
  heading?: DocsHeading;
};

export type DocsConfig = {
  source: DocsSource;
  basePath: `/${string}`;
  defaultSlug: string;
  origin: `http://${string}` | `https://${string}`;
  siteName: string;
  defaultLocale?: DocsLocale;
  messages?: (locale: DocsLocale) => DocsMessageOverrides;
  icons?: Readonly<Record<string, DocsIcon>>;
  navigate?: (href: string) => void;
  brand?: {
    label: string;
    subtitle: () => string;
    icon: DocsIcon;
    href: string;
  };
  resources?: {
    label: () => string;
    items: ReadonlyArray<DocsResource>;
  };
  sidebarGroups?: ReadonlyArray<{
    label: () => string;
    items: ReadonlyArray<DocsResource>;
  }>;
  githubLabel?: string;
  sectionOrder?: ReadonlyArray<DocsSection>;
  navigation?: (page: DocsPage) => boolean;
  github?: {
    url: `https://${string}`;
    branch?: string;
  };
  editable?: (page: DocsPage) => boolean;
};

export const makeDocs = (config: DocsConfig) => {
  const { source } = config;
  const basePath = config.basePath.replace(/\/$/, "");
  const origin = config.origin.replace(/\/$/, "");
  const githubUrl = config.github?.url.replace(/\/$/, "");
  const brand = config.brand ?? {
    label: config.siteName,
    subtitle: () => "Documentation",
    icon: BookOpen,
    href: "/",
  };
  const seoDefaults: SeoDefaults = {
    origin,
    locales: source.locales,
    siteName: config.siteName,
  };
  if (config.defaultLocale) seoDefaults.defaultLocale = config.defaultLocale;
  const docsSeo = createSeo(seoDefaults);
  const getMessages = (locale: DocsLocale) =>
    getDocsMessages(locale, config.messages?.(locale));
  const navigate =
    config.navigate ?? ((href: string) => window.location.assign(href));
  const normalizeSearchText = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const searchIndex = source.pages.flatMap((page) => {
    const description = normalizeSearchText(
      `${page.description} ${(page.tags ?? []).join(" ")}`,
    );
    return [
      {
        page,
        title: normalizeSearchText(page.title),
        description,
        content: normalizeSearchText(page.searchText),
      },
      ...page.headings.map((heading) => ({
        page,
        heading,
        title: normalizeSearchText(heading.title),
        description: `${normalizeSearchText(page.title)} ${description}`,
        content: "",
      })),
    ];
  });

  for (const page of source.pages) {
    const expectedPath =
      page.slug === config.defaultSlug ? basePath : `${basePath}/${page.slug}`;
    if (page.path !== expectedPath) {
      throw new Error(`${page.sourceFile} must use path ${expectedPath}`);
    }
    if (page.icon && !config.icons?.[page.icon]) {
      throw new Error(`${page.sourceFile} uses unconfigured icon ${page.icon}`);
    }
  }

  const pages = (locale: DocsLocale) => source.getPages(locale);
  const sections = (locale: DocsLocale) => {
    const localized = pages(locale).filter(
      (page) => config.navigation?.(page) ?? true,
    );
    const ids = Array.from(new Set(localized.map((page) => page.section)));
    const configuredOrder = config.sectionOrder ?? [];
    const orderedIds = [
      ...configuredOrder.filter((section) => ids.includes(section)),
      ...ids.filter((section) => !configuredOrder.includes(section)),
    ];

    return orderedIds.map((id) => ({
      id,
      pages: localized.filter((page) => page.section === id),
    }));
  };
  const resolve = (routeSlug: string | undefined, locale: DocsLocale) => {
    const requestedSlug = routeSlug ?? config.defaultSlug;
    const page = source.resolvePage(requestedSlug, locale);
    if (!page) return undefined;

    return {
      page,
      canonical:
        routeSlug === undefined
          ? page.slug === config.defaultSlug
          : routeSlug === page.slug && page.slug !== config.defaultSlug,
      neighbors: source.getPageNeighbors(page.slug, locale),
    };
  };
  const search = (
    query: string,
    locale: DocsLocale,
    options?: { limit?: number },
  ): DocsSearchResult[] => {
    const normalizedQuery = normalizeSearchText(query).trim();
    const limit = options?.limit ?? 20;
    const localized = searchIndex.filter(
      (entry) => entry.page.locale === locale,
    );
    if (!normalizedQuery) {
      return localized
        .filter((entry) => !("heading" in entry))
        .slice(0, limit)
        .map(({ page }) => ({ page }));
    }

    const terms = normalizedQuery.split(/\s+/);
    return localized
      .flatMap((entry) => {
        let score = 0;
        for (const term of terms) {
          if (entry.title === term) score += 100;
          else if (entry.title.startsWith(term)) score += 50;
          else if (entry.title.includes(term)) score += 25;
          else if (entry.description.includes(term)) score += 10;
          else if (entry.content.includes(term)) score += 1;
          else return [];
        }
        if (entry.title.includes(normalizedQuery)) score += 20;

        return [{ entry, score }];
      })
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.entry.page.order - right.entry.page.order,
      )
      .slice(0, limit)
      .map(({ entry }) => {
        const result: DocsSearchResult = { page: entry.page };
        if ("heading" in entry) result.heading = entry.heading;
        return result;
      });
  };
  const url = (page: DocsPage, locale: DocsLocale) =>
    `${origin}/${locale}${page.path}`;
  const editUrl = (page: DocsPage) =>
    githubUrl && (config.editable?.(page) ?? true)
      ? `${githubUrl}/edit/${config.github?.branch ?? "main"}/${page.sourceFile}`
      : undefined;
  const getHead = ({
    locale,
    page,
  }: {
    locale: DocsLocale;
    page?: DocsPage;
  }) => {
    const resolvedMessages = getMessages(locale);
    const path = page?.path ?? basePath;
    const title = `${page?.title ?? resolvedMessages.title} | ${config.siteName}`;
    const description = page?.description ?? resolvedMessages.description;
    return docsSeo({
      title,
      description,
      path,
      locale,
      type: "article",
    });
  };

  return {
    basePath,
    brand,
    defaultSlug: config.defaultSlug,
    editUrl,
    githubUrl,
    githubLabel: config.githubLabel ?? "GitHub",
    icons: config.icons ?? {},
    navigate,
    getHead,
    getMessages,
    origin,
    resources: config.resources,
    sidebarGroups: config.sidebarGroups,
    source,
    pages,
    resolve,
    search,
    sections,
    url,
  };
};

export type DocsCatalog = ReturnType<typeof makeDocs>;

export type DocsRouteMessages = {
  title: string;
  description: string;
  copied: string;
  copyCode: string;
  copyLink: string;
  copyTable: string;
  downloadTable: string;
  onThisPage: string;
  searchTitle: string;
  searchDescription: string;
  searchPlaceholder: string;
  searchInputPlaceholder: string;
  searchEmpty: string;
  skipToContent: string;
  editPage: string;
  latestVersionNotice: string;
  pageNavigation: string;
  previous: string;
  next: string;
  notFoundTitle: string;
  notFoundDescription: string;
  notFoundAction: string;
  newLabel: string;
  lastUpdated: (date: Date) => string;
  sectionLabel: (section: DocsSection) => string;
  pageTypeLabel: (type: DocsPageType) => string;
};

export type DocsMessageOverrides = Partial<DocsRouteMessages>;

const humanizeDocsValue = (value: string) =>
  value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const docsSectionMessages = {
  en: {
    start: "Getting started",
    integration: "Integration",
    frontend: "Frontend",
    backend: "Backend",
    administration: "Administration",
    operations: "Operations",
    reference: "Reference",
  },
  fr: {
    start: "Bien démarrer",
    integration: "Intégration",
    frontend: "Interface utilisateur",
    backend: "Serveur",
    administration: "Administration",
    operations: "Exploitation",
    reference: "Référence",
  },
} as const;

const docsPageTypeMessages = {
  en: {
    concept: "Concept",
    tutorial: "Tutorial",
    "how-to": "How-to guide",
    reference: "Reference",
    runbook: "Runbook",
  },
  fr: {
    concept: "Concept",
    tutorial: "Tutoriel",
    "how-to": "Guide pratique",
    reference: "Référence",
    runbook: "Procédure d’exploitation",
  },
} as const;

const defaultSectionLabel = (locale: "en" | "fr", section: DocsSection) =>
  Object.entries(docsSectionMessages[locale]).find(
    ([key]) => key === section,
  )?.[1] ?? humanizeDocsValue(section);

const messages = {
  en: {
    title: "Documentation",
    description: "Guides and technical reference.",
    copied: "Copied",
    copyCode: "Copy code",
    copyLink: "Copy link",
    copyTable: "Copy table",
    downloadTable: "Download table",
    onThisPage: "On this page",
    searchTitle: "Search documentation",
    searchDescription: "Search documentation pages and headings.",
    searchPlaceholder: "Search documentation...",
    searchInputPlaceholder: "Search documentation...",
    searchEmpty: "No documentation found.",
    skipToContent: "Skip to content",
    editPage: "Edit this page",
    latestVersionNotice: "Documentation for the latest version.",
    pageNavigation: "Documentation pages",
    previous: "Previous",
    next: "Next",
    notFoundTitle: "Documentation page not found",
    notFoundDescription:
      "The requested documentation page does not exist or has moved.",
    notFoundAction: "Return to documentation",
    newLabel: "New",
    lastUpdated: (date) =>
      `Last updated ${new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(date)}`,
    sectionLabel: (section) => defaultSectionLabel("en", section),
    pageTypeLabel: (type) => docsPageTypeMessages.en[type],
  },
  fr: {
    title: "Documentation",
    description: "Guides et référence technique.",
    copied: "Copié",
    copyCode: "Copier le code",
    copyLink: "Copier le lien",
    copyTable: "Copier le tableau",
    downloadTable: "Télécharger le tableau",
    onThisPage: "Sur cette page",
    searchTitle: "Rechercher dans la documentation",
    searchDescription:
      "Recherchez des pages et des sections dans la documentation.",
    searchPlaceholder: "Rechercher dans la documentation...",
    searchInputPlaceholder: "Rechercher dans la documentation...",
    searchEmpty: "Aucune documentation trouvée.",
    skipToContent: "Aller au contenu",
    editPage: "Modifier cette page",
    latestVersionNotice: "Documentation de la dernière version.",
    pageNavigation: "Pages de documentation",
    previous: "Précédent",
    next: "Suivant",
    notFoundTitle: "Page de documentation introuvable",
    notFoundDescription:
      "La page de documentation demandée n’existe pas ou a été déplacée.",
    notFoundAction: "Retourner à la documentation",
    newLabel: "Nouveau",
    lastUpdated: (date) =>
      `Dernière mise à jour le ${new Intl.DateTimeFormat("fr", { dateStyle: "long" }).format(date)}`,
    sectionLabel: (section) => defaultSectionLabel("fr", section),
    pageTypeLabel: (type) => docsPageTypeMessages.fr[type],
  },
} satisfies Record<"en" | "fr", DocsRouteMessages>;

export const getDocsMessages = (
  locale: DocsLocale,
  overrides?: DocsMessageOverrides,
): DocsRouteMessages => ({
  ...(locale.startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

export type DocsResource = {
  badge?: () => string;
  label: () => string;
  href: string;
  external?: boolean;
};

export type DocsResolution = NonNullable<ReturnType<DocsCatalog["resolve"]>>;

const EmptyIcon = forwardRef<SVGSVGElement, DocsIconProps>(() => null);

const iconFor = (
  icons: Readonly<Record<string, DocsIcon>>,
  name: string | undefined,
) => (name ? (icons[name] ?? EmptyIcon) : EmptyIcon);

const DocsArticle = ({
  messages,
  page,
}: {
  messages: DocsRouteMessages;
  page: DocsPage;
}) => {
  return (
    <MarkdownContent
      codeBlocks={page.codeBlocks}
      html={page.html}
      messages={{ copy: messages.copyCode, copied: messages.copied }}
    />
  );
};

const useActiveDocsHeading = (headings: ReadonlyArray<DocsHeading>) => {
  const [activeHeadingId, setActiveHeadingId] = useState(headings[0]?.id);

  useEffect(() => {
    const elements = headings.flatMap((heading) => {
      const element = document.getElementById(heading.id);
      return element ? [element] : [];
    });
    if (elements.length === 0) return;

    let frame: number | undefined;
    const updateActiveHeading = () => {
      let activeId = elements[0].id;

      for (const element of elements) {
        if (element.getBoundingClientRect().top > 96) break;
        activeId = element.id;
      }

      const isAtPageEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 1;
      setActiveHeadingId(
        isAtPageEnd ? elements[elements.length - 1].id : activeId,
      );
    };
    const scheduleUpdate = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveHeading);
    };

    updateActiveHeading();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [headings]);

  return activeHeadingId;
};

const DocsTableOfContentsItems = ({
  headings,
}: {
  headings: ReadonlyArray<DocsHeading>;
}) => {
  const activeHeadingId = useActiveDocsHeading(headings);

  return (
    <ol className="border-l">
      {headings.map((heading) => {
        const isActive = heading.id === activeHeadingId;

        return (
          <li key={heading.id}>
            <a
              aria-current={isActive ? "location" : undefined}
              className={`hover:text-foreground -ml-px block border-l py-1.5 text-sm leading-5 transition-colors ${
                isActive
                  ? "border-primary text-foreground font-medium"
                  : "text-muted-foreground border-transparent"
              } ${heading.depth === 3 ? "pl-6" : "pl-4"}`}
              href={`#${heading.id}`}
            >
              {heading.title}
            </a>
          </li>
        );
      })}
    </ol>
  );
};

const DocsTableOfContents = ({
  headings,
  label,
}: {
  headings: ReadonlyArray<DocsHeading>;
  label: string;
}) => {
  if (headings.length === 0) return null;

  return (
    <nav
      aria-label={label}
      className="fixed top-20 max-h-[calc(100svh-6rem)] w-56 overflow-y-auto"
    >
      <p className="text-foreground mb-3 text-sm font-semibold">{label}</p>
      <DocsTableOfContentsItems headings={headings} />
    </nav>
  );
};

const DocsMobileTableOfContents = ({
  headings,
  label,
}: {
  headings: ReadonlyArray<DocsHeading>;
  label: string;
}) => {
  if (headings.length === 0) return null;

  return (
    <Collapsible className="mb-8 overflow-hidden rounded-lg border xl:hidden">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between p-4 text-left text-sm font-semibold">
        <span>{label}</span>
        <ChevronDown className="text-muted-foreground size-4 transition-transform group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pt-1 pb-4">
        <nav aria-label={label}>
          <DocsTableOfContentsItems headings={headings} />
        </nav>
      </CollapsibleContent>
    </Collapsible>
  );
};

const DocsSearch = ({
  docs,
  locale,
  messages,
}: {
  docs: DocsCatalog;
  locale: DocsLocale;
  messages: DocsRouteMessages;
}) => {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const results = docs.search(deferredQuery, locale);
  const isSearching = deferredQuery.trim().length > 0;
  const sections = isSearching
    ? Array.from(new Set(results.map(({ page }) => page.section)))
    : docs
        .sections(locale)
        .map(({ id }) => id)
        .filter((section) =>
          results.some(({ page }) => page.section === section),
        );
  const groups: SearchMenuGroup[] = sections.map((section) => {
    const sectionResults = results.filter(
      ({ page }) => page.section === section,
    );
    if (!isSearching) {
      sectionResults.sort((left, right) => {
        const pageOrder = left.page.order - right.page.order;
        if (pageOrder !== 0) return pageOrder;
        if (!left.heading) return -1;
        if (!right.heading) return 1;
        return (
          left.page.headings.findIndex(({ id }) => id === left.heading?.id) -
          right.page.headings.findIndex(({ id }) => id === right.heading?.id)
        );
      });
    }

    return {
      heading: messages.sectionLabel(section),
      items: sectionResults.map(({ page, heading }) =>
        heading
          ? {
              id: `${page.path}#${heading.id}`,
              label: heading.title,
              description: page.title,
              icon: <Hash className="size-4" />,
              onSelect: () => docs.navigate(`${page.path}#${heading.id}`),
            }
          : (() => {
              const item: SearchMenuGroup["items"][number] = {
                id: page.path,
                label: page.title,
                description: page.description,
                onSelect: () => docs.navigate(page.path),
              };
              if (page.icon) {
                const PageIcon = iconFor(docs.icons, page.icon);
                item.icon = <PageIcon className="size-4" />;
              }
              return item;
            })(),
      ),
    };
  });

  return (
    <SearchMenu
      groups={groups}
      messages={{
        title: messages.searchTitle,
        description: messages.searchDescription,
        placeholder: messages.searchPlaceholder,
        inputPlaceholder: messages.searchInputPlaceholder,
        emptyMessage: messages.searchEmpty,
      }}
      query={query}
      onQueryChange={setQuery}
      shouldFilter={false}
    />
  );
};

export type DocsLayoutProps = {
  children: ReactNode;
  docs: DocsCatalog;
  headerActions?: ReactNode;
  locale: DocsLocale;
};

export const DocsLayout = ({
  children,
  docs,
  headerActions,
  locale,
}: DocsLayoutProps) => {
  const { brand, resources, sidebarGroups } = docs;
  const resolvedMessages = docs.getMessages(locale);
  const groups: NavGroup[] = docs.sections(locale).map((section) => ({
    label: () => resolvedMessages.sectionLabel(section.id),
    items: section.pages.map((item) => {
      const navItem: NavGroup["items"][number] = {
        label: () => item.title,
        href: item.path,
        icon: iconFor(docs.icons, item.icon),
      };
      if (isDocsPageNew(item.createdAt)) {
        navItem.badge = () => resolvedMessages.newLabel;
      }
      return navItem;
    }),
  }));

  if (sidebarGroups) {
    groups.push(
      ...sidebarGroups.map((group) => ({
        label: group.label,
        items: group.items.map((item) => ({
          badge: item.badge,
          label: item.label,
          href: item.href,
          icon: EmptyIcon,
          external: item.external,
        })),
      })),
    );
  }

  if (resources) {
    groups.push({
      label: resources.label,
      items: [
        ...resources.items.map((item) => ({
          badge: item.badge,
          label: item.label,
          href: item.href,
          icon: EmptyIcon,
          external: item.external,
        })),
        ...(docs.githubUrl
          ? [
              {
                label: () => docs.githubLabel,
                href: docs.githubUrl,
                icon: EmptyIcon,
                external: true,
              },
            ]
          : []),
      ],
    });
  }

  return (
    <SidebarLayout
      groups={groups}
      sidebarHeader={
        <AppBrand
          label={brand.label}
          subtitle={brand.subtitle()}
          icon={brand.icon}
          href={brand.href}
          variant="sidebar"
        />
      }
      headerActions={
        <>
          {docs.githubUrl ? (
            <a
              className="text-muted-foreground hover:text-foreground hidden items-center gap-1.5 text-sm lg:flex"
              href={docs.githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              {docs.githubLabel}
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
          <DocsSearch docs={docs} locale={locale} messages={resolvedMessages} />
          {headerActions}
        </>
      }
    >
      {children}
    </SidebarLayout>
  );
};

export type DocsPageProps = {
  children?: ReactNode;
  docs: DocsCatalog;
  resolution: DocsResolution;
};

type DocsPageSectionProps = Omit<DocsPageProps, "children">;

export const DocsHeader = ({ docs, resolution }: DocsPageSectionProps) => {
  const { page } = resolution;
  const resolvedMessages = docs.getMessages(page.locale);

  return (
    <header className="mb-8 border-b pb-8">
      <p className="text-primary mb-3 font-mono text-xs font-semibold tracking-[0.18em] uppercase">
        {resolvedMessages.sectionLabel(page.section)} ·{" "}
        {resolvedMessages.pageTypeLabel(page.type)}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {page.title}
        </h1>
        {page.tags?.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
      <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
        {page.description}
      </p>
      {page.updatedAt ? (
        <p className="text-muted-foreground mt-3 text-sm">
          {resolvedMessages.lastUpdated(new Date(page.updatedAt))}
        </p>
      ) : null}
    </header>
  );
};

export const DocsContent = ({ docs, resolution }: DocsPageSectionProps) => {
  const { page } = resolution;
  const resolvedMessages = docs.getMessages(page.locale);

  return (
    <>
      <DocsMobileTableOfContents
        headings={page.headings}
        label={resolvedMessages.onThisPage}
      />
      <DocsArticle messages={resolvedMessages} page={page} />
    </>
  );
};

export const DocsFooter = ({ docs, resolution }: DocsPageSectionProps) => {
  const { page, neighbors } = resolution;
  const resolvedMessages = docs.getMessages(page.locale);
  const editUrl = docs.editUrl(page);

  return (
    <footer className="mt-14 border-t pt-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 text-sm">
        {editUrl ? (
          <a
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            href={editUrl}
            target="_blank"
            rel="noreferrer"
          >
            {resolvedMessages.editPage}
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
        <span className="text-muted-foreground">
          {resolvedMessages.latestVersionNotice}
        </span>
      </div>
      <nav
        aria-label={resolvedMessages.pageNavigation}
        className="grid gap-3 sm:grid-cols-2"
      >
        {neighbors.previous ? (
          <a
            className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
            href={neighbors.previous.path}
          >
            <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium uppercase">
              <ArrowLeft className="size-3.5" />
              {resolvedMessages.previous}
            </span>
            <span className="mt-1 block font-semibold">
              {neighbors.previous.title}
            </span>
          </a>
        ) : (
          <span />
        )}
        {neighbors.next ? (
          <a
            className="hover:bg-muted/50 rounded-lg border p-4 text-right transition-colors"
            href={neighbors.next.path}
          >
            <span className="text-muted-foreground flex items-center justify-end gap-1 text-xs font-medium uppercase">
              {resolvedMessages.next}
              <ArrowRight className="size-3.5" />
            </span>
            <span className="mt-1 block font-semibold">
              {neighbors.next.title}
            </span>
          </a>
        ) : null}
      </nav>
    </footer>
  );
};

export const DocsPage = ({ children, docs, resolution }: DocsPageProps) => {
  const { page } = resolution;
  const resolvedMessages = docs.getMessages(page.locale);
  const content = children ?? (
    <>
      <DocsHeader docs={docs} resolution={resolution} />
      <DocsContent docs={docs} resolution={resolution} />
      <DocsFooter docs={docs} resolution={resolution} />
    </>
  );

  return (
    <>
      <a
        className="bg-background focus:ring-ring fixed top-2 left-2 z-50 -translate-y-20 rounded-md border px-3 py-2 text-sm shadow-sm focus:translate-y-0 focus:ring-2"
        href="#docs-content"
      >
        {resolvedMessages.skipToContent}
      </a>
      <div className="mx-auto grid w-full max-w-6xl gap-10 xl:grid-cols-[minmax(0,48rem)_14rem]">
        <article id="docs-content" className="min-w-0 pb-16" tabIndex={-1}>
          {content}
        </article>
        <aside className="hidden xl:block">
          <DocsTableOfContents
            headings={page.headings}
            label={resolvedMessages.onThisPage}
          />
        </aside>
      </div>
    </>
  );
};

export const DocsNotFound = ({
  docs,
  locale,
}: {
  docs: DocsCatalog;
  locale: DocsLocale;
}) => {
  const resolvedMessages = docs.getMessages(locale);
  const BrandIcon = docs.brand.icon;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 text-center">
      <BrandIcon className="text-primary mx-auto size-10" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        {resolvedMessages.notFoundTitle}
      </h1>
      <p className="text-muted-foreground mt-3 leading-7">
        {resolvedMessages.notFoundDescription}
      </p>
      <a
        className="text-primary mt-6 font-semibold underline underline-offset-4"
        href={docs.basePath}
      >
        {resolvedMessages.notFoundAction}
      </a>
    </main>
  );
};
