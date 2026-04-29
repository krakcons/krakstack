import { defineConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
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
        { match: "/.well-known/:path(.*)?", exclude: true },
      ],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
