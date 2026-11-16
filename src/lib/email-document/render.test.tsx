import { describe, expect, it } from "@effect/vitest";
import { Effect, Exit, Schema } from "effect";
import { EmailDocument } from "./schema";
import { validateEmailDocument } from "./model";
import { renderEmailDocument } from "./render";
import { richTextFromString } from "@/lib/rich-text/model";

const common = { alignment: "left", paddingTop: 8, paddingBottom: 8 } as const;
const document: EmailDocument = {
  version: 1,
  subject: "{{appName}} sign-in",
  preview: "Your code",
  appearance: {
    background: "#f4f4f5",
    surface: "#ffffff",
    text: "#18181b",
    primary: "#4338ca",
    primaryText: "#ffffff",
    font: "sans",
    radius: 12,
  },
  elements: [
    {
      ...common,
      id: "intro",
      type: "text",
      content: richTextFromString("Before code"),
    },
    { ...common, id: "code", type: "code", variable: "code" },
    {
      ...common,
      id: "button",
      type: "button",
      label: "Continue",
      destination: { type: "variable", key: "url" },
    },
  ],
};
const variables = [
  { key: "appName", type: "text", sample: "App", label: "App" },
  { key: "code", type: "text", sample: "123456", label: "Code" },
  { key: "url", type: "url", sample: "https://example.com", label: "URL" },
] as const;
const input = {
  document,
  variables,
  values: {
    appName: "<App>\r\nSubject",
    code: "<123456>",
    url: "https://example.com/account",
  },
  requiredVariables: ["code"],
};

describe("email document rendering", () => {
  it.effect("keeps consecutive numbered items in a single ordered list", () =>
    Effect.gen(function* () {
      const output = yield* renderEmailDocument({
        ...input,
        requiredVariables: [],
        document: {
          ...document,
          elements: [
            {
              ...common,
              id: "list",
              type: "text",
              content: {
                version: 1,
                blocks: [
                  {
                    type: "numbered",
                    content: [{ type: "text", text: "First" }],
                  },
                  {
                    type: "numbered",
                    content: [{ type: "text", text: "Second" }],
                  },
                ],
              },
            },
          ],
        },
      });
      expect(output.html.match(/<ol /g)).toHaveLength(1);
      expect(output.html.match(/<li>/g)).toHaveLength(2);
    }),
  );
  it.effect(
    "renders escaped values and follows the same element order in HTML and text",
    () =>
      Effect.gen(function* () {
        const output = yield* renderEmailDocument(input);
        expect(output.subject).toBe("<App>  Subject sign-in");
        expect(output.html).toContain("&lt;123456&gt;");
        expect(output.html).not.toContain("<123456>");
        expect(output.html.indexOf("Before code")).toBeLessThan(
          output.html.indexOf("&lt;123456&gt;"),
        );
        expect(output.text.indexOf("Before code")).toBeLessThan(
          output.text.indexOf("<123456>"),
        );
        const reversed = yield* renderEmailDocument({
          ...input,
          document: { ...document, elements: [...document.elements].reverse() },
        });
        expect(reversed.text.indexOf("Continue")).toBeLessThan(
          reversed.text.indexOf("Before code"),
        );
      }),
  );
  it.effect("rejects unsafe URL values before rendering", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        renderEmailDocument({
          ...input,
          values: { ...input.values, url: "javascript:alert(1)" },
        }),
      );
      expect(Exit.isFailure(exit)).toBe(true);
    }),
  );
  it("does not satisfy a required body variable using subject text alone", () => {
    const next = {
      ...document,
      subject: "{{code}}",
      elements: document.elements.filter((element) => element.type !== "code"),
    };
    expect(validateEmailDocument({ ...input, document: next })).toContainEqual({
      code: "missing-required-variable",
      key: "code",
    });
  });
  it("rejects duplicate IDs, unknown variables and missing values", () => {
    expect(
      Schema.is(EmailDocument)({
        ...document,
        elements: [...document.elements, ...document.elements],
      }),
    ).toBe(false);
    expect(validateEmailDocument({ ...input, variables: [] })).toContainEqual({
      code: "unknown-variable",
      key: "code",
    });
    expect(validateEmailDocument({ ...input, values: {} })).toContainEqual({
      code: "missing-variable",
      key: "code",
    });
  });
});
