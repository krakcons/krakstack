import {
  CopyButton,
  type CopyButtonMessages,
} from "@/components/ui/copy-button";
import { highlight } from "@tanstack/highlight";
import { createThemeCss } from "@tanstack/highlight/theme";
import { githubDarkTheme } from "@tanstack/highlight/themes/github-dark";
import { githubLightTheme } from "@tanstack/highlight/themes/github-light";

const themeCss = `${createThemeCss({
  light: githubLightTheme,
  dark: githubDarkTheme,
  lightSelector: "[data-code-theme]",
  darkSelector: ".dark [data-code-theme]",
  codeBlockSelector: "[data-code-theme] pre.th-code",
  lineNumbersSelector: "[data-code-theme] .th-code--line-numbers",
})}
[data-code-theme] pre.th-code {
  margin: 0;
  overflow: visible;
  background: transparent;
  font: inherit;
  color: inherit;
}
[data-code-theme] pre.th-code code { font: inherit; }`;

export type CodeBlockMessages = CopyButtonMessages & {
  codeDescription: (language: string) => string;
};
export type CodeBlockMessageTranslations = Partial<
  Record<string, Partial<CodeBlockMessages>>
>;

const messages = {
  en: {
    codeDescription: (language: string) => `${language} code`,
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Copy failed",
  },
  fr: {
    codeDescription: (language: string) => `code ${language}`,
    copy: "Copier",
    copied: "Copié",
    copyFailed: "Échec de la copie",
  },
} as const satisfies Record<"en" | "fr", CodeBlockMessages>;

export const codeBlockMessages = (
  locale = "en",
  translations?: CodeBlockMessageTranslations,
): CodeBlockMessages => ({
  ...(locale.startsWith("fr") ? messages.fr : messages.en),
  ...translations?.[locale.split("-")[0] ?? locale],
  ...translations?.[locale],
});

type CodeBlockProps = {
  code: string;
  language?: string;
  locale?: string;
  messages?: CodeBlockMessageTranslations;
};

export function CodeBlock({
  code,
  language = "text",
  locale = "en",
  messages,
}: CodeBlockProps) {
  const normalizedLanguage = language.toLowerCase() || "text";
  const highlighted = highlight(code, { lang: normalizedLanguage });

  const labels = codeBlockMessages(locale, messages);

  return (
    <div
      className="not-prose bg-muted overflow-hidden rounded-md border text-[var(--th-token)]"
      data-code-theme
    >
      <style>{themeCss}</style>
      <div className="bg-background border-border/60 flex items-center justify-between border-b px-3 py-2">
        <span className="text-muted-foreground font-mono text-xs">
          {highlighted.lang}
        </span>
        <CopyButton
          value={code}
          valueDescription={labels.codeDescription(highlighted.lang)}
          variant="secondary"
          locale={locale}
          messages={{ [locale]: labels }}
        />
      </div>
      <div
        className="max-h-full overflow-auto font-mono text-[0.875rem] leading-[1.625]"
        dangerouslySetInnerHTML={{ __html: highlighted.html }}
      />
    </div>
  );
}
