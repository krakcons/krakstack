import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeBlock } from "@krak-stack/registry/code-block";
import bunfigConfig from "../../../bunfig.toml?raw";
import oxlintConfig from "../../../.oxlintrc.json?raw";

function ConfigBlock({ title, content }: { title: string; content: string }) {
  return (
    <Card className="bg-background/70">
      <CardHeader>
        <CardTitle className="font-mono text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CodeBlock
          code={content}
          language={title.endsWith(".toml") ? "toml" : "json"}
        />
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
          Bun formatter and Oxlint configuration files for KrakStack projects.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <ConfigBlock title="bunfig.toml" content={bunfigConfig} />
        <ConfigBlock title=".oxlintrc.json" content={oxlintConfig} />
      </CardContent>
    </Card>
  );
}
