// Vite embeds sources at build time; deployed servers need no source-file access.
const sources = import.meta.glob<string>(
  "../components/registry-previews/*-preview.tsx",
  { query: "?raw", import: "default", eager: true },
);

export const loadRegistryPreviewSource = (slug: string) =>
  sources[`../components/registry-previews/${slug}-preview.tsx`] ?? null;
