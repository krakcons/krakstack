import type { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeSwitcher, useTheme } from "@/components/ui/theme-switcher";
import { DocsLayout, type DocsCatalog } from "@/lib/docs";
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
