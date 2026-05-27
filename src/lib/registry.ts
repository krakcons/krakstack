import registry from "../../registry.json";
import {
  Activity,
  BellRing,
  Blocks,
  Bot,
  Database,
  Globe,
  KeyRound,
  Layers,
  ListChecks,
  Mail,
  PanelLeft,
  Search,
  Shield,
  Table2,
  UserRound,
  Wrench,
} from "lucide-react";

export type RegistryItem = (typeof registry.items)[number] & {
  docs?: string;
};

export const registryItems = registry.items as RegistryItem[];

export function getRegistryItem(slug: string) {
  return registryItems.find((item) => item.name === slug);
}

export function getRegistryGroup(item: RegistryItem) {
  if (item.name === "krakstack-template") return "Templates";
  if (item.name === "embedding-layer") return "Layers";
  if (
    ["service-notification", "notification-channel-email-ses"].includes(
      item.name,
    )
  ) {
    return "Notifications";
  }
  if (["agents", "lint-format"].includes(item.name)) return "Configuration";
  if (item.type === "registry:block") return "Components";
  if (item.type === "registry:lib") return "Services";
  return "Registry";
}

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
  "service-notification": BellRing,
  "notification-channel-email-ses": Mail,
  "embedding-layer": Layers,
  "sidebar-layout": PanelLeft,
  "search-menu": Search,
  agents: Bot,
  "lint-format": Wrench,
  "app-brand": Blocks,
  "krakstack-template": Blocks,
} as const;

export function getRegistryIcon(item: RegistryItem) {
  return iconByName[item.name as keyof typeof iconByName] ?? Shield;
}
