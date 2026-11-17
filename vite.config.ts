import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  resolve: {
    dedupe: ["effect"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    tsconfigPaths: true,
  },
  server: {
    port: Number(process.env.PORT) || 3000,
  },
  plugins: [
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["url", "cookie", "preferredLanguage", "baseLocale"],
      cookieName: "locale",
      urlPatterns: [
        {
          pattern: "/:path(.*)?",
          localized: [
            ["en", "/en/:path(.*)?"],
            ["fr", "/fr/:path(.*)?"],
          ],
        },
      ],
      routeStrategies: [
        { match: "/api/:path(.*)?", exclude: true },
        { match: "/sitemap.xml", exclude: true },
        { match: "/llms.txt", exclude: true },
      ],
    }),
    tailwindcss(),
    tanstackStart({
      pages: ["en", "fr"].flatMap((locale) =>
        ["/docs", "/docs/developer-setup", "/docs/sites/template"].map(
          (path) => ({
            path: `/${locale}${path}`,
          }),
        ),
      ),
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: true,
        concurrency: 4,
        failOnError: true,
        filter: ({ path }) => /^\/(?:en|fr)\/docs(?:\/|$)/.test(path),
      },
    }),
    viteReact(),
  ],
});

export default config;
