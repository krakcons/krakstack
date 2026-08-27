import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeBlock } from "@krak-stack/registry/code-block";
import oxfmtConfig from "../../../.oxfmtrc.json?raw";
import oxlintConfig from "../../../.oxlintrc.json?raw";

function ConfigBlock({ title, content }: { title: string; content: string }) {
  return (
    <Card className="bg-background/70">
      <CardHeader>
        <CardTitle className="font-mono text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CodeBlock code={content} language="json" />
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
