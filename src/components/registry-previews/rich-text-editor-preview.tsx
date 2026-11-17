import { useState } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { richTextPlainText } from "@/lib/rich-text/model";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import {
  emailExampleMessage,
  emailExampleVariables,
} from "./email-editor-example";

export const RichTextEditorPreview = () => {
  const locale = getLocale() === "fr" ? "fr" : "en";
  const [value, setValue] = useState(() => emailExampleMessage(locale));
  const variables = emailExampleVariables(locale);
  return (
    <div className="space-y-4">
      <RichTextEditor
        value={value}
        onChange={setValue}
        variables={variables}
        label={m.email_editor_demo_rich_label()}
        locale={locale}
      />
      <p className="text-muted-foreground text-sm">
        {m.email_editor_demo_rich_help()}
      </p>
      <pre className="overflow-auto rounded-lg border p-3 text-xs whitespace-pre-wrap">
        {richTextPlainText(value)}
      </pre>
    </div>
  );
};
