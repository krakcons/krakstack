import { useEffect, useState } from "react";
import type { HighlighterCore } from "shiki/core";

type MarkdownProps = {
  content: string;
};

let highlighterPromise: Promise<HighlighterCore> | null = null;

export function Markdown({ content }: MarkdownProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="prose prose-slate max-w-none prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:bg-[#1d2e45] prose-pre:text-[#e8efff]">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

function parseBlocks(content: string) {
  const blocks: string[] = [];
  const lines = content.trim().split("\n");
  let current: string[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      current.push(line);
      inCodeFence = !inCodeFence;

      if (!inCodeFence) {
        blocks.push(current.join("\n"));
        current = [];
      }

      continue;
    }

    if (!inCodeFence && line.trim() === "") {
      if (current.length > 0) {
        blocks.push(current.join("\n"));
        current = [];
      }

      continue;
    }

    current.push(line);
  }

  if (current.length > 0) blocks.push(current.join("\n"));

  return blocks;
}

function renderBlock(block: string, index: number) {
  if (block.startsWith("```")) {
    const lines = block.split("\n");
    const language = normalizeLanguage(lines[0]?.slice(3).trim());
    const code = lines.slice(1, lines.at(-1) === "```" ? -1 : undefined).join("\n");
    return <HighlightedCode code={code} key={index} language={language} />;
  }

  if (block.startsWith("### ")) return <h3 key={index}>{block.slice(4)}</h3>;
  if (block.startsWith("## ")) return <h2 key={index}>{block.slice(3)}</h2>;
  if (block.startsWith("# ")) return <h1 key={index}>{block.slice(2)}</h1>;

  if (block.split("\n").every((line) => line.startsWith("- "))) {
    return (
      <ul key={index}>
        {block.split("\n").map((line) => (
          <li key={line}>{renderInline(line.slice(2))}</li>
        ))}
      </ul>
    );
  }

  return <p key={index}>{renderInline(block.replace(/\n/g, " "))}</p>;
}

function HighlightedCode({ code, language }: { code: string; language: string }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getHighlighter()
      .then((highlighter) => highlighter.codeToHtml(code, { lang: language, theme: "github-dark" }))
      .then((highlighted) => {
        if (active) setHtml(highlighted);
      })
      .catch(() => {
        if (active) setHtml(null);
      });

    return () => {
      active = false;
    };
  }, [code, language]);

  if (!html) {
    return (
      <pre>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg [&_pre]:my-0 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-[var(--line)] [&_pre]:p-4 [&_pre_code]:bg-transparent"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function getHighlighter() {
  highlighterPromise ??= Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("shiki/dist/langs/json.mjs"),
    import("shiki/dist/langs/typescript.mjs"),
    import("shiki/dist/langs/tsx.mjs"),
    import("shiki/dist/langs/bash.mjs"),
    import("shiki/dist/themes/github-dark.mjs"),
  ]).then(
    ([
      core,
      engine,
      jsonLanguage,
      typescriptLanguage,
      tsxLanguage,
      bashLanguage,
      githubDarkTheme,
    ]) =>
      core.createHighlighterCore({
        langs: [
          jsonLanguage.default,
          typescriptLanguage.default,
          tsxLanguage.default,
          bashLanguage.default,
        ],
        themes: [githubDarkTheme.default],
        engine: engine.createJavaScriptRegexEngine(),
      }),
  );

  return highlighterPromise;
}

function normalizeLanguage(language?: string) {
  if (language === "ts" || language === "typescript") return "typescript";
  if (language === "tsx") return "tsx";
  return language || "text";
}

function renderInline(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={index}>{part.slice(1, -1)}</code>;
    return part;
  });
}
