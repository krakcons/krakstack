export type SeoOptions = {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
  url?: string;
  origin?: string;
  path?: string;
  locale?: string;
  locales?: readonly string[];
  defaultLocale?: string;
  robots?: string;
  siteName?: string;
  twitterCreator?: string;
  twitterSite?: string;
  type?: "website" | "article";
  sameAs?: readonly string[];
};

export type SeoDefaults = {
  origin: string;
  locales?: readonly string[];
  defaultLocale?: string;
  siteName?: string;
  twitterCreator?: string;
  twitterSite?: string;
  sameAs?: readonly string[];
};

export type SeoPageOptions = Omit<SeoOptions, keyof SeoDefaults>;

type SeoPublisher = {
  "@type": string;
  name: string;
  url?: string;
  sameAs?: readonly string[];
};

type SeoArticle = {
  "@type": string;
  headline: string;
  description?: string;
  url?: string;
  inLanguage?: string;
  image?: string;
  publisher: SeoPublisher;
};

type SeoWebsite = {
  "@type": string;
  name: string;
  url?: string;
  publisher: SeoPublisher;
};

const localizedUrl = (origin: string, locale: string, path: string) =>
  `${origin.replace(/\/$/, "")}/${locale}${path === "/" ? "/" : path}`;

export const seo = ({
  title,
  description,
  image,
  keywords,
  url,
  origin,
  path = "/",
  locale,
  locales,
  defaultLocale,
  robots = "index, follow",
  siteName = "KrakStack",
  twitterCreator = "@krak",
  twitterSite = "@krak",
  type = "website",
  sameAs,
}: SeoOptions) => {
  const canonical =
    url ?? (origin && locale ? localizedUrl(origin, locale, path) : undefined);
  const tags = [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    { name: "robots", content: robots },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:creator", content: twitterCreator },
    { name: "twitter:site", content: twitterSite },
    {
      name: "twitter:card",
      content: image ? "summary_large_image" : "summary",
    },
    { property: "og:type", content: type },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:site_name", content: siteName },
    { property: "og:url", content: canonical },
    {
      property: "og:locale",
      content: locale === "fr" ? "fr_FR" : locale ? "en_US" : undefined,
    },
    ...(image
      ? [
          { name: "twitter:image", content: image },
          { property: "og:image", content: image },
        ]
      : []),
  ].filter((tag) => !Object.hasOwn(tag, "content") || tag.content);
  const alternateLocales = locales ?? [];
  const links = canonical
    ? [
        { rel: "canonical", href: canonical },
        ...(origin && alternateLocales.length > 0
          ? alternateLocales.map((alternateLocale) => ({
              rel: "alternate",
              hrefLang: alternateLocale,
              href: localizedUrl(origin, alternateLocale, path),
            }))
          : []),
        ...(origin && alternateLocales.length > 0
          ? [
              {
                rel: "alternate",
                hrefLang: "x-default",
                href: localizedUrl(
                  origin,
                  defaultLocale ?? alternateLocales[0] ?? "en",
                  path,
                ),
              },
            ]
          : []),
      ]
    : [];

  const siteUrl = origin?.replace(/\/$/, "") ?? canonical;
  const publisher: SeoPublisher = {
    "@type": "Organization",
    name: siteName,
  };
  if (siteUrl) publisher.url = siteUrl;
  if (sameAs?.length) publisher.sameAs = sameAs;
  const structuredData =
    type === "article"
      ? (() => {
          const article: SeoArticle = {
            "@type": "Article",
            headline: title,
            description,
            publisher,
          };
          if (canonical) article.url = canonical;
          if (locale) article.inLanguage = locale;
          if (image) article.image = image;
          return article;
        })()
      : (() => {
          const website: SeoWebsite = {
            "@type": "WebSite",
            name: siteName,
            publisher,
          };
          if (siteUrl) website.url = siteUrl;
          return website;
        })();
  const scripts = [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        ...structuredData,
      }),
    },
  ];

  return { meta: tags, links, scripts };
};

export const createSeo = (defaults: SeoDefaults) => (options: SeoPageOptions) =>
  seo({
    ...defaults,
    ...options,
  });
