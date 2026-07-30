import { icons as lucideIcons } from "@iconify-json/lucide";
import { Icon, addCollection } from "@iconify/react";
import { code } from "@streamdown/code";
import { Link, useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";
import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Children,
  forwardRef,
  useDeferredValue,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Streamdown, type Components, type ExtraProps } from "streamdown";
import { parse } from "yaml";

import { AppBrand } from "@/components/ui/app-brand";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SearchMenu, type SearchMenuGroup } from "@/components/ui/search-menu";
import { SidebarLayout, type NavGroup } from "@/components/ui/sidebar-layout";

addCollection(lucideIcons);

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

export const DocsFrontmatter = Schema.Struct({
  slug: Schema.String,
  path: Schema.String,
  title: Schema.String,
  description: Schema.String,
  icon: Schema.String,
  order: Schema.Number,
  locale: Schema.String,
  section: DocsSection,
  type: DocsPageType,
  legacySlugs: Schema.optional(Schema.Array(Schema.String)),
}).annotate({ identifier: "DocsFrontmatter" });

export const DocsHeadingSchema = Schema.Struct({
  depth: Schema.Literals([2, 3]),
  id: Schema.String,
  title: Schema.String,
}).annotate({ identifier: "DocsHeading" });

export type DocsHeading = typeof DocsHeadingSchema.Type;

export const DocsPageSchema = Schema.Struct({
  ...DocsFrontmatter.fields,
  headings: Schema.Array(DocsHeadingSchema),
  searchText: Schema.String,
  sourceFile: Schema.String,
  source: Schema.String,
}).annotate({ identifier: "DocsPage" });

export type DocsPage = typeof DocsPageSchema.Type;

const contentFiles = import.meta.glob<string>("../content/docs/**/*.mdx", {
  eager: true,
  import: "default",
  query: "?raw",
});

export const slugifyDocsHeading = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const stripMarkdown = (source: string) =>
  source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?(?:\[([^\]]+)\])\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>#|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseHeadings = (source: string, file: string) => {
  const seen = new Set<string>();
  const headings: DocsHeading[] = [];
  let fence: "```" | "~~~" | undefined;

  for (const line of source.split(/\r?\n/)) {
    const fenceMatch = /^\s{0,3}(```|~~~)/.exec(line)?.[1];
    if (fenceMatch === "```" || fenceMatch === "~~~") {
      if (!fence) fence = fenceMatch;
      else if (fence === fenceMatch) fence = undefined;
      continue;
    }
    if (fence) continue;

    const match = /^\s{0,3}(##|###)\s+(.+?)\s*#*$/.exec(line);
    if (!match) continue;

    const title = stripMarkdown(match[2] ?? "");
    const baseId = slugifyDocsHeading(title);
    if (!baseId) continue;
    if (seen.has(baseId)) {
      throw new Error(`Duplicate heading ${baseId} in ${file}`);
    }
    seen.add(baseId);
    headings.push({
      depth: match[1] === "##" ? 2 : 3,
      id: baseId,
      title,
    });
  }

  return headings;
};

