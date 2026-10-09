import { describe, expect, it } from "@effect/vitest";

import { createDocsSource, makeDocs } from "./docs";
import { compileMdxDocsPage } from "./docs.server";

describe("documentation search", () => {
  it("returns pages rather than individual section links", () => {
    const page = compileMdxDocsPage(
      "src/content/docs/en/example.mdx",
      `---
slug: example
path: /docs/example
title: Example
description: An example page.
order: 1
locale: en
section: start
type: tutorial
---

# Example

## Installation

Install the package.

## Installation options

Choose your options.`,
    );
    const docs = makeDocs({
      source: createDocsSource({ pages: [page], locales: ["en"] }),
      basePath: "/docs",
      defaultSlug: "introduction",
      origin: "https://example.com",
      siteName: "Example",
    });

    expect(docs.search("installation", "en")).toEqual([{ page }]);
    expect(docs.search("", "en")).toEqual([{ page }]);
    expect(docs.search("installation", "en", { limit: 1 })).toEqual([{ page }]);
    expect(docs.search("installation", "fr")).toEqual([]);
  });
});
