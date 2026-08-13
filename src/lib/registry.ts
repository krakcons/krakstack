import registry from "../../registry.json";
import { Option, Schema } from "effect";

const NEW_REGISTRY_ITEM_DAYS = 14;
const RegistryItemDateSchema = Schema.DateFromString.pipe(
  Schema.check(
    Schema.makeFilter((date) =>
      Number.isNaN(date.getTime()) ? "Expected a valid date" : undefined,
    ),
  ),
);
const RegistryItemMetaSchema = Schema.Struct({
  createdAt: Schema.optional(RegistryItemDateSchema),
  updatedAt: Schema.optional(RegistryItemDateSchema),
}).annotate({ identifier: "RegistryItemMeta" });
const decodeRegistryItemMeta = Schema.decodeUnknownOption(
  RegistryItemMetaSchema,
);

export type RegistryItem = (typeof registry.items)[number] & {
  docs?: string;
};

export const registryItems = registry.items as RegistryItem[];

export const isRegistryItemNew = (
  item: { meta?: unknown },
  now = new Date(),
) => {
  const meta = decodeRegistryItemMeta(item.meta);
  if (Option.isNone(meta) || !meta.value.createdAt) return false;

  const age = now.getTime() - meta.value.createdAt.getTime();
  return age >= 0 && age < NEW_REGISTRY_ITEM_DAYS * 24 * 60 * 60 * 1000;
};

export const getRegistryItemMeta = (item: { meta?: unknown }) =>
  Option.getOrUndefined(decodeRegistryItemMeta(item.meta));

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
    [
      "notification-menu",
      "service-notification",
      "notification-channel-email-ses",
    ].includes(item.name)
  ) {
    return "Notifications";
  }
  if (["agents", "lint-format"].includes(item.name)) return "Configuration";
  if (item.type === "registry:block") return "Components";
  if (item.type === "registry:lib") return "Services";
  return "Registry";
}
