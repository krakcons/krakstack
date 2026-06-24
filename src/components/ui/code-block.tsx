import { Button } from "@/components/ui/button";
import { Check, Clipboard } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ThemedTokenWithVariants } from "shiki";
import type { HighlighterCore } from "shiki/core";

type CodeBlockMessages = {
  copy?: string;
  copied?: string;
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
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const labels = {
    copy: messages?.copy ?? "Copy code",
    copied: messages?.copied ?? "Copied",
  };

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

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  const copy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-muted overflow-hidden rounded-md border">
      <div className="border-border/60 flex items-center justify-between border-b px-3 py-2">
        <span className="text-muted-foreground font-mono text-xs">
          {language.toLowerCase()}
        </span>
        <Button
          size="icon-sm"
          variant="secondary"
          disabled={copied}
          aria-label={copied ? labels.copied : labels.copy}
          onClick={copy}
        >
          <span className="sr-only">
            {copied ? labels.copied : labels.copy}
          </span>
          {copied ? <Check /> : <Clipboard />}
        </Button>
      </div>
      <div className="max-h-full overflow-auto p-3">
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
