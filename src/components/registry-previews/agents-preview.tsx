import { Markdown } from "@/components/markdown";
import { shikiHighlighter } from "@/lib/shiki";
import { use } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import agentsMd from "../../../AGENTS.md?raw";

export function AgentsPreview() {
  const highlighter = use(shikiHighlighter);

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
        <Markdown content={agentsMd} highlighter={highlighter} />
      </CardContent>
    </Card>
  );
}
