import { Option, Schema } from "effect";
import {
  RichTextDocument,
  RichTextLink,
  RichTextMarks,
  type RichTextBlockKind,
  type RichTextInline,
  type RichTextVariable,
} from "./schema";
import { emptyRichText, type TextSelection } from "./model";

type Point = { node: Node; offset: number };
const blocks = new Set(["P", "DIV", "H1", "H2", "H3", "LI"]);
const sameMarks = Schema.toEquivalence(RichTextMarks);
const pointAfter = (node: Node): Point => ({
  node: node.parentNode ?? node,
  offset: Array.from<Node>(node.parentNode?.childNodes ?? []).indexOf(node) + 1,
});

/** Normalize browser editing DOM to the allowlisted model; never retain arbitrary HTML. */
export const readRichTextDOM = (root: HTMLElement) => {
  const result: Array<{ type: RichTextBlockKind; content: RichTextInline[] }> =
    [];
  const points: Point[] = [{ node: root, offset: 0 }];
  let current:
    { type: RichTextBlockKind; content: RichTextInline[] } | undefined;
  const begin = (type: RichTextBlockKind, point: Point) => {
    if (current) result.push(current);
    if (result.length) points.push(point);
    else points[0] = point;
    current = { type, content: [] };
  };
  const append = (inline: RichTextInline, point: Point) => {
    if (!current) begin("paragraph", point);
    const previous = current?.content.at(-1);
    if (
      inline.type === "text" &&
      previous?.type === "text" &&
      sameMarks(inline.marks ?? {}, previous.marks ?? {})
    ) {
      if (current)
        current.content[current.content.length - 1] = {
          ...previous,
          text: previous.text + inline.text,
        };
    } else current?.content.push(inline);
    points.push(point);
  };
  const visit = (
    node: Node,
    inherited: RichTextMarks = {},
    kind: RichTextBlockKind = "paragraph",
  ) => {
    if (node instanceof Text) {
      if (!current) begin(kind, { node, offset: 0 });
      for (let index = 0; index < node.data.length; index++)
        append(
          { type: "text", text: node.data[index] ?? "", marks: inherited },
          { node, offset: index + 1 },
        );
      return;
    }
    if (
      !(node instanceof HTMLElement) ||
      ["SCRIPT", "STYLE", "IFRAME"].includes(node.tagName)
    )
      return;
    const key = node.dataset.richVariable;
    if (key) {
      const variable = { type: "variable", key, marks: inherited } as const;
      append(variable, pointAfter(node));
      return;
    }
    const href = node.getAttribute("href");
    const marks = {
      bold: inherited.bold,
      italic: inherited.italic,
      underline: inherited.underline,
      href: inherited.href,
    };
    if (
      ["B", "STRONG"].includes(node.tagName) ||
      node.style.fontWeight === "700"
    )
      marks.bold = true;
    if (["I", "EM"].includes(node.tagName) || node.style.fontStyle === "italic")
      marks.italic = true;
    if (node.tagName === "U" || node.style.textDecoration.includes("underline"))
      marks.underline = true;
    if (href && Schema.is(RichTextLink)(href)) marks.href = href;
    const type =
      node.dataset.richKind === "bullet"
        ? "bullet"
        : node.dataset.richKind === "numbered"
          ? "numbered"
          : /^H[123]$/.test(node.tagName)
            ? "heading"
            : node.tagName === "LI"
              ? node.parentElement?.tagName === "OL"
                ? "numbered"
                : "bullet"
              : kind;
    const isBlock = blocks.has(node.tagName);
    const container =
      isBlock && [...node.children].some((child) => blocks.has(child.tagName));
    if (isBlock && !container) begin(type, { node, offset: 0 });
    if (node.tagName === "BR") {
      // An empty block's last BR is a browser caret placeholder.
      if (node.nextSibling) begin(kind, pointAfter(node));
      return;
    }
    for (const child of node.childNodes) visit(child, marks, type);
  };
  for (const child of root.childNodes) visit(child);
  if (current) result.push(current);
  const value = Option.getOrUndefined(
    Schema.decodeOption(RichTextDocument)({
      version: 1,
      blocks: result.length ? result : emptyRichText().blocks,
    }),
  );
  return { value, points };
};

export const readEditorSelection = (
  root: HTMLElement,
  points: readonly Point[],
): TextSelection | undefined => {
  const selection = root.ownerDocument.getSelection();
  if (
    !selection?.anchorNode ||
    !selection.focusNode ||
    !root.contains(selection.anchorNode) ||
    !root.contains(selection.focusNode)
  )
    return;
  const position = (node: Node, offset: number) => {
    const range = root.ownerDocument.createRange();
    range.setStart(node, offset);
    range.collapse(true);
    let result = 0;
    points.forEach((point, index) => {
      if (
        root.contains(point.node) &&
        range.comparePoint(point.node, point.offset) <= 0
      )
        result = index;
    });
    return result;
  };
  const anchor = position(selection.anchorNode, selection.anchorOffset);
  const focus = position(selection.focusNode, selection.focusOffset);
  return { from: Math.min(anchor, focus), to: Math.max(anchor, focus) };
};

export const restoreRichTextSelection = (
  root: HTMLElement,
  selection: TextSelection,
) => {
  const { points } = readRichTextDOM(root);
  const start = points[Math.min(selection.from, points.length - 1)];
  const end = points[Math.min(selection.to, points.length - 1)];
  if (!start || !end) return;
  const range = root.ownerDocument.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  root.ownerDocument.getSelection()?.removeAllRanges();
  root.ownerDocument.getSelection()?.addRange(range);
};

/** DOM creation, not HTML interpolation, keeps variable values and text escaped. */
export const writeRichTextDOM = (
  root: HTMLElement,
  value: RichTextDocument,
  variables: readonly RichTextVariable[],
) => {
  const children = value.blocks.map((block) => {
    const paragraph = root.ownerDocument.createElement(
      block.type === "heading" ? "h2" : "div",
    );
    if (block.type === "heading")
      paragraph.style.cssText = "font-size:1.4em;font-weight:700";
    if (block.type === "bullet" || block.type === "numbered") {
      paragraph.dataset.richKind = block.type;
      paragraph.style.cssText = `display:list-item;margin-left:1.5em;list-style-type:${block.type === "bullet" ? "disc" : "decimal"}`;
    }
    for (const inline of block.content) {
      const span = root.ownerDocument.createElement(
        inline.marks?.href ? "a" : "span",
      );
      if (inline.type === "variable") {
        span.dataset.richVariable = inline.key;
        span.contentEditable = "false";
        span.textContent = `{{${variables.find((item) => item.key === inline.key)?.label ?? inline.key}}}`;
        span.className =
          "mx-0.5 inline-block rounded bg-indigo-50 px-1 font-mono text-[0.85em] text-indigo-800";
      } else span.textContent = inline.text;
      if (inline.marks?.bold) span.style.fontWeight = "700";
      if (inline.marks?.italic) span.style.fontStyle = "italic";
      if (inline.marks?.underline) span.style.textDecoration = "underline";
      if (inline.marks?.href) {
        span.setAttribute("href", inline.marks.href);
        span.style.textDecoration = "underline";
      }
      paragraph.append(span);
    }
    if (!block.content.length)
      paragraph.append(root.ownerDocument.createElement("br"));
    return paragraph;
  });
  root.replaceChildren(...children);
};
