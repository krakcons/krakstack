import { Schema } from "effect";
import {
  DocsFrontmatter,
  DocsCodeBlockSchema,
  DocsHeadingSchema,
  type DocsPage,
} from "@krak-stack/registry/docs";

export const RegistryDocsIndexEntry = Schema.Struct({
  ...DocsFrontmatter.fields,
  headings: Schema.Array(DocsHeadingSchema),
  searchText: Schema.String,
  sourceFile: Schema.String,
}).annotate({ identifier: "RegistryDocsIndexEntry" });

export const RegistryDocsIndex = Schema.Array(RegistryDocsIndexEntry).annotate({
  identifier: "RegistryDocsIndex",
});

export const RegistryDocsPageRequest = Schema.Struct({
  slug: Schema.String,
  locale: Schema.Literals(["en", "fr"]),
}).annotate({ identifier: "RegistryDocsPageRequest" });

export const RegistryAgentsPreview = Schema.Struct({
  html: Schema.String,
  source: Schema.String,
  codeBlocks: Schema.Array(DocsCodeBlockSchema),
}).annotate({ identifier: "RegistryAgentsPreview" });

export const toRegistryDocsIndex = (pages: ReadonlyArray<DocsPage>) =>
  pages.map(
    ({ html: _html, source: _source, codeBlocks: _codeBlocks, ...entry }) =>
      entry,
  );

// The registry's catalog API expects full pages, even for navigation/search.
// Supply empty bodies there; only the resolved page receives its real content.
export const indexToRegistryDocsPages = (
  entries: typeof RegistryDocsIndex.Type,
): ReadonlyArray<DocsPage> =>
  entries.map((entry) => ({ ...entry, html: "", source: "", codeBlocks: [] }));
