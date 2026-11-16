import { Schema } from "effect";
import { useEffect, useMemo, useState } from "react";
import { EmailEditor } from "@/components/ui/email-editor";
import {
  EmailDocument,
  type EmailRenderResult,
} from "@/lib/email-document/schema";
import { previewEmailDocument } from "@/lib/email-editor-preview";
import { interpolateEmailText } from "@/lib/email-document/model";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import {
  emailExampleDocument,
  emailExampleVariables,
} from "./email-editor-example";

export const EmailEditorPreview = () => {
  const [locale, setLocale] = useState<"en" | "fr">(
    getLocale() === "fr" ? "fr" : "en",
  );
  const [documents, setDocuments] = useState(() => ({
    en: emailExampleDocument("en"),
    fr: emailExampleDocument("fr"),
  }));
  const value = documents[locale];
  const variables = useMemo(() => emailExampleVariables(locale), [locale]);
  const [preview, setPreview] = useState<
    (EmailRenderResult & { preheader: string }) | null
  >(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setBusy(true);
      if (!Schema.is(EmailDocument)(value)) {
        setFailed(true);
        setBusy(false);
        return;
      }
      void previewEmailDocument({
        data: {
          document: value,
          variables,
          values: Object.fromEntries(
            variables.map((variable) => [variable.key, variable.sample]),
          ),
          requiredVariables: ["code"],
        },
      }).then(
        (result) => {
          if (active) {
            setPreview({
              ...result,
              preheader: interpolateEmailText(
                value.preview,
                Object.fromEntries(
                  variables.map((variable) => [variable.key, variable.sample]),
                ),
              ),
            });
            setFailed(false);
            setBusy(false);
          }
        },
        () => {
          if (active) {
            setFailed(true);
            setBusy(false);
          }
        },
      );
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, variables]);
  const delivery = (
    <div className="space-y-3" aria-busy={busy}>
      {busy ? (
        <p role="status" className="text-muted-foreground text-xs">
          {m.email_editor_demo_preview_loading()}
        </p>
      ) : null}
      {failed ? (
        <p role="alert" className="text-destructive text-xs">
          {m.email_editor_demo_preview_error()}
        </p>
      ) : null}
      {preview ? (
        <>
          <dl className="bg-muted/30 space-y-3 rounded-lg border p-3 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">
                {m.email_editor_demo_subject_label()}
              </dt>
              <dd className="font-medium break-words">{preview.subject}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">
                {m.email_editor_demo_preheader_label()}
              </dt>
              <dd className="break-words">{preview.preheader}</dd>
            </div>
          </dl>
          <iframe
            title={m.email_editor_demo_delivery()}
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={preview.html}
            className="h-[640px] w-full rounded-xl border bg-white"
          />
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-xs font-medium">
              {m.email_editor_demo_text()}
            </summary>
            <pre className="mt-3 overflow-auto text-xs whitespace-pre-wrap">
              {preview.text}
            </pre>
          </details>
        </>
      ) : null}
    </div>
  );
  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-3 text-xs font-medium">
        {m.email_editor_demo_locale()}
        <select
          value={locale}
          className="bg-background h-9 rounded-md border px-3"
          onChange={(event) =>
            setLocale(
              Schema.decodeUnknownSync(Schema.Literals(["en", "fr"]))(
                event.target.value,
              ),
            )
          }
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
      </label>
      <EmailEditor
        key={locale}
        value={value}
        variables={variables}
        requiredVariables={["code"]}
        locale={locale}
        preview={delivery}
        onChange={(document) =>
          setDocuments((current) => ({ ...current, [locale]: document }))
        }
      />
      <p className="text-muted-foreground text-xs">
        {m.email_editor_demo_help()}
      </p>
    </div>
  );
};
