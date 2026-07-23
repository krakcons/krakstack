import registry from "../../registry.json";
import {
  Activity,
  Badge,
  BellRing,
  Bot,
  Cloud,
  ChevronsUpDown,
  ClipboardList,
  CodeXml,
  Combine,
  Copy,
  Database,
  GalleryHorizontalEnd,
  ImageIcon,
  Languages,
  Globe,
  ListFilter,
  LoaderCircle,
  Mail,
  MonitorCog,
  Orbit,
  PanelLeft,
  Search,
  Shield,
  SquareTerminal,
  Table2,
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
  if (item.name === "embedding-layer") return "Services";
  if (
    [
      "query-helpers",
      "httpapi-ai",
      "httpapi-cli",
      "httpapi-client",
      "httpapi-mcp",
    ].includes(item.name)
  ) {
    return "Libraries";
  }
  if (
    [
      "copy-button",
      "icon-input",
      "loading",
      "pagination",
      "virtualized-combobox",
    ].includes(item.name)
  ) {
    return "Components";
  }
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
  auth: Shield,
  "service-database": Database,
  "service-opentelemetry": Activity,
  "service-notification": BellRing,
  "notification-channel-email-ses": Mail,
  "service-s3": Cloud,
  "embedding-layer": Orbit,
  "query-helpers": ListFilter,
  "httpapi-cli": SquareTerminal,
  "httpapi-client": Combine,
  "httpapi-ai": Bot,
  "httpapi-mcp": Workflow,
  "sidebar-layout": PanelLeft,
  "search-menu": Search,
  "code-block": CodeXml,
  "copy-button": Copy,
  "virtualized-combobox": ChevronsUpDown,
  loading: LoaderCircle,
  "icon-input": ImageIcon,
  pagination: GalleryHorizontalEnd,
  localization: Languages,
  "stats-card": Activity,
  agents: Bot,
  "lint-format": Wrench,
  "app-brand": Badge,
} as const;

export function getRegistryIcon(item: RegistryItem) {
  return iconByName[item.name as keyof typeof iconByName] ?? Shield;
}
