import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { shikiHighlighter } from "@/lib/shiki";
import { use } from "react";

export function InstallCommand({ slug }: { slug: string }) {
  const highlighter = use(shikiHighlighter);
  const installCommand = `bunx --bun shadcn@latest add ${import.meta.env.VITE_SITE_URL}/r/${slug}.json`;

  return (
    <Card className="min-w-0 bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Install</CardTitle>
        <CardDescription>
          Add this registry item to your app with shadcn.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <CodeBlock
          code={installCommand}
          highlighter={highlighter}
          language="bash"
        />
      </CardContent>
    </Card>
  );
}
