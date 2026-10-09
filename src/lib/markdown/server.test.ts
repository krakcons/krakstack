import { describe, expect, it } from "@effect/vitest";

import { compileMarkdown } from "./server";

describe("Markdown compiler", () => {
  it("escapes inline code exactly once", () => {
    const result = compileMarkdown(
      '`SingleRunner.layer({ runnerStorage: "memory" })` `<script> &quot; &`',
    );

    expect(result.html).toContain(
      "<code data-inline-code>SingleRunner.layer({ runnerStorage: &quot;memory&quot; })</code>",
    );
    expect(result.html).toContain(
      "<code data-inline-code>&lt;script&gt; &amp;quot; &amp;</code>",
    );
    expect(result.html).not.toContain("<script>");
  });

  it("renders incomplete streamed Markdown safely", () => {
    const emphasis = compileMarkdown("A **partial");
    const fence = compileMarkdown("```ts\nconst answer = 42;");

    expect(emphasis.html).toContain("**partial");
    expect(fence.codeBlocks).toEqual([
      { code: "const answer = 42;", language: "ts" },
    ]);
    expect(fence.html).toContain(
      '<markdown-code-block data-index="0"></markdown-code-block>',
    );
  });

  it("escapes raw HTML and blocks unsafe URLs", () => {
    const result = compileMarkdown(
      "<script>alert(1)</script> [unsafe](javascript:alert(1))",
    );

    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).toContain('href="#"');
  });
});
