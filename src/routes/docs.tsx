import { Blocks } from "lucide-react";
import {
  getRegistryGroup,
  getRegistryIcon,
  registryItems,
} from "@/lib/registry";
import { createFileRoute } from "@tanstack/react-router";
import { SidebarLayout, type NavGroup } from "@/components/sidebar-layout";
import { AppBrand } from "@/components/app-brand";
import { RegistryCommandMenu } from "@/components/registry-command-menu";

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

function DocsLayout() {
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
      groups={docsNavGroups}
      headerActions={<RegistryCommandMenu />}
    />
  );
}
