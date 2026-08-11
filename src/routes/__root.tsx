import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

import { ThemeProvider } from "@/components/ui/theme-switcher";
import { TooltipProvider } from "@/components/ui/tooltip";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

import appCss from "../styles.css?url";

const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

export const Route = createRootRoute({
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
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
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
    scripts: analyticsWebsiteId
      ? [
          {
            defer: true,
            src: "https://analytics.krakconsultants.net/script.js",
            "data-website-id": analyticsWebsiteId,
          },
        ]
      : [],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>

        <Scripts />
      </body>
    </html>
  );
}
