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
import oxfmtConfig from "../../../.oxfmtrc.json?raw";
import oxlintConfig from "../../../.oxlintrc.json?raw";

function ConfigBlock({ title, content }: { title: string; content: string }) {
  const highlighter = use(shikiHighlighter);

  return (
    <Card className="bg-background/70">
      <CardHeader>
        <CardTitle className="font-mono text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CodeBlock code={content} highlighter={highlighter} language="json" />
      </CardContent>
    </Card>
  );
}

export function LintFormatPreview() {
  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Lint &amp; Format Config</CardTitle>
        <CardDescription>
          Oxfmt and Oxlint configuration files for KrakStack projects.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <ConfigBlock title=".oxfmtrc.json" content={oxfmtConfig} />
        <ConfigBlock title=".oxlintrc.json" content={oxlintConfig} />
      </CardContent>
    </Card>
  );
}
