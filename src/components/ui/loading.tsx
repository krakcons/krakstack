import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";

type LoadingVariant = "centered" | "inline";

const labels = {
  en: {
    loading: "Loading...",
  },
  fr: {
    loading: "Chargement...",
  },
} as const;

export type LoadingMessages = { loading: string };
export type LoadingMessageTranslations = Partial<
  Record<string, Partial<LoadingMessages>>
>;

const loadingLabel = (locale: string, messages?: LoadingMessageTranslations) =>
  messages?.[locale]?.loading ??
  messages?.[locale.split("-")[0] ?? locale]?.loading ??
  (locale.startsWith("fr") ? labels.fr.loading : labels.en.loading);

export function Loading({
  className,
  label,
  locale: localeOverride,
  messages,
  variant = "inline",
}: {
  className?: string | undefined;
  label?: string | undefined;
  locale?: string | undefined;
  messages?: LoadingMessageTranslations | undefined;
  variant?: LoadingVariant | undefined;
}) {
  const locale = useKrakstackLocale(localeOverride);
  return (
    <div
      className={cn(
        "text-muted-foreground flex items-center justify-center gap-2 text-sm",
        variant === "centered" && "min-h-[50svh] w-full",
        className,
      )}
    >
      <Loader2 className="size-4 animate-spin" />
      {label ?? loadingLabel(locale, messages)}
    </div>
  );
}
