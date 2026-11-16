// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { richTextPlainText } from "./model";
import {
  readRichTextDOM,
  writeRichTextDOM,
  restoreRichTextSelection,
  readEditorSelection,
} from "./dom";
import type { RichTextDocument } from "./schema";

describe("native rich text adapter", () => {
  it("round trips marks, lists, variables and selection without storing HTML", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const value: RichTextDocument = {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hi ", marks: { bold: true } },
            { type: "variable", key: "firstName" },
          ],
        },
        { type: "bullet", content: [{ type: "text", text: "One" }] },
      ],
    };
    writeRichTextDOM(root, value, [
      { key: "firstName", label: "First name", type: "text", sample: "Alex" },
    ]);
    const parsed = readRichTextDOM(root);
    expect(parsed.value?.blocks.map((block) => block.type)).toEqual([
      "paragraph",
      "bullet",
    ]);
    expect(parsed.value && richTextPlainText(parsed.value)).toBe(
      "Hi {{firstName}}\nOne",
    );
    restoreRichTextSelection(root, { from: 3, to: 4 });
    expect(readEditorSelection(root, readRichTextDOM(root).points)).toEqual({
      from: 3,
      to: 4,
    });
    root.remove();
  });
  it("normalizes browser DOM and drops scripts, styling and unsafe links", () => {
    const root = document.createElement("div");
    const paragraph = document.createElement("div");
    const script = document.createElement("script");
    script.textContent = "unsafe()";
    const anchor = document.createElement("a");
    anchor.href = "javascript:alert(1)";
    anchor.textContent = "Safe text";
    paragraph.append(anchor, script);
    root.append(paragraph);
    const parsed = readRichTextDOM(root);
    expect(parsed.value && richTextPlainText(parsed.value)).toBe("Safe text");
    expect(parsed.value?.blocks[0]?.content[0]?.marks?.href).toBeUndefined();
  });
});
