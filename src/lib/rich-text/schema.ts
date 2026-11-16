import { Schema } from "effect";

export const RichTextLink = Schema.String.check(
  Schema.isMaxLength(2000),
  Schema.makeFilter((value) => {
    if (/[\s\p{Cc}\\{}]/u.test(value)) return false;
    const url = URL.parse(value);
    return (
      url !== null &&
      ["https:", "mailto:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  }),
).annotate({ identifier: "RichTextLink" });

export const RichTextMarks = Schema.Struct({
  bold: Schema.optional(Schema.Boolean),
  italic: Schema.optional(Schema.Boolean),
  underline: Schema.optional(Schema.Boolean),
  href: Schema.optional(RichTextLink),
}).annotate({ identifier: "RichTextMarks" });

export const RichTextInline = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("text"),
    text: Schema.String.check(Schema.isMaxLength(20000)),
    marks: Schema.optional(RichTextMarks),
  }),
  Schema.Struct({
    type: Schema.Literal("variable"),
    key: Schema.String.check(Schema.isPattern(/^[a-zA-Z][a-zA-Z0-9_.]{0,79}$/)),
    marks: Schema.optional(RichTextMarks),
  }),
]).annotate({ identifier: "RichTextInline" });

export const RichTextBlockKind = Schema.Literals([
  "paragraph",
  "heading",
  "bullet",
  "numbered",
]).annotate({ identifier: "RichTextBlockKind" });
export const RichTextDocument = Schema.Struct({
  version: Schema.Literal(1),
  blocks: Schema.Array(
    Schema.Struct({
      type: RichTextBlockKind,
      content: Schema.Array(RichTextInline).check(Schema.isMaxLength(2000)),
    }),
  ).check(Schema.isMinLength(1), Schema.isMaxLength(100)),
})
  .check(
    Schema.makeFilter(
      (value) =>
        value.blocks.reduce(
          (size, block) =>
            size +
            block.content.reduce(
              (count, inline) =>
                count + (inline.type === "text" ? inline.text.length : 1),
              0,
            ),
          0,
        ) <= 20000,
    ),
  )
  .annotate({ identifier: "RichTextDocument" });

export const RichTextVariable = Schema.Struct({
  key: Schema.String.check(Schema.isPattern(/^[a-zA-Z][a-zA-Z0-9_.]{0,79}$/)),
  label: Schema.String,
  type: Schema.Literals(["text", "url"]),
  sample: Schema.String,
}).annotate({ identifier: "RichTextVariable" });

export type RichTextDocument = typeof RichTextDocument.Type;
export type RichTextInline = typeof RichTextInline.Type;
export type RichTextMarks = typeof RichTextMarks.Type;
export type RichTextBlockKind = typeof RichTextBlockKind.Type;
export type RichTextVariable = typeof RichTextVariable.Type;