const stripBodyTitle = (source: string) =>
  source.replace(/^\s*#\s+.+?\r?\n+/, "");

const parseDocsSource = (file: string, source: string) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error(`Missing frontmatter in ${file}`);

  const frontmatter = Schema.decodeUnknownSync(DocsFrontmatter)(
    parse(match[1] ?? ""),
  );
  const bodySource = match[2] ?? "";
  const title = /^#\s+(.+?)\s*$/m.exec(bodySource)?.[1];
  if (!title || stripMarkdown(title) !== stripMarkdown(frontmatter.title)) {
    throw new Error(`Body title does not match frontmatter in ${file}`);
  }
  const body = stripBodyTitle(bodySource);

  return Schema.decodeUnknownSync(DocsPageSchema)({
    ...frontmatter,
    headings: parseHeadings(body, file),
    searchText: stripMarkdown(body),
    sourceFile: file.replace(/^\.\.\//, "src/"),
    source: body,
  });
};

type DocsSourceOptions = {
  locales: ReadonlyArray<DocsLocale>;
  requireLocaleParity?: boolean;
  matchesLocale?: (file: string, locale: DocsLocale) => boolean;
};

export type DocsSourceConfig = DocsSourceOptions & {
  pages: ReadonlyArray<unknown>;
};

export type MdxDocsSourceConfig = DocsSourceOptions & {
  files: Readonly<Record<string, string>>;
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
      if (!/^[a-z0-9-]+:[a-z0-9-]+$/.test(page.icon)) {
        throw new Error(`${page.sourceFile} must use an Iconify icon name`);
      }
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

export const createMdxDocsSource = (config: MdxDocsSourceConfig) =>
  createDocsSource({
    ...config,
    matchesLocale:
      config.matchesLocale ?? ((file, locale) => file.includes(`/${locale}/`)),
    pages: Object.entries(config.files).map(([file, source]) =>
      parseDocsSource(file, source),
    ),
  });

export const docsSource = createMdxDocsSource({
  files: contentFiles,
  locales: ["en", "fr"],
});

export type DocsConfig = {
  source: DocsSource;
  basePath: `/${string}`;
  defaultSlug: string;
  origin: `http://${string}` | `https://${string}`;
  siteName: string;
  defaultLocale?: DocsLocale;
  messages?: (locale: DocsLocale) => DocsMessageOverrides;
  brand?: {
    label: string;
    subtitle: () => string;
    icon: string;
    href: string;
  };
  resources?: {
    label: () => string;
    items: ReadonlyArray<DocsResource>;
  };
  githubLabel?: string;
  sectionOrder?: ReadonlyArray<DocsSection>;
  github?: {
    url: `https://${string}`;
    branch?: string;
  };
};

export const makeDocs = (config: DocsConfig) => {
  const { source } = config;
  const basePath = config.basePath.replace(/\/$/, "");
  const origin = config.origin.replace(/\/$/, "");
  const githubUrl = config.github?.url.replace(/\/$/, "");
  const brand = config.brand ?? {
    label: config.siteName,
    subtitle: () => "Documentation",
    icon: "lucide:book-open",
    href: "/",
  };
  const getMessages = (locale: DocsLocale) =>
    getDocsMessages(locale, config.messages?.(locale));
  const normalizeSearchText = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const searchIndex = source.pages.flatMap((page) => {
    const description = normalizeSearchText(page.description);
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
  }

  const pages = (locale: DocsLocale) => source.getPages(locale);
  const sections = (locale: DocsLocale) => {
    const localized = pages(locale);
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
      .map(({ entry }) => ({
        page: entry.page,
        ...("heading" in entry ? { heading: entry.heading } : {}),
      }));
  };
  const url = (page: DocsPage, locale: DocsLocale) =>
    `${origin}/${locale}${page.path}`;
  const editUrl = (page: DocsPage) =>
    githubUrl
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
    const canonical = page ? url(page, locale) : `${origin}/${locale}${path}`;
    const defaultLocale = config.defaultLocale ?? source.locales[0] ?? locale;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "og:site_name", content: config.siteName },
      ],
      links: [
        { rel: "canonical", href: canonical },
        ...source.locales.map((alternateLocale) => ({
          rel: "alternate",
          hrefLang: alternateLocale,
          href: `${origin}/${alternateLocale}${path}`,
        })),
        {
          rel: "alternate",
          hrefLang: "x-default",
          href: `${origin}/${defaultLocale}${path}`,
        },
      ],
    };
  };

  return {
    basePath,
    brand,
    defaultSlug: config.defaultSlug,
    editUrl,
    githubUrl,
    githubLabel: config.githubLabel ?? "GitHub",
    getHead,
    getMessages,
    origin,
    resources: config.resources,
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
  docsSectionMessages[locale][
    section as keyof (typeof docsSectionMessages)["en"]
  ] ?? humanizeDocsValue(section);

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
  label: () => string;
  href: string;
  icon: string;
  external?: boolean;
};

export type DocsResolution = NonNullable<ReturnType<DocsCatalog["resolve"]>>;

const iconComponents = new Map<string, LucideIcon>();

