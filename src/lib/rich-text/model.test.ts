import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";
import { RichTextDocument, RichTextLink } from "./schema";
import {
  richTextFromString,
  richTextPlainText,
  richTextLength,
  replaceRichText,
  formatRichText,
  setRichTextBlock,
} from "./model";

describe("rich text model", () => {
  it("formats only the selection and preserves adjacent text", () => {
    const value = formatRichText(
      richTextFromString("Hello world"),
      { from: 6, to: 11 },
      "bold",
      true,
    );
    expect(value.blocks[0]?.content).toEqual([
      { type: "text", text: "Hello " },
      { type: "text", text: "world", marks: { bold: true } },
    ]);
    expect(richTextPlainText(value)).toBe("Hello world");
  });
  it("treats variables as a single editing unit and preserves paragraphs", () => {
    const inserted = replaceRichText(
      richTextFromString("Hi !"),
      { from: 3, to: 3 },
      { type: "variable", key: "firstName" },
    );
    expect(inserted.selection).toEqual({ from: 4, to: 4 });
    expect(richTextLength(inserted.value)).toBe(5);
    expect(richTextPlainText(inserted.value, { firstName: "<Alex>" })).toBe(
      "Hi <Alex>!",
    );
    const deleted = replaceRichText(
      inserted.value,
      { from: 3, to: 4 },
      { type: "text", text: "\n" },
    );
    expect(richTextPlainText(deleted.value)).toBe("Hi \n!");
    expect(Schema.is(RichTextDocument)(deleted.value)).toBe(true);
  });
  it("changes the active paragraph style without changing other paragraphs", () => {
    const value = setRichTextBlock(
      richTextFromString("One\nTwo"),
      { from: 4, to: 7 },
      "bullet",
    );
    expect(value.blocks.map((block) => block.type)).toEqual([
      "paragraph",
      "bullet",
    ]);
  });
  it("rejects unsafe links and oversized documents", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,unsafe",
      "http://example.com",
      "https://user:pass@example.com",
    ])
      expect(Schema.is(RichTextLink)(value)).toBe(false);
    expect(Schema.is(RichTextLink)("https://example.com/account")).toBe(true);
    expect(
      Schema.is(RichTextDocument)(richTextFromString("a".repeat(20001))),
    ).toBe(false);
  });
});
