import type { ReactNode } from "react";

import { LocaleSwitcher } from "@krak-stack/registry/locale-switcher";
import { ThemeSwitcher, useTheme } from "@krak-stack/registry/theme-switcher";
import { DocsLayout, type DocsCatalog } from "@krak-stack/registry/docs";
import { getLocale, setLocale } from "@/paraglide/runtime";
import "./registry-docs.css";

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
    <div className="registry-docs">
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
                  void setLocale(nextLocale);
                }
              }}
            />
          </>
        }
      >
        {children}
      </DocsLayout>
    </div>
  );
};
