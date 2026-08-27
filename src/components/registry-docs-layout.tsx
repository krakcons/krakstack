import type { ReactNode } from "react";

import { LocaleSwitcher } from "@krak-stack/registry/locale-switcher";
import { ThemeSwitcher, useTheme } from "@krak-stack/registry/theme-switcher";
import { DocsLayout, type DocsCatalog } from "@krak-stack/registry/docs";
import { getLocale } from "@/paraglide/runtime";

export const RegistryDocsLayout = ({
  children,
  docs,
}: {
  children: ReactNode;
  docs: DocsCatalog;
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <DocsLayout
      docs={docs}
      locale={getLocale()}
      headerActions={
        <>
          <ThemeSwitcher value={theme} onChange={setTheme} />
          <LocaleSwitcher />
        </>
      }
    >
      {children}
    </DocsLayout>
  );
};
