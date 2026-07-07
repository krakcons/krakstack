import { Blocks, Wrench } from "lucide-react";
import {
  getRegistryGroup,
  getRegistryIcon,
  registryItems,
} from "@/lib/registry";
import { createFileRoute } from "@tanstack/react-router";
import { SidebarLayout, type NavGroup } from "@/components/ui/sidebar-layout";
import { AppBrand } from "@/components/ui/app-brand";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeSwitcher, useTheme } from "@/components/ui/theme-switcher";
import { RegistryCommandMenu } from "@/components/registry-command-menu";
import { krakstackPackages } from "@/lib/krakstack-packages";
import { krakstackSites } from "@/lib/krakstack-sites";
import { getLocale } from "@/paraglide/runtime";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/docs")({ component: DocsLayout });

const docsNavGroups: NavGroup[] = registryItems.reduce((sections, item) => {
  const title = getRegistryGroup(item);
  const navItem = {
    label: () => item.title ?? item.name,
    href: `/docs/registry/${item.name}`,
    icon: getRegistryIcon(item),
  };

  const section = sections.find((entry) => entry.label() === title);
  if (section) section.items.push(navItem);
  else sections.push({ label: () => title, items: [navItem] });

  return sections;
}, [] as NavGroup[]);

const developerSetupNavItem = {
  label: () =>
    getLocale() === "fr" ? "Configuration développeur" : "Developer setup",
  href: "/docs/developer-setup",
  icon: Wrench,
};

const configurationNavGroup = docsNavGroups.find(
  (entry) => entry.label() === "Configuration",
);

if (configurationNavGroup) {
  configurationNavGroup.items.unshift(developerSetupNavItem);
} else {
  docsNavGroups.push({
    label: () => "Configuration",
    items: [developerSetupNavItem],
  });
}

const siteNavGroup: NavGroup = {
  label: () => m.krakstack_sites_heading(),
  items: krakstackSites.map((site) => ({
    label: site.title,
    href: site.docsHref,
    icon: site.icon,
  })),
};

const packageNavGroup: NavGroup = {
  label: () => m.krakstack_packages_heading(),
  items: krakstackPackages.map((pkg) => ({
    label: () => pkg.name,
    href: pkg.docsHref,
    icon: pkg.icon,
  })),
};

function DocsLayout() {
  const { theme, setTheme } = useTheme();

  return (
    <SidebarLayout
      sidebarHeader={
        <AppBrand
          label="Krakstack"
          variant="sidebar"
          subtitle="Documentation"
          icon={Blocks}
          href="/"
        />
      }
      groups={[siteNavGroup, packageNavGroup, ...docsNavGroups]}
      headerActions={
        <>
          <RegistryCommandMenu />
          <ThemeSwitcher value={theme} onChange={setTheme} />
          <LocaleSwitcher />
        </>
      }
    />
  );
}
