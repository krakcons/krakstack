import registry from "../../registry.json";

export type RegistryItem = (typeof registry.items)[number] & {
  docs?: string;
};

export const registryItems = registry.items as RegistryItem[];

export function getRegistryItem(slug: string) {
  return registryItems.find((item) => item.name === slug);
}

export function getRegistryGroup(item: RegistryItem) {
  if (
    [
      "service-database",
      "service-opentelemetry",
      "embedding-layer",
      "workflow-layer",
    ].includes(item.name)
  ) {
    return "Layers";
  }
  if (
    [
      "query-helpers",
      "docs",
      "docs-ai",
      "httpapi-ai",
      "httpapi-cli",
      "httpapi-client",
      "httpapi-mcp",
      "seo",
    ].includes(item.name)
  ) {
    return "Libraries";
  }
  if (
    [
      "copy-button",
      "file-picker",
      "google-map",
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
