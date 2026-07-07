import registry from "../../registry.json";
import {
  Activity,
  Badge,
  BellRing,
  Bot,
  Building2,
  Cloud,
  ClipboardList,
  CodeXml,
  Copy,
  Database,
  Languages,
  Globe,
  KeyRound,
  Layers,
  ListFilter,
  LoaderCircle,
  Mail,
  MonitorCog,
  PanelLeft,
  Search,
  Shield,
  SquareTerminal,
  Table2,
  UserRound,
  Wrench,
  Workflow,
} from "lucide-react";

export type RegistryItem = (typeof registry.items)[number] & {
  docs?: string;
};

export const registryItems = registry.items as RegistryItem[];

export function getRegistryItem(slug: string) {
  return registryItems.find((item) => item.name === slug);
}

export function getRegistryGroup(item: RegistryItem) {
  if (item.name === "embedding-layer") return "Layers";
  if (["query-helpers", "httpapi-cli", "httpapi-mcp"].includes(item.name)) {
    return "Libraries";
  }
  if (["copy-button", "loading"].includes(item.name)) return "Components";
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
  form: ClipboardList,
  "locale-switcher": Globe,
  "theme-switcher": MonitorCog,
  "editing-locale-switcher": Languages,
  "user-button": UserRound,
  "organization-switcher": Building2,
  "sign-in": KeyRound,
  "sign-up": KeyRound,
  auth: Shield,
  "service-database": Database,
  "service-opentelemetry": Activity,
  "service-notification": BellRing,
  "notification-channel-email-ses": Mail,
  "service-s3": Cloud,
  "embedding-layer": Layers,
  "query-helpers": ListFilter,
  "httpapi-cli": SquareTerminal,
  "httpapi-mcp": Workflow,
  "sidebar-layout": PanelLeft,
  "search-menu": Search,
  "code-block": CodeXml,
  "copy-button": Copy,
  loading: LoaderCircle,
  "stats-card": Activity,
  agents: Bot,
  "lint-format": Wrench,
  "app-brand": Badge,
} as const;

export function getRegistryIcon(item: RegistryItem) {
  return iconByName[item.name as keyof typeof iconByName] ?? Shield;
}
