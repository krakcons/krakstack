import {
  Blocks,
  Activity,
  Bot,
  Database,
  Globe,
  KeyRound,
  ListChecks,
  PanelLeft,
  Shield,
  Table2,
  UserRound,
} from "lucide-react";
import { getRegistryGroup, registryItems } from "@/lib/registry";
import { createFileRoute } from "@tanstack/react-router";
import { SidebarLayout, type NavGroup } from "@/components/sidebar-layout";
import { AppBrand } from "@/components/app-brand";

export const Route = createFileRoute("/docs")({ component: DocsLayout });

const iconByName = {
  "data-table": Table2,
  form: ListChecks,
  "locale-toggle": Globe,
  "user-button": UserRound,
  "sign-in": KeyRound,
  "sign-up": KeyRound,
  auth: Shield,
  "service-database": Database,
  "service-opentelemetry": Activity,
  "sidebar-layout": PanelLeft,
  agents: Bot,
  "app-brand": Blocks,
  "krakstack-template": Blocks,
} as const;

const docsNavGroups: NavGroup[] = registryItems.reduce((sections, item) => {
  const title = getRegistryGroup(item);
  const navItem = {
    label: () => item.title ?? item.name,
    href: `/docs/registry/${item.name}`,
    icon: iconByName[item.name as keyof typeof iconByName] ?? Shield,
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
    />
  );
}
