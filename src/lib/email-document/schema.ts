import { Schema } from "effect";
import {
  RichTextDocument,
  RichTextLink,
  RichTextVariable,
} from "@/lib/rich-text/schema";

export const EmailImageUrl = RichTextLink.check(
  Schema.isPattern(/^https:\/\//),
).annotate({ identifier: "EmailImageUrl" });
export const EmailColor = Schema.String.check(
  Schema.isPattern(/^#[0-9a-fA-F]{6}$/),
).annotate({ identifier: "EmailColor" });
export const EmailAlignment = Schema.Literals([
  "left",
  "center",
  "right",
]).annotate({ identifier: "EmailAlignment" });
export const EmailFont = Schema.Literals(["sans", "serif", "mono"]).annotate({
  identifier: "EmailFont",
});
const spacing = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 96 }));
const common = {
  id: Schema.NonEmptyString.check(Schema.isMaxLength(80)),
  alignment: EmailAlignment,
  paddingTop: spacing,
  paddingBottom: spacing,
};
export const EmailDestination = Schema.Union([
  Schema.Struct({ type: Schema.Literal("url"), url: RichTextLink }),
  Schema.Struct({
    type: Schema.Literal("variable"),
    key: RichTextVariable.fields.key,
  }),
]).annotate({ identifier: "EmailDestination" });
export const EmailElement = Schema.Union([
  Schema.Struct({
    ...common,
    type: Schema.Literal("text"),
    content: RichTextDocument,
  }),
  Schema.Struct({
    ...common,
    type: Schema.Literal("button"),
    label: Schema.String.check(Schema.isMaxLength(200)),
    destination: EmailDestination,
  }),
  Schema.Struct({
    ...common,
    type: Schema.Literal("code"),
    variable: RichTextVariable.fields.key,
  }),
  Schema.Struct({
    ...common,
    type: Schema.Literals(["logo", "image"]),
    src: EmailImageUrl,
    alt: Schema.String.check(Schema.isMaxLength(200)),
    width: Schema.Int.check(Schema.isBetween({ minimum: 32, maximum: 560 })),
  }),
  Schema.Struct({ ...common, type: Schema.Literal("divider") }),
  Schema.Struct({ ...common, type: Schema.Literal("spacer"), height: spacing }),
]).annotate({ identifier: "EmailElement" });
const subject = Schema.String.check(
  Schema.isMaxLength(200),
  Schema.isPattern(/^[^\r\n]*$/),
);
export const EmailDocument = Schema.Struct({
  version: Schema.Literal(1),
  subject,
  preview: subject,
  appearance: Schema.Struct({
    background: EmailColor,
    surface: EmailColor,
    text: EmailColor,
    primary: EmailColor,
    primaryText: EmailColor,
    font: EmailFont,
    radius: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 32 })),
  }),
  elements: Schema.Array(EmailElement).check(Schema.isMaxLength(40)),
})
  .check(
    Schema.makeFilter(
      (document) =>
        new Set(document.elements.map((element) => element.id)).size ===
        document.elements.length,
    ),
  )
  .annotate({ identifier: "EmailDocument" });
export const EmailRenderInput = Schema.Struct({
  document: EmailDocument,
  variables: Schema.Array(RichTextVariable),
  values: Schema.Record(Schema.String, Schema.String),
  requiredVariables: Schema.optional(Schema.Array(Schema.String)),
}).annotate({ identifier: "EmailRenderInput" });
export const EmailRenderResult = Schema.Struct({
  subject: Schema.String,
  html: Schema.String,
  text: Schema.String,
}).annotate({ identifier: "EmailRenderResult" });
export type EmailDocument = typeof EmailDocument.Type;
export type EmailElement = typeof EmailElement.Type;
export type EmailDestination = typeof EmailDestination.Type;
export type EmailRenderInput = typeof EmailRenderInput.Type;
export type EmailRenderResult = typeof EmailRenderResult.Type;
