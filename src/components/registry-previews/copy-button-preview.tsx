import { CopyButton } from "@/components/ui/copy-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const command =
  "bunx shadcn@latest add https://krakstack.net/r/copy-button.json";

export function CopyButtonPreview() {
  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Copy Button</CardTitle>
        <CardDescription>
          Accessible clipboard controls with default, small, and large layouts.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-3 sm:items-start">
        <div className="grid gap-2">
          <p className="text-muted-foreground text-sm font-medium">Default</p>
          <CopyButton
            value={command}
            valueDescription="install command"
            variant="secondary"
          />
        </div>
        <div className="grid gap-2">
          <p className="text-muted-foreground text-sm font-medium">Small</p>
          <CopyButton
            value={command}
            valueDescription="install command"
            copyVariant="sm"
            variant="secondary"
          />
        </div>
        <div className="grid gap-2">
          <p className="text-muted-foreground text-sm font-medium">Large</p>
          <CopyButton
            value={command}
            valueDescription="install command"
            copyVariant="large"
            variant="secondary"
          />
        </div>
      </CardContent>
    </Card>
  );
}
