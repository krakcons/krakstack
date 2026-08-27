import { CopyButton } from "@/components/ui/copy-button";
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

type CodeBlockMessages = {
  copy?: string;
  copied?: string;
  copyFailed?: string;
};
type CodeBlockProps = {
  code: string;
  language?: string;
  messages?: CodeBlockMessages;
};

export function CodeBlock({
  code,
  language = "text",
  messages,
}: CodeBlockProps) {
  const normalizedLanguage = language.toLowerCase() || "text";
  const highlighted = highlight(code, { lang: normalizedLanguage });

  const copyMessages: CodeBlockMessages = {};
  if (messages?.copy !== undefined) copyMessages.copy = messages.copy;
  if (messages?.copied !== undefined) copyMessages.copied = messages.copied;
  if (messages?.copyFailed !== undefined) {
    copyMessages.copyFailed = messages.copyFailed;
  }

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
          valueDescription={`${highlighted.lang} code`}
          variant="secondary"
          messages={copyMessages}
        />
      </div>
      <div
        className="max-h-full overflow-auto font-mono text-[0.875rem] leading-[1.625]"
        dangerouslySetInnerHTML={{ __html: highlighted.html }}
      />
    </div>
  );
}