const iconFor = (name: string): LucideIcon => {
  const existing = iconComponents.get(name);
  if (existing) return existing;

  const DocsIcon = forwardRef<SVGSVGElement, LucideProps>(
    ({ className, color, size }, ref) => (
      <Icon
        icon={name}
        ref={ref}
        ssr
        {...(className ? { className } : {})}
        {...(color ? { color } : {})}
        {...(size === undefined ? {} : { height: size, width: size })}
      />
    ),
  );
  DocsIcon.displayName = `DocsIcon(${name})`;
  iconComponents.set(name, DocsIcon);
  return DocsIcon;
};

const headingText = (children: ReactNode) =>
  Children.toArray(children)
    .filter((child): child is string | number =>
      ["string", "number"].includes(typeof child),
    )
    .join("");

const makeDocsHeading = (
  level: 2 | 3,
  copyLink: string,
): NonNullable<Components["h2"]> => {
  const Heading = ({
    children,
    node: _node,
    ...props
  }: ComponentProps<"h2"> & ExtraProps) => {
    const text = headingText(children);
    const id = slugifyDocsHeading(text);
    const Component = level === 2 ? "h2" : "h3";

    return (
      <Component id={id} className="group scroll-mt-20" {...props}>
        {children}
        <a
          className="text-muted-foreground ml-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          href={`#${id}`}
          aria-label={`${copyLink}: ${text}`}
        >
          #
        </a>
      </Component>
    );
  };

  return Heading;
};

const DocsArticle = ({
  docs,
  messages,
  page,
}: {
  docs: DocsCatalog;
  messages: DocsRouteMessages;
  page: DocsPage;
}) => {
  const DocsLink = ({
    href,
    children,
    node: _node,
    ...props
  }: ComponentProps<"a"> & ExtraProps) => {
    if (!href) return <span>{children}</span>;

    if (href === docs.basePath || href.startsWith(`${docs.basePath}/`)) {
      const [path, hash] = href.split("#", 2);
      return (
        <Link to={path} {...(hash ? { hash } : {})}>
          {children}
        </Link>
      );
    }

    if (href.startsWith("#") || href.startsWith("/")) {
      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    }

    return (
      <a href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
      </a>
    );
  };
  const components: Components = {
    a: DocsLink,
    h2: makeDocsHeading(2, messages.copyLink),
    h3: makeDocsHeading(3, messages.copyLink),
    inlineCode: ({ children, node: _node, ...props }) => (
      <code
        className="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.875em]"
        {...props}
      >
        {children}
      </code>
    ),
    blockquote: ({ children, node: _node, ...props }) => (
      <blockquote
        className="border-primary/40 bg-muted/40 rounded-r-lg border-l-4 px-5 py-1"
        {...props}
      >
        {children}
      </blockquote>
    ),
  };

  return (
    <Streamdown
      className="[&_a:hover]:text-primary [&_a]:decoration-border text-[0.98rem] leading-7 [&_[data-streamdown=code-block-actions]]:pointer-events-auto [&_[data-streamdown=code-block-body]_code_span_span]:text-[var(--sdm-c,inherit)] dark:[&_[data-streamdown=code-block-body]_code_span_span]:text-[var(--shiki-dark,var(--sdm-c,inherit))] [&_[data-streamdown=code-block-body]_code>span]:block [&_[data-streamdown=code-block-body]_code>span]:min-w-max [&_[data-streamdown=code-block-copy-button]]:pointer-events-auto [&_[data-streamdown=code-block-header]+div]:-mt-10 [&_[data-streamdown=code-block-header]+div]:flex [&_[data-streamdown=code-block-header]+div]:h-8 [&_[data-streamdown=code-block-header]+div]:items-center [&_[data-streamdown=code-block-header]+div]:justify-end [&_a]:font-medium [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 [&_a]:transition-colors [&_h2]:mt-12 [&_h2]:border-t [&_h2]:pt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2:first-of-type]:mt-0 [&_h2:first-of-type]:border-t-0 [&_h2:first-of-type]:pt-0 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_ol]:my-5 [&_p]:my-5 [&_table]:text-sm [&_ul]:my-5"
      components={components}
      controls={{
        code: { copy: true, download: false },
        table: { copy: true, download: false, fullscreen: false },
      }}
      lineNumbers={false}
      linkSafety={{ enabled: false }}
      mode="static"
      plugins={{ code }}
      translations={{
        copied: messages.copied,
        copyCode: messages.copyCode,
        copyLink: messages.copyLink,
        copyTable: messages.copyTable,
        downloadTable: messages.downloadTable,
      }}
    >
      {page.source}
    </Streamdown>
  );
};

