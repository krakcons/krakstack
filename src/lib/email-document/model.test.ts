import { describe, expect, it } from "@effect/vitest";
import { richTextFromEmailText } from "./model";
import { richTextPlainText } from "@/lib/rich-text/model";

describe("email header variable editing", () => {
  it("round trips templates and preserves malformed placeholders as text", () => {
    const text = "Hello {{firstName}} from {{app.name}}! {{not-valid}}";
    const document = richTextFromEmailText(text);
    expect(richTextPlainText(document)).toBe(text);
    expect(
      document.blocks[0]?.content.filter(
        (inline) => inline.type === "variable",
      ),
    ).toEqual([
      { type: "variable", key: "firstName" },
      { type: "variable", key: "app.name" },
    ]);
    expect(
      richTextPlainText(document, {
        firstName: "Alex",
        "app.name": "KrakStack",
      }),
    ).toBe("Hello Alex from KrakStack! {{not-valid}}");
  });

  it("keeps an empty header editable", () => {
    expect(richTextFromEmailText("")).toEqual({
      version: 1,
      blocks: [{ type: "paragraph", content: [] }],
    });
  });
});
