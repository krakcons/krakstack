import { mkdir, rm } from "node:fs/promises";
import { createDocsSource } from "@krak-stack/registry/docs";
import {
  loadAgentsPreviewMarkdown,
  loadRegistryDocsPages,
} from "../src/lib/registry-docs.server";
import { toRegistryDocsIndex } from "../src/lib/registry-docs.schema";

const output = new URL("../tmp/registry-docs/", import.meta.url);
const pages = await loadRegistryDocsPages();
// Fail the build on duplicate routes or mismatched translations.
createDocsSource({ pages, locales: ["en", "fr"] });
await rm(new URL("pages/", output), { recursive: true, force: true });
await mkdir(new URL("pages/", output), { recursive: true });
await Bun.write(
  new URL("index.json", output),
  JSON.stringify(toRegistryDocsIndex(pages)),
);
await Bun.write(
  new URL("agents.json", output),
  JSON.stringify(await loadAgentsPreviewMarkdown()),
);
for (const page of pages) {
  await mkdir(new URL(`pages/${page.locale}/`, output), { recursive: true });
  await Bun.write(
    new URL(`pages/${page.locale}/${page.slug}.json`, output),
    JSON.stringify(page),
  );
}
console.log(`Compiled ${pages.length} localized documentation pages.`);
