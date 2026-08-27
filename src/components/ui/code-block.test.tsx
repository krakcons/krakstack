import { describe, expect, it } from "@effect/vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { CodeBlock } from "./code-block";

describe("CodeBlock", () => {
  it("renders highlighted tokens on the first render", () => {
    const html = renderToStaticMarkup(
      <CodeBlock code="const answer = 42;" language="typescript" />,
    );

    expect(html).toContain("th-keyword");
    expect(html).toContain("th-number");
    expect(html).toContain("--th-keyword: #cf222e");
    expect(html).toContain(".dark [data-code-theme]");
    expect(html).toContain("background: transparent");
    expect(html).toContain("answer");
  });
});
