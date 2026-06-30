import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { getLocale } from "@/paraglide/runtime";

type LoadingVariant = "centered" | "inline";

const labels = {
  en: {
    loading: "Loading...",
  },
  fr: {
    loading: "Chargement...",
  },
} as const;

const loadingLabel = () =>
  getLocale().startsWith("fr") ? labels.fr.loading : labels.en.loading;

export function Loading({
  className,
  label,
  variant = "inline",
}: {
  className?: string | undefined;
  label?: string | undefined;
  variant?: LoadingVariant | undefined;
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex items-center justify-center gap-2 text-sm",
        variant === "centered" && "min-h-[50svh] w-full",
        className,
      )}
    >
      <Loader2 className="size-4 animate-spin" />
      {label ?? loadingLabel()}
    </div>
  );
}
