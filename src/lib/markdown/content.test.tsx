import { describe, expect, it } from "@effect/vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { compileMarkdown } from "./server";

import { MarkdownContent } from "./content";

describe("MarkdownContent", () => {
  it("renders compiled prose and highlighted code", () => {
    const compiled = compileMarkdown(`Read **this**.

\`\`\`ts
const answer = 42;
\`\`\``);
    const html = renderToStaticMarkup(
      <MarkdownContent codeBlocks={compiled.codeBlocks} html={compiled.html} />,
    );

    expect(html).toContain("<strong>this</strong>");
    expect(html).toContain("th-keyword");
    expect(html).toContain("answer");
    expect(html).not.toContain("markdown-code-block");
  });
});
