import { useState } from "react";

import { IconInput } from "@/components/ui/icon-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function IconInputPreview() {
  const [icon, setIcon] = useState("circle-help");

  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Icon Input</CardTitle>
        <CardDescription>
          Search the Lucide Iconify collection and select an icon.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <IconInput value={icon} onValueChange={setIcon} />
        <code className="text-muted-foreground bg-background rounded px-2 py-1 text-sm">
          {icon}
        </code>
      </CardContent>
    </Card>
  );
}
