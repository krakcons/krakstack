import { createMdxDocsSource } from "./docs-core";

export * from "./docs-core";

const contentFiles = import.meta.glob<string>("../content/docs/**/*.mdx", {
  eager: true,
  import: "default",
  query: "?raw",
});

export const docsSource = createMdxDocsSource({
  files: contentFiles,
  locales: ["en", "fr"],
});
