import { CopyButton } from "@/components/ui/copy-button";
import { Fragment, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { ThemedTokenWithVariants } from "shiki";
import type { HighlighterCore } from "shiki/core";

type CodeBlockMessages = {
  copy?: string;
  copied?: string;
  copyFailed?: string;
};
type CodeBlockProps = {
  code: string;
  highlighter: HighlighterCore;
  language?: string;
  messages?: CodeBlockMessages;
};

const codeBodyClassName =
  "font-mono text-[0.875rem] leading-[1.625] break-all whitespace-pre-wrap [&_code]:block [&_code]:font-mono [&_code]:text-[inherit] [&_code]:leading-[inherit] [&_code]:whitespace-pre-wrap [&_span]:break-all";

type TokenStyle = CSSProperties & {
  "--shiki-light"?: string;
  "--shiki-dark"?: string;
};

const getTokenStyle = (token: ThemedTokenWithVariants): TokenStyle => {
  const style: TokenStyle = {};

  if (token.variants.light?.color) {
    style["--shiki-light"] = token.variants.light.color;
  }
  if (token.variants.dark?.color) {
    style["--shiki-dark"] = token.variants.dark.color;
  }

  return style;
};

export function CodeBlock({
  code,
  highlighter,
  language = "text",
  messages,
}: CodeBlockProps) {
  const [tokens, setTokens] = useState<ThemedTokenWithVariants[][]>();

  useEffect(() => {
    let active = true;

    setTokens(undefined);
    try {
      const result = highlighter.codeToTokensWithThemes(code, {
        lang: language.toLowerCase() || "text",
        themes: {
          light: "vitesse-light",
          dark: "vitesse-dark",
        },
      });

      if (active) setTokens(result);
    } catch {
      // Unsupported languages render as plain text through the fallback.
    }

    return () => {
      active = false;
    };
  }, [code, highlighter, language]);

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="border-border/60 flex items-center justify-between border-b px-3 py-2">
        <span className="text-muted-foreground font-mono text-xs">
          {language.toLowerCase()}
        </span>
        <CopyButton
          value={code}
          valueDescription={`${language.toLowerCase()} code`}
          variant="secondary"
          messages={{
            ...(messages?.copy === undefined ? {} : { copy: messages.copy }),
            ...(messages?.copied === undefined
              ? {}
              : { copied: messages.copied }),
            ...(messages?.copyFailed === undefined
              ? {}
              : { copyFailed: messages.copyFailed }),
          }}
        />
      </div>
      <div className="bg-muted max-h-full overflow-auto p-3">
        {tokens ? (
          <div className={codeBodyClassName}>
            <code className={`language-${language}`}>
              {tokens.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {line.map((token) => (
                    <span
                      className="text-[var(--shiki-light)] dark:text-[var(--shiki-dark)]"
                      key={token.offset}
                      style={getTokenStyle(token)}
                    >
                      {token.content}
                    </span>
                  ))}
                  {lineIndex < tokens.length - 1 ? "\n" : null}
                </Fragment>
              ))}
            </code>
          </div>
        ) : (
          <div className={`max-w-full ${codeBodyClassName}`}>
            <code className={`language-${language}`}>{code}</code>
          </div>
        )}
      </div>
    </div>
  );
}
