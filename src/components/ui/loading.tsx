import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Loading({
  className,
  label,
}: {
  className?: string | undefined;
  label: string;
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex items-center justify-center gap-2 text-sm",
        className,
      )}
    >
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}
