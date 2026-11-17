import { Schema } from "effect";
import { DocsPageSchema } from "@krak-stack/registry/docs";
import {
  indexToRegistryDocsPages,
  RegistryDocsIndex,
  RegistryAgentsPreview,
} from "./registry-docs.schema";

const indexes = import.meta.glob<unknown>("/tmp/registry-docs/index.json", {
  eager: true,
  import: "default",
});
const pages = import.meta.glob<unknown>("/tmp/registry-docs/pages/*/*.json", {
  import: "default",
});

export const compiledRegistryDocsPages = indexToRegistryDocsPages(
  Schema.decodeUnknownSync(RegistryDocsIndex)(
    indexes["/tmp/registry-docs/index.json"],
  ),
);

export const loadCompiledRegistryDocsPage = async (
  slug: string,
  locale: string,
) => {
  const load = pages[`/tmp/registry-docs/pages/${locale}/${slug}.json`];
  return load
    ? Schema.decodeUnknownSync(DocsPageSchema)(await load())
    : undefined;
};

export const loadCompiledAgentsPreview = async () => {
  const artifacts = import.meta.glob<unknown>(
    "/tmp/registry-docs/agents.json",
    {
      import: "default",
    },
  );
  const load = artifacts["/tmp/registry-docs/agents.json"];
  if (!load)
    throw new Error("Missing compiled AGENTS preview; run bun run docs:build");
  return Schema.decodeUnknownSync(RegistryAgentsPreview)(await load());
};
