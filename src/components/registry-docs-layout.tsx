import type { ReactNode } from "react";

import { LocaleSwitcher } from "@krak-stack/registry/locale-switcher";
import { ThemeSwitcher, useTheme } from "@krak-stack/registry/theme-switcher";
import { DocsLayout, type DocsCatalog } from "@krak-stack/registry/docs";
import { getLocale, setLocale } from "@/paraglide/runtime";

export const RegistryDocsLayout = ({
  children,
  docs,
}: {
  children: ReactNode;
  docs: DocsCatalog;
}) => {
  const { theme, setTheme } = useTheme();
  const locale = getLocale();

  return (
    <DocsLayout
      docs={docs}
      locale={locale}
      sidebarCollapsible="offcanvas"
      headerActions={
        <>
          <ThemeSwitcher value={theme} onChange={setTheme} />
          <LocaleSwitcher
            onLocaleChange={(nextLocale) => {
              if (nextLocale === "en" || nextLocale === "fr") {
                setLocale(nextLocale);
              }
            }}
          />
        </>
      }
    >
      {children}
    </DocsLayout>
  );
};
