import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";
import { createDocsSource } from "@krak-stack/registry/docs";
import { createIntegrationDocs } from "@krak-stack/registry/docs/integrations";

const config = {
  appName: "Example",
  origin: "https://example.com",
  api: true,
  mcp: true,
} satisfies Parameters<typeof createIntegrationDocs>[0];

describe("integration docs", () => {
  it("generates compiled pages with locale parity and canonical endpoints", () => {
    const pages = createIntegrationDocs(config);
    expect(pages).toHaveLength(4);
    expect(() =>
      createDocsSource({ pages, locales: ["en", "fr"] }),
    ).not.toThrow();
    expect(
      pages
        .filter((page) => page.slug === "api-access")
        .every((page) => page.html.includes("https://example.com/api/docs")),
    ).toBe(true);
    for (const page of pages.filter((page) => page.slug === "mcp")) {
      expect(page.codeBlocks).toContainEqual({
        language: "text",
        code: "https://example.com/api/mcp",
      });
      expect(page.headings.length).toBeGreaterThan(0);
    }
  });

  it("requires opt-in and supports individual capabilities", () => {
    expect(
      createIntegrationDocs({ ...config, api: false, mcp: false }),
    ).toEqual([]);
    expect(
      createIntegrationDocs({ ...config, mcp: false }).map((page) => page.slug),
    ).toEqual(["api-access", "api-access"]);
    expect(
      createIntegrationDocs({ ...config, api: false }).map((page) => page.slug),
    ).toEqual(["mcp", "mcp"]);
  });

  it("supports catalog settings and endpoint overrides", () => {
    const pages = createIntegrationDocs({
      ...config,
      basePath: "/help/",
      section: "reference",
      order: 20,
      locales: ["fr"],
      api: { referenceUrl: "/reference" },
      mcp: { url: "https://tools.example.com/mcp" },
    });
    expect(
      pages.map((page) => [page.locale, page.path, page.section, page.order]),
    ).toEqual([
      ["fr", "/help/api-access", "reference", 20],
      ["fr", "/help/mcp", "reference", 21],
    ]);
    expect(pages[0]?.html).toContain("https://example.com/reference");
    expect(pages[1]?.codeBlocks[0]?.code).toBe("https://tools.example.com/mcp");
  });

  it("replaces defaults by locale and slug without dropping local pages", () => {
    const defaults = createIntegrationDocs({ ...config, webhooks: true });
    const pages = defaults.map((page) => ({
      ...page,
      description: "App-owned description",
    }));
    const extra = pages.map((page) => ({
      ...page,
      slug: `extra-${page.slug}`,
      path: `/docs/extra-${page.slug}`,
      order: page.order + 10,
    }));
    const result = createIntegrationDocs({
      ...config,
      webhooks: true,
      pages: [...pages, ...extra],
    });
    expect(result).toEqual([...pages, ...extra]);
    expect(() =>
      createDocsSource({ pages: result, locales: ["en", "fr"] }),
    ).not.toThrow();
  });

  it("opts into webhook pages independently with locale parity and stable orders", () => {
    const pages = createIntegrationDocs({
      ...config,
      api: false,
      mcp: false,
      webhooks: true,
    });
    expect(
      pages.map((page) => [page.slug, page.locale, page.path, page.order]),
    ).toEqual([
      ["webhooks", "en", "/docs/webhooks", 1002],
      ["webhooks", "fr", "/docs/webhooks", 1002],
    ]);
    expect(() =>
      createDocsSource({ pages, locales: ["en", "fr"] }),
    ).not.toThrow();
    expect(createIntegrationDocs({ ...config, webhooks: false })).toEqual(
      createIntegrationDocs(config),
    );
    const all = createIntegrationDocs({ ...config, webhooks: true });
    expect(all).toHaveLength(6);
    expect(() =>
      createDocsSource({ pages: all, locales: ["en", "fr"] }),
    ).not.toThrow();
  });

  it("renders sender event schemas and localized policies with catalog settings", () => {
    const payload = Schema.Struct({
      event: Schema.Literal("example.created"),
      data: Schema.Struct({ id: Schema.String }).annotate({
        identifier: "ExampleData",
      }),
    }).annotate({ identifier: "ExampleCreated" });
    const pages = createIntegrationDocs({
      ...config,
      api: false,
      mcp: false,
      webhooks: {
        events: [
          {
            name: "example.created",
            description: {
              en: "An example was created.",
              fr: "Un exemple a été créé.",
            },
            payload,
          },
        ],
        verification: {
          en: "Use the sender verifier.",
          fr: "Utilisez le vérificateur de l’émetteur.",
        },
        delivery: {
          en: "No automatic retries.",
          fr: "Aucune nouvelle tentative automatique.",
        },
      },
      basePath: "/help/",
      section: "reference",
      order: 20,
      locales: ["fr"],
    });
    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({
      path: "/help/webhooks",
      section: "reference",
      order: 22,
      locale: "fr",
    });
    expect(pages[0]?.source).toContain("Un exemple a été créé.");
    expect(pages[0]?.source).toContain(
      "Utilisez le vérificateur de l’émetteur.",
    );
    expect(pages[0]?.source).toContain(
      "Aucune nouvelle tentative automatique.",
    );
    expect(pages[0]?.source).not.toContain("An example was created.");
    expect(pages[0]?.codeBlocks).toHaveLength(0);
    expect(pages[0]?.source).toContain("| `data.id` | `string` | Oui |");
    expect(pages[0]?.html).toContain('href="#charge-utile-1"');
  });

  it("renders all event references in both languages from the supplied schemas", () => {
    const events = ["example.created", "example.deleted"].map((name) => ({
      name,
      description: { en: `English ${name}`, fr: `Français ${name}` },
      payload: Schema.Struct({ id: Schema.Finite }).annotate({
        identifier: "NumericPayload",
      }),
    }));
    const pages = createIntegrationDocs({
      ...config,
      api: false,
      mcp: false,
      webhooks: { events },
    });
    expect(() =>
      createDocsSource({ pages, locales: ["en", "fr"] }),
    ).not.toThrow();
    for (const page of pages) {
      expect(page.codeBlocks).toHaveLength(0);
      expect(
        page.headings
          .filter((heading) => heading.depth === 3)
          .map((heading) => heading.title),
      ).toEqual([page.locale === "fr" ? "Charge utile 1" : "Payload 1"]);
      for (const event of events) {
        expect(page.source).toContain(
          page.locale === "fr" ? event.description.fr : event.description.en,
        );
      }
      expect(page.source).toContain("| `id` | `number` |");
    }
  });

  it("keeps schema annotations inside table cells instead of creating code blocks", () => {
    const pages = createIntegrationDocs({
      ...config,
      api: false,
      mcp: false,
      locales: ["en"],
      webhooks: {
        events: [
          {
            name: "example.created",
            description: { en: "Example", fr: "Exemple" },
            payload: Schema.String.annotate({
              identifier: "FencedPayload",
              description: "```json",
            }),
          },
        ],
      },
    });
    expect(pages[0]?.codeBlocks).toHaveLength(0);
    expect(pages[0]?.source).toContain("&#96;&#96;&#96;json");
  });
});
