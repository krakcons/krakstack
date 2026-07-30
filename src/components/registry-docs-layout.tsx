import type { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeSwitcher, useTheme } from "@/components/ui/theme-switcher";
import { DocsLayout } from "@/lib/docs";
import { registryDocs } from "@/lib/registry-docs";
import { getLocale } from "@/paraglide/runtime";

export const RegistryDocsLayout = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme } = useTheme();

  return (
    <DocsLayout
      docs={registryDocs}
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
