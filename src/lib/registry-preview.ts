const sources = import.meta.glob<string>(
  "../components/registry-previews/*-preview.tsx",
  { query: "?raw", import: "default" },
);

export const getRegistryPreviewSource = async ({ data }: { data: string }) =>
  (await sources[`../components/registry-previews/${data}-preview.tsx`]?.()) ??
  null;
