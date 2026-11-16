import { m } from "@/paraglide/messages";
import { richTextFromString } from "@/lib/rich-text/model";
import type {
  RichTextDocument,
  RichTextVariable,
} from "@/lib/rich-text/schema";
import type { EmailDocument } from "@/lib/email-document/schema";

export const emailExampleVariables = (
  locale: "en" | "fr",
): readonly RichTextVariable[] => [
  {
    key: "appName",
    label: m.email_editor_demo_brand_variable({}, { locale }),
    type: "text",
    sample: "KrakStack",
  },
  {
    key: "firstName",
    label: m.email_editor_demo_user_variable({}, { locale }),
    type: "text",
    sample: "Alex",
  },
  {
    key: "code",
    label: m.email_editor_demo_code_variable({}, { locale }),
    type: "text",
    sample: "482 916",
  },
  {
    key: "accountUrl",
    label: m.email_editor_demo_url_variable({}, { locale }),
    type: "url",
    sample: "https://example.com/account",
  },
];
export const emailExampleMessage = (locale: "en" | "fr"): RichTextDocument => ({
  version: 1,
  blocks: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: m.email_editor_demo_greeting({}, { locale }) },
        { type: "variable", key: "firstName" },
        {
          type: "text",
          text: m.email_editor_demo_body({}, { locale }).split("\n")[0] ?? ",",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: m.email_editor_demo_body({}, { locale }).split("\n")[1] ?? "",
        },
        { type: "variable", key: "appName" },
        { type: "text", text: m.email_editor_demo_body_end({}, { locale }) },
      ],
    },
  ],
});
export const emailExampleDocument = (locale: "en" | "fr"): EmailDocument => {
  const common = {
    alignment: "left",
    paddingTop: 8,
    paddingBottom: 8,
  } as const;
  return {
    version: 1,
    subject: m.email_editor_demo_subject(
      { appName: "{{appName}}" },
      { locale },
    ),
    preview: m.email_editor_demo_preheader({}, { locale }),
    appearance: {
      background: "#f0f1f4",
      surface: "#ffffff",
      text: "#27272a",
      primary: "#4338ca",
      primaryText: "#ffffff",
      font: "sans",
      radius: 12,
    },
    elements: [
      {
        ...common,
        id: "logo",
        type: "logo",
        src: "https://krakstack.net/favicon.svg",
        alt: "KrakStack",
        width: 44,
        paddingBottom: 20,
      },
      {
        ...common,
        id: "heading",
        type: "text",
        content: {
          ...richTextFromString(m.email_editor_demo_heading({}, { locale })),
          blocks: [
            {
              type: "heading",
              content: [
                {
                  type: "text",
                  text: m.email_editor_demo_heading({}, { locale }),
                },
              ],
            },
          ],
        },
      },
      {
        ...common,
        id: "message",
        type: "text",
        content: emailExampleMessage(locale),
      },
      {
        ...common,
        id: "code",
        type: "code",
        variable: "code",
        alignment: "center",
        paddingTop: 16,
        paddingBottom: 16,
      },
      {
        ...common,
        id: "action",
        type: "button",
        label: m.email_editor_demo_action({}, { locale }),
        destination: { type: "variable", key: "accountUrl" },
        alignment: "center",
      },
      {
        ...common,
        id: "divider",
        type: "divider",
        paddingTop: 24,
        paddingBottom: 16,
      },
      {
        ...common,
        id: "footer",
        type: "text",
        content: richTextFromString(m.email_editor_demo_footer({}, { locale })),
      },
    ],
  };
};
