import { describe, expect, it } from "@effect/vitest";
import { createDocsSource } from "@krak-stack/registry/docs";

import { loadRegistryDocsPages } from "./registry-docs.server";

describe("registry documentation assembly", () => {
  it("loads unique localized pages and uses the engine guide instead of registry copy", async () => {
    const pages = await loadRegistryDocsPages();
    expect(() =>
      createDocsSource({ pages, locales: ["en", "fr"] }),
    ).not.toThrow();
    expect(pages.some((page) => page.slug === "workflow-runners")).toBe(false);
    for (const locale of ["en", "fr"]) {
      const engines = pages.filter(
        (page) => page.slug === "workflow-layer" && page.locale === locale,
      );
      expect(engines).toHaveLength(1);
      expect(engines[0]?.path).toBe("/docs/workflow-layer");
      expect(engines[0]?.headings.map((heading) => heading.title)).toEqual(
        locale === "en"
          ? [
              "Install",
              "Workflow examples",
              "Runners",
              "Single (Simple)",
              "HTTP (Recommended)",
            ]
          : [
              "Installation",
              "Exemples de workflows",
              "Runners",
              "Single (Simple)",
              "HTTP (Recommandé)",
            ],
      );
      expect(
        engines[0]?.codeBlocks.some((block) =>
          block.code.includes("BunClusterHttp.layer"),
        ),
      ).toBe(true);
      expect(
        engines[0]?.codeBlocks.some((block) =>
          block.code.includes("SingleRunner.layer"),
        ),
      ).toBe(true);
    }
  });
});
