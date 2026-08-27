import { describe, expect, it } from "@effect/vitest";

import { compileDocsMarkdown, compileMdxDocsPage } from "./docs.server";

describe("docs server", () => {
  it("compiles GFM content with headings and safe links", () => {
    const result = compileDocsMarkdown(`## First step

| Name | Value |
| --- | --- |
| A | B |

[Safe](https://example.com) [Unsafe](javascript:alert(1))

\`\`\`ts
const answer = 42;
\`\`\`

<script>alert(1)</script>`);

    expect(result.headings).toEqual([
      { depth: 2, id: "first-step", title: "First step" },
    ]);
    expect(result.html).toContain("<table>");
    expect(result.html).toContain('href="https://example.com"');
    expect(result.html).toContain('href="#"');
    expect(result.html).toContain(
      '<docs-code-block data-index="0"></docs-code-block>',
    );
    expect(result.html).not.toContain("<script>");
    expect(result.codeBlocks).toEqual([
      {
        code: "const answer = 42;",
        language: "ts",
      },
    ]);
  });

  it("parses YAML frontmatter and validates the body title", () => {
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
tags: [Alpha]
---

# Example

## Begin

Read the **guide**.`,
    );

    expect(page.tags).toEqual(["Alpha"]);
    expect(page.headings).toEqual([{ depth: 2, id: "begin", title: "Begin" }]);
    expect(page.html).toContain("<strong>guide</strong>");
  });

  it("marks inline code separately from fenced code blocks", () => {
    const result = compileDocsMarkdown("Use `bun install`.");

    expect(result.html).toContain("<code data-inline-code>bun install</code>");
  });

  it("preserves JSX code without displaying HTML entities", () => {
    const result = compileDocsMarkdown(`\`\`\`tsx
<AppBrand
  to="/organizations/$organizationId"
  params={{ organizationId }}
/>
\`\`\``);

    expect(result.codeBlocks[0]?.code).toContain("<AppBrand");
    expect(result.codeBlocks[0]?.code).toContain('to="/organizations/');
  });
});
