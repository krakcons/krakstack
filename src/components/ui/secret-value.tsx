import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CopyButton,
  type CopyButtonMessageTranslations,
} from "@/components/ui/copy-button";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { cn } from "@/lib/utils";

export type SecretValueMessages = {
  show: string;
  hide: string;
  hidden: string;
};
export type SecretValueProps = {
  value: string;
  label: string;
  disabled?: boolean;
  copyable?: boolean;
  autoHideDelay?: number;
  className?: string;
  locale?: string;
  messages?: Partial<Record<string, Partial<SecretValueMessages>>>;
  copyMessages?: CopyButtonMessageTranslations;
};

const labels = {
  en: { show: "Show", hide: "Hide", hidden: "Hidden value" },
  fr: { show: "Afficher", hide: "Masquer", hidden: "Valeur masquée" },
};

/** Masking is presentation, not a security boundary. Never logs the value. */
export const SecretValue = ({
  value,
  label,
  disabled,
  copyable = true,
  autoHideDelay = 0,
  className,
  locale: override,
  messages,
  copyMessages,
}: SecretValueProps) => {
  const locale = useKrakstackLocale(override);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [previous, setPrevious] = useState({ value, disabled });
  if (previous.value !== value || previous.disabled !== disabled) {
    setPrevious({ value, disabled });
    setRevealedValue(null);
  }
  const revealed = !disabled && revealedValue === value;
  useEffect(() => {
    if (!revealed || autoHideDelay <= 0) return;
    const timer = setTimeout(() => setRevealedValue(null), autoHideDelay);
    return () => clearTimeout(timer);
  }, [revealed, autoHideDelay, value]);

  return (
    <div
      data-slot="secret-value"
      data-state={revealed ? "revealed" : "hidden"}
      data-disabled={disabled || undefined}
      className={cn("flex min-w-0 items-center gap-2", className)}
    >
      <code
        data-slot="secret-value-content"
        className="min-w-0 flex-1 text-sm break-all"
        aria-label={revealed ? undefined : `${label}: ${copy.hidden}`}
      >
        {revealed ? value : <span aria-hidden="true">••••••••</span>}
      </code>
      <Button
        data-component="secret-value-toggle"
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={disabled}
        aria-label={`${revealed ? copy.hide : copy.show} ${label}`}
        aria-pressed={revealed}
        onClick={() => setRevealedValue(revealed ? null : value)}
      >
        {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
      {copyable ? (
        <CopyButton
          data-component="secret-value-copy"
          type="button"
          value={value}
          valueDescription={label}
          disabled={disabled}
          variant="ghost"
          locale={locale}
          messages={copyMessages}
        />
      ) : null}
    </div>
  );
};