const DocsTableOfContentsItems = ({
  headings,
}: {
  headings: ReadonlyArray<DocsHeading>;
}) => (
  <ol className="border-l">
    {headings.map((heading) => (
      <li key={heading.id}>
        <a
          className={`text-muted-foreground hover:text-foreground block border-l border-transparent py-1.5 text-sm leading-5 ${
            heading.depth === 3 ? "pl-6" : "pl-4"
          }`}
          href={`#${heading.id}`}
        >
          {heading.title}
        </a>
      </li>
    ))}
  </ol>
);

const DocsTableOfContents = ({
  headings,
  label,
}: {
  headings: ReadonlyArray<DocsHeading>;
  label: string;
}) => {
  if (headings.length === 0) return null;

  return (
    <nav aria-label={label} className="sticky top-20">
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
        <Icon
          className="text-muted-foreground size-4 transition-transform group-data-[panel-open]:rotate-180"
          icon="lucide:chevron-down"
          ssr
        />
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
  const navigate = useNavigate();
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
              icon: <Icon className="size-4" icon="lucide:hash" ssr />,
              onSelect: () => navigate({ to: page.path, hash: heading.id }),
            }
          : {
              id: page.path,
              label: page.title,
              description: page.description,
              icon: <Icon className="size-4" icon={page.icon} ssr />,
              onSelect: () => navigate({ to: page.path }),
            },
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
  const { brand, resources } = docs;
  const resolvedMessages = docs.getMessages(locale);
  const groups: NavGroup[] = docs.sections(locale).map((section) => ({
    label: () => resolvedMessages.sectionLabel(section.id),
    items: section.pages.map((item) => ({
      label: () => item.title,
      href: item.path,
      icon: iconFor(item.icon),
    })),
  }));

  if (resources) {
    groups.push({
      label: resources.label,
      items: [
        ...resources.items.map((item) => ({
          label: item.label,
          href: item.href,
          icon: iconFor(item.icon),
          ...(item.external === undefined ? {} : { external: item.external }),
        })),
        ...(docs.githubUrl
          ? [
              {
                label: () => docs.githubLabel,
                href: docs.githubUrl,
                icon: iconFor("lucide:code-2"),
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
          icon={iconFor(brand.icon)}
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
              <Icon className="size-3.5" icon="lucide:external-link" ssr />
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
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {page.title}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
        {page.description}
      </p>
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
      <DocsArticle docs={docs} messages={resolvedMessages} page={page} />
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
            <Icon className="size-3.5" icon="lucide:external-link" ssr />
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
          <Link
            className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
            to={neighbors.previous.path}
          >
            <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium uppercase">
              <Icon className="size-3.5" icon="lucide:arrow-left" ssr />
              {resolvedMessages.previous}
            </span>
            <span className="mt-1 block font-semibold">
              {neighbors.previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {neighbors.next ? (
          <Link
            className="hover:bg-muted/50 rounded-lg border p-4 text-right transition-colors"
            to={neighbors.next.path}
          >
            <span className="text-muted-foreground flex items-center justify-end gap-1 text-xs font-medium uppercase">
              {resolvedMessages.next}
              <Icon className="size-3.5" icon="lucide:arrow-right" ssr />
            </span>
            <span className="mt-1 block font-semibold">
              {neighbors.next.title}
            </span>
          </Link>
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

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 text-center">
      <Icon
        className="text-primary mx-auto size-10"
        icon={docs.brand.icon}
        ssr
      />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        {resolvedMessages.notFoundTitle}
      </h1>
      <p className="text-muted-foreground mt-3 leading-7">
        {resolvedMessages.notFoundDescription}
      </p>
      <Link
        className="text-primary mt-6 font-semibold underline underline-offset-4"
        to={docs.basePath}
      >
        {resolvedMessages.notFoundAction}
      </Link>
    </main>
  );
};
