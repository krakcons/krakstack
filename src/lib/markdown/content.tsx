import type { ReactNode } from "react";

import { CodeBlock } from "@/components/ui/code-block";
import { cn } from "@/lib/utils";

export type MarkdownContentProps = {
  readonly className?: string;
  readonly codeBlocks: ReadonlyArray<{
    readonly code: string;
    readonly language: string;
  }>;
  readonly html: string;
  readonly messages?: {
    readonly copied?: string;
    readonly copy?: string;
  };
};

export const MarkdownContent = ({
  className,
  codeBlocks,
  html,
  messages,
}: MarkdownContentProps) => {
  const content: ReactNode[] = [];
  let remainingHtml = html;

  codeBlocks.forEach((block, index) => {
    const marker = `<markdown-code-block data-index="${index}"></markdown-code-block>`;
    const markerIndex = remainingHtml.indexOf(marker);
    if (markerIndex === -1) return;

    content.push(
      <div
        key={`html-${index}`}
        dangerouslySetInnerHTML={{
          __html: remainingHtml.slice(0, markerIndex),
        }}
      />,
      <div className="my-5" key={`code-${index}`}>
        <CodeBlock
          code={block.code}
          language={block.language}
          messages={{ copy: messages?.copy, copied: messages?.copied }}
        />
      </div>,
    );
    remainingHtml = remainingHtml.slice(markerIndex + marker.length);
  });
  content.push(
    <div
      key="html-final"
      dangerouslySetInnerHTML={{ __html: remainingHtml }}
    />,
  );

  return (
    <div
      className={cn(
        "[&_a:hover]:text-primary [&_a]:decoration-border [&_blockquote]:border-primary/40 [&_blockquote]:bg-muted/40 [&_h2_a]:text-muted-foreground [&_h3_a]:text-muted-foreground [&_[data-inline-code]]:bg-muted text-[0.98rem] leading-7 [&_[data-markdown-table]]:overflow-x-auto [&_[data-inline-code]]:rounded [&_[data-inline-code]]:px-1.5 [&_[data-inline-code]]:py-0.5 [&_[data-inline-code]]:font-mono [&_[data-inline-code]]:text-[0.875em] [&_a]:font-medium [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 [&_a]:transition-colors [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-4 [&_blockquote]:px-5 [&_blockquote]:py-1 [&_h2]:mt-12 [&_h2]:scroll-mt-20 [&_h2]:border-t [&_h2]:pt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2_a]:ml-2 [&_h2_a]:no-underline [&_h2:first-of-type]:mt-0 [&_h2:first-of-type]:border-t-0 [&_h2:first-of-type]:pt-0 [&_h3]:mt-8 [&_h3]:scroll-mt-20 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3_a]:ml-2 [&_h3_a]:no-underline [&_ol]:my-5 [&_p]:my-5 [&_table]:w-full [&_table]:text-sm [&_td]:border-b [&_td]:p-2 [&_th]:border-b [&_th]:p-2 [&_th]:text-left [&_ul]:my-5",
        className,
      )}
    >
      {content}
    </div>
  );
};
