import { Schema } from "effect";
import {
  RichTextLink,
  type RichTextVariable,
  type RichTextDocument,
} from "@/lib/rich-text/schema";
import { richTextFromString } from "@/lib/rich-text/model";
import { EmailDocument, type EmailElement } from "./schema";

export const emailElementTypes = [
  "text",
  "button",
  "code",
  "logo",
  "image",
  "divider",
  "spacer",
] as const;
export type EmailElementType = (typeof emailElementTypes)[number];
export const newEmailElement = (
  type: EmailElementType,
  input: {
    id: string;
    text: string;
    button: string;
    imageAlt: string;
    codeVariable?: string;
    urlVariable?: string;
  },
): EmailElement => {
  const common = {
    id: input.id,
    alignment: "left",
    paddingTop: 8,
    paddingBottom: 8,
  } as const;
  switch (type) {
    case "text":
      return { ...common, type, content: richTextFromString(input.text) };
    case "button":
      return {
        ...common,
        type,
        label: input.button,
        destination: input.urlVariable
          ? { type: "variable", key: input.urlVariable }
          : { type: "url", url: "https://example.com" },
      };
    case "code":
      return { ...common, type, variable: input.codeVariable ?? "code" };
    case "logo":
    case "image":
      return {
        ...common,
        type,
        src: "https://krakstack.net/favicon.svg",
        alt: input.imageAlt,
        width: type === "logo" ? 48 : 160,
      };
    case "divider":
      return { ...common, type };
    case "spacer":
      return { ...common, type, height: 24 };
  }
};

export const interpolateEmailText = (
  text: string,
  values: Readonly<Record<string, string>>,
) =>
  text.replace(
    /\{\{([a-zA-Z][a-zA-Z0-9_.]*)\}\}/g,
    (token, key: string) => values[key] ?? token,
  );
/** Keep header templates as strings while editing variables as atomic rich-text nodes. */
export const richTextFromEmailText = (text: string): RichTextDocument => ({
  version: 1,
  blocks: [
    {
      type: "paragraph",
      content: text
        .split(/(\{\{[a-zA-Z][a-zA-Z0-9_.]*\}\})/g)
        .filter(Boolean)
        .map((part) =>
          /^\{\{[a-zA-Z][a-zA-Z0-9_.]*\}\}$/.test(part)
            ? { type: "variable", key: part.slice(2, -2) }
            : { type: "text", text: part },
        ),
    },
  ],
});
const textReferences = (text: string) =>
  [...text.matchAll(/\{\{([a-zA-Z][a-zA-Z0-9_.]*)\}\}/g)].map(
    (match) => match[1] ?? "",
  );
export const emailDocumentReferences = (document: EmailDocument) => [
  ...new Set([
    ...textReferences(document.subject),
    ...textReferences(document.preview),
    ...document.elements.flatMap((element) => {
      switch (element.type) {
        case "text":
          return element.content.blocks.flatMap((block) =>
            block.content.flatMap((inline) =>
              inline.type === "variable" ? [inline.key] : [],
            ),
          );
        case "code":
          return [element.variable];
        case "button":
          return [
            ...textReferences(element.label),
            ...(element.destination.type === "variable"
              ? [element.destination.key]
              : []),
          ];
        default:
          return [];
      }
    }),
  ]),
];

export type EmailDocumentIssue = {
  code:
    | "invalid-document"
    | "unknown-variable"
    | "missing-variable"
    | "invalid-url"
    | "missing-required-variable";
  key?: string;
};
export const validateEmailDocument = ({
  document,
  variables,
  values,
  requiredVariables = [],
}: {
  document: EmailDocument;
  variables: readonly RichTextVariable[];
  values?: Readonly<Record<string, string>>;
  requiredVariables?: readonly string[];
}): EmailDocumentIssue[] => {
  if (!Schema.is(EmailDocument)(document))
    return [{ code: "invalid-document" }];
  const references = emailDocumentReferences(document);
  const issues: EmailDocumentIssue[] = [];
  for (const key of references) {
    if (!variables.some((variable) => variable.key === key))
      issues.push({ code: "unknown-variable", key });
    if (values && !values[key]) issues.push({ code: "missing-variable", key });
  }
  for (const element of document.elements) {
    if (element.type === "button" && element.destination.type === "variable") {
      const key = element.destination.key;
      if (
        variables.find((variable) => variable.key === key)?.type !== "url" ||
        (values && !Schema.is(RichTextLink)(values[key]))
      )
        issues.push({ code: "invalid-url", key });
    }
  }
  for (const key of requiredVariables)
    if (
      !document.elements.some(
        (element) =>
          (element.type === "code" && element.variable === key) ||
          (element.type === "button" &&
            element.destination.type === "variable" &&
            element.destination.key === key) ||
          (element.type === "text" &&
            element.content.blocks.some((block) =>
              block.content.some(
                (inline) => inline.type === "variable" && inline.key === key,
              ),
            )),
      )
    )
      issues.push({ code: "missing-required-variable", key });
  return issues;
};
