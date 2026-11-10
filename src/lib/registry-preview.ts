import { createServerFn } from "@tanstack/react-start";
import { Schema } from "effect";

const PreviewSlug = Schema.String.annotate({
  identifier: "RegistryPreviewSlug",
});

export const getRegistryPreviewSource = createServerFn({ method: "GET" })
  .validator(Schema.toStandardSchemaV1(PreviewSlug))
  .handler(async ({ data }) => {
    const { loadRegistryPreviewSource } =
      await import("./registry-preview.server");
    return loadRegistryPreviewSource(data);
  });
