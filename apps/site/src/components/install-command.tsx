import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const siteUrl = (
  import.meta.env.VITE_SITE_URL ??
  window.location.origin ??
  "http://localhost:3000"
).replace(/\/$/, "");

export function InstallCommand({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const installCommand = `bunx --bun shadcn@latest add ${siteUrl}/r/${slug}.json`;

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  async function copyInstallCommand() {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);

    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }

    copiedTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimeoutRef.current = null;
    }, 2000);
  }

  return (
    <Card className="min-w-0 bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Install</CardTitle>
        <CardDescription>Add this registry item to your app with shadcn.</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="flex max-w-full items-center gap-3 rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
          <pre className="min-w-0 flex-1 overflow-x-auto">
            <code>{installCommand}</code>
          </pre>
          <Button size="sm" variant="outline" onClick={copyInstallCommand}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
