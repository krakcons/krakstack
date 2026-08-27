import {
  MarkdownContent,
  type MarkdownContentProps,
} from "@/lib/markdown/content";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export function AgentsPreview({
  markdown,
}: {
  readonly markdown: Pick<MarkdownContentProps, "codeBlocks" | "html">;
}) {
  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>AGENTS.md</CardTitle>
        <CardDescription>
          The full contents of the agents configuration file, rendered as
          markdown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MarkdownContent
          codeBlocks={markdown.codeBlocks}
          html={markdown.html}
        />
      </CardContent>
    </Card>
  );
}
