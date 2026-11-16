import { Effect, Schema } from "effect";
import { renderToStaticMarkup } from "react-dom/server";
import type { CSSProperties, ReactNode } from "react";
import {
  RichTextLink,
  type RichTextDocument,
  type RichTextInline,
} from "@/lib/rich-text/schema";
import { richTextPlainText } from "@/lib/rich-text/model";
import { EmailRenderInput } from "./schema";
import { interpolateEmailText, validateEmailDocument } from "./model";

export class EmailDocumentRenderError extends Schema.TaggedError<
  EmailDocumentRenderError,
  { readonly brand: unique symbol }
>()("EmailDocumentRenderError", { reason: Schema.String }) {}
const fonts = {
  sans: "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', monospace",
};
const inline = (
  node: RichTextInline,
  values: Readonly<Record<string, string>>,
) => {
  let content: ReactNode = node.type === "text" ? node.text : values[node.key];
  if (node.marks?.bold) content = <strong>{content}</strong>;
  if (node.marks?.italic) content = <em>{content}</em>;
  if (node.marks?.underline) content = <u>{content}</u>;
  if (node.marks?.href)
    content = (
      <a href={node.marks.href} style={{ color: "inherit" }}>
        {content}
      </a>
    );
  return content;
};
const richContent = (
  value: RichTextDocument,
  values: Readonly<Record<string, string>>,
) =>
  value.blocks.flatMap((block, index) => {
    if (
      (block.type === "bullet" || block.type === "numbered") &&
      value.blocks[index - 1]?.type === block.type
    )
      return [];
    const content = block.content.map((node, key) => (
      <span key={key}>{inline(node, values)}</span>
    ));
    if (block.type === "heading")
      return (
        <h2
          key={index}
          style={{ margin: "0 0 12px", fontSize: 26, lineHeight: 1.25 }}
        >
          {content}
        </h2>
      );
    if (block.type === "bullet" || block.type === "numbered") {
      const List = block.type === "bullet" ? "ul" : "ol";
      const end = value.blocks.findIndex(
        (next, nextIndex) => nextIndex > index && next.type !== block.type,
      );
      const items = value.blocks.slice(index, end < 0 ? undefined : end);
      return (
        <List key={index} style={{ margin: "0 0 8px", paddingLeft: 24 }}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>
              {item.content.map((node, key) => (
                <span key={key}>{inline(node, values)}</span>
              ))}
            </li>
          ))}
        </List>
      );
    }
    return (
      <p key={index} style={{ margin: "0 0 12px", minHeight: 20 }}>
        {content.length ? content : <br />}
      </p>
    );
  });

/** The same validated document produces HTML and plain text; no executable templates. */
export const renderEmailDocument = Effect.fn("EmailDocument.render")(function* (
  input: EmailRenderInput,
) {
  const decoded = yield* Schema.decodeEffect(EmailRenderInput)(input).pipe(
    Effect.mapError(
      () => new EmailDocumentRenderError({ reason: "invalid-document" }),
    ),
  );
  const issues = validateEmailDocument(decoded);
  if (issues.length)
    return yield* new EmailDocumentRenderError({
      reason: issues
        .map((issue) => `${issue.code}${issue.key ? `:${issue.key}` : ""}`)
        .join(", "),
    });
  const { document, values } = decoded;
  const theme = document.appearance;
  const interpolate = (value: string) => interpolateEmailText(value, values);
  const subject = interpolate(document.subject).replace(/[\r\n]/g, " ");
  const renderedElements = document.elements.map((element) => {
    let content: ReactNode;
    switch (element.type) {
      case "text":
        content = richContent(element.content, values);
        break;
      case "button": {
        const href =
          element.destination.type === "url"
            ? element.destination.url
            : values[element.destination.key];
        if (!Schema.is(RichTextLink)(href)) return null;
        content = (
          <table
            role="presentation"
            cellPadding={0}
            cellSpacing={0}
            style={{ display: "inline-table" }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    backgroundColor: theme.primary,
                    borderRadius: 6,
                    padding: "13px 24px",
                  }}
                >
                  <a
                    href={href}
                    style={{
                      color: theme.primaryText,
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    {interpolate(element.label)}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        );
        break;
      }
      case "code":
        content = (
          <div
            style={{
              padding: "18px 24px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontFamily: fonts.mono,
              fontSize: 32,
              letterSpacing: 6,
              fontWeight: 700,
            }}
          >
            {values[element.variable]}
          </div>
        );
        break;
      case "logo":
      case "image":
        content = (
          <img
            src={element.src}
            alt={element.alt}
            width={element.width}
            style={{
              maxWidth: "100%",
              height: "auto",
              display: "inline-block",
              border: 0,
            }}
          />
        );
        break;
      case "divider":
        content = (
          <hr
            style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: 0 }}
          />
        );
        break;
      case "spacer":
        content = (
          <div
            style={{
              height: element.height,
              lineHeight: `${element.height}px`,
            }}
          >
            &nbsp;
          </div>
        );
        break;
    }
    return (
      <tr key={element.id}>
        <td
          style={{
            paddingTop: element.paddingTop,
            paddingBottom: element.paddingBottom,
            textAlign: element.alignment,
          }}
        >
          {content}
        </td>
      </tr>
    );
  });
  const bodyStyle: CSSProperties = {
    margin: 0,
    padding: 0,
    backgroundColor: theme.background,
    color: theme.text,
    fontFamily: fonts[theme.font],
  };
  const html = yield* Effect.try({
    try: () =>
      "<!DOCTYPE html>" +
      renderToStaticMarkup(
        <html>
          <head>
            <meta charSet="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <title>{subject}</title>
          </head>
          <body style={bodyStyle}>
            <div
              style={{
                display: "none",
                maxHeight: 0,
                overflow: "hidden",
                opacity: 0,
              }}
            >
              {interpolate(document.preview)}
            </div>
            <table
              role="presentation"
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              style={bodyStyle}
            >
              <tbody>
                <tr>
                  <td align="center" style={{ padding: "32px 12px" }}>
                    <table
                      role="presentation"
                      width="100%"
                      cellPadding={0}
                      cellSpacing={0}
                      style={{
                        maxWidth: 600,
                        backgroundColor: theme.surface,
                        borderRadius: theme.radius,
                      }}
                    >
                      <tbody>
                        <tr>
                          <td
                            style={{
                              padding: 32,
                              fontSize: 16,
                              lineHeight: 1.6,
                            }}
                          >
                            <table
                              role="presentation"
                              width="100%"
                              cellPadding={0}
                              cellSpacing={0}
                            >
                              <tbody>{renderedElements}</tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>,
      ),
    catch: () => new EmailDocumentRenderError({ reason: "render-failed" }),
  });
  const text = document.elements
    .map((element) => {
      switch (element.type) {
        case "text":
          return richTextPlainText(element.content, values);
        case "button":
          return `${interpolate(element.label)}: ${element.destination.type === "url" ? element.destination.url : values[element.destination.key]}`;
        case "code":
          return values[element.variable];
        case "image":
        case "logo":
          return element.alt;
        case "divider":
          return "---";
        case "spacer":
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
  return { subject, html, text };
});
