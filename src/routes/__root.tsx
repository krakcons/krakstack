import {
  HeadContent,
  Scripts,
  createRootRoute,
  stripSearchParams,
} from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";

import { ThemeProvider } from "@krak-stack/registry/theme-switcher";
import { KrakstackProvider } from "@krak-stack/registry/krakstack-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { m } from "@/paraglide/messages";
import { getLocale, locales } from "@/paraglide/runtime";

import appCss from "../styles.css?url";
import { ErrorComponent } from "@/components/ui/error-component";
import { telemetryRuntime } from "@/lib/browser-telemetry";

export const Route = createRootRoute({
  search: {
    middlewares: [
      stripSearchParams<{ page?: number; pageSize?: number }>({
        page: 0,
        pageSize: 20,
      }),
    ],
  },
  errorComponent: ErrorComponent,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: `Krakstack ${m.app_name()}`,
      },
      {
        name: "description",
        content: m.home_description(),
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  useAtomValue(telemetryRuntime);

  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <KrakstackProvider locale={getLocale()} locales={locales}>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </KrakstackProvider>

        <Scripts />
      </body>
    </html>
  );
}
