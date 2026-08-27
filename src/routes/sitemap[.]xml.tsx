import { createFileRoute } from "@tanstack/react-router";

import { makeRegistryDocs } from "@/lib/registry-docs";

const origin = "https://krakstack.net";
const locales = ["en", "fr"] as const;

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const sitemap = async () => {
  const { loadRegistryDocsPages } = await import("@/lib/registry-docs.server");
  const docs = makeRegistryDocs(await loadRegistryDocsPages());
  const paths = ["/", ...docs.pages("en").map((page) => page.path)];
  const urls = paths.flatMap((path) =>
    locales.map((locale) => {
      const localizedPath = path === "/" ? "/" : path;
      const location = `${origin}/${locale}${localizedPath}`;
      return `  <url>
    <loc>${escapeXml(location)}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(`${origin}/en${localizedPath}`)}" />
    <xhtml:link rel="alternate" hreflang="fr" href="${escapeXml(`${origin}/fr${localizedPath}`)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${origin}/en${localizedPath}`)}" />
  </url>`;
    }),
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;
};

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await sitemap(), {
          headers: {
            "cache-control": "public, max-age=3600",
            "content-type": "application/xml; charset=utf-8",
          },
        }),
    },
  },
});
