import { Schema } from "effect";
import {
  RichTextDocument,
  RichTextMarks,
  type RichTextInline,
  type RichTextBlockKind,
} from "./schema";

export type TextSelection = { from: number; to: number };
export type RichTextEdit = {
  value: RichTextDocument;
  selection: TextSelection;
};
type Unit = RichTextInline | { type: "break"; next: RichTextBlockKind };
const sameMarks = Schema.toEquivalence(RichTextMarks);

export const emptyRichText = (): RichTextDocument => ({
  version: 1,
  blocks: [{ type: "paragraph", content: [] }],
});
export const richTextFromString = (text: string): RichTextDocument => ({
  version: 1,
  blocks: text.split(/\r\n?|\n/).map((line) => ({
    type: "paragraph",
    content: line ? [{ type: "text", text: line }] : [],
  })),
});
export const richTextPlainText = (
  value: RichTextDocument,
  variables?: Readonly<Record<string, string>>,
) =>
  value.blocks
    .map((block) =>
      block.content
        .map((inline) =>
          inline.type === "text"
            ? inline.text
            : (variables?.[inline.key] ?? `{{${inline.key}}}`),
        )
        .join(""),
    )
    .join("\n");

/** Convert plain template tokens to atomic variables without changing their keys. */
export const richTextFromTemplate = (text: string): RichTextDocument => ({
  version: 1,
  blocks: [{
    type: "paragraph",
    content: text.split(/(\{\{[a-zA-Z][a-zA-Z0-9_.]*\}\})/g).filter(Boolean).map((part) =>
      /^\{\{[a-zA-Z][a-zA-Z0-9_.]*\}\}$/.test(part)
        ? { type: "variable", key: part.slice(2, -2) }
        : { type: "text", text: part },
    ),
  }],
});

const units = (value: RichTextDocument): Unit[] =>
  value.blocks.flatMap((block, index) => [
    ...(index ? [{ type: "break", next: block.type } satisfies Unit] : []),
    ...block.content.flatMap<Unit>((inline) =>
      inline.type === "text"
        ? inline.text.split("").map((text) => ({ ...inline, text }))
        : [inline],
    ),
  ]);

const fromUnits = (
  content: readonly Unit[],
  first: RichTextBlockKind,
): RichTextDocument => {
  const blocks: Array<{ type: RichTextBlockKind; content: RichTextInline[] }> =
    [{ type: first, content: [] }];
  for (const unit of content) {
    if (unit.type === "break") {
      blocks.push({ type: unit.next, content: [] });
      continue;
    }
    const target = blocks.at(-1);
    if (!target) continue;
    const previous = target.content.at(-1);
    if (
      unit.type === "text" &&
      previous?.type === "text" &&
      sameMarks(previous.marks ?? {}, unit.marks ?? {})
    ) {
      target.content[target.content.length - 1] = {
        ...previous,
        text: previous.text + unit.text,
      };
    } else target.content.push(unit);
  }
  return { version: 1, blocks };
};

export const replaceRichText = (
  value: RichTextDocument,
  selection: TextSelection,
  inserted: RichTextInline,
): RichTextEdit => {
  const content = units(value);
  const from = Math.max(0, Math.min(selection.from, content.length));
  const to = Math.max(from, Math.min(selection.to, content.length));
  const additions: Unit[] =
    inserted.type === "text"
      ? inserted.text
          .replace(/\r\n?/g, "\n")
          .split("")
          .map((text) =>
            text === "\n"
              ? { type: "break", next: "paragraph" }
              : { type: "text", text, marks: inserted.marks },
          )
      : [inserted];
  const next = fromUnits(
    [...content.slice(0, from), ...additions, ...content.slice(to)],
    value.blocks[0]?.type ?? "paragraph",
  );
  const position = from + additions.length;
  return { value: next, selection: { from: position, to: position } };
};

export const formatRichText = (
  value: RichTextDocument,
  selection: TextSelection,
  mark: keyof RichTextMarks,
  setting: string | boolean | undefined,
): RichTextDocument =>
  fromUnits(
    units(value).map((unit, index) => {
      if (
        unit.type === "break" ||
        index < selection.from ||
        index >= selection.to
      )
        return unit;
      const marks = { ...unit.marks, [mark]: setting };
      return { ...unit, marks };
    }),
    value.blocks[0]?.type ?? "paragraph",
  );

export const setRichTextBlock = (
  value: RichTextDocument,
  selection: TextSelection,
  type: RichTextBlockKind,
): RichTextDocument => {
  let offset = 0;
  return {
    ...value,
    blocks: value.blocks.map((block) => {
      const start = offset;
      offset +=
        block.content.reduce(
          (size, inline) =>
            size + (inline.type === "text" ? inline.text.length : 1),
          0,
        ) + 1;
      return selection.from < offset && selection.to >= start
        ? { ...block, type }
        : block;
    }),
  };
};

export const richTextLength = (value: RichTextDocument) => units(value).length;
export const richTextMarksAt = (
  value: RichTextDocument,
  position: number,
): RichTextMarks => {
  const content = units(value);
  const unit = content[Math.max(0, position - 1)];
  return unit && unit.type !== "break" ? (unit.marks ?? {}) : {};
};
