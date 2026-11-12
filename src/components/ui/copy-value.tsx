import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  CopyButton,
  type CopyButtonMessageTranslations,
} from "@/components/ui/copy-button";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { cn } from "@/lib/utils";

export type CopyValueMessages = {
  show: string;
  hide: string;
  hidden: string;
};
export type CopyValueProps = {
  value: string;
  label: string;
  secret?: boolean;
  variant?: "outline" | "ghost";
  disabled?: boolean;
  copyable?: boolean;
  autoHideDelay?: number;
  className?: string;
  locale?: string;
  messages?: Partial<Record<string, Partial<CopyValueMessages>>>;
  copyMessages?: CopyButtonMessageTranslations;
};

const labels = {
  en: { show: "Show", hide: "Hide", hidden: "Hidden value" },
  fr: { show: "Afficher", hide: "Masquer", hidden: "Valeur masquée" },
};

/** Masking is presentation, not a security boundary. Never logs the value. */
export const CopyValue = ({
  value,
  label,
  secret = false,
  variant = "outline",
  disabled,
  copyable = true,
  autoHideDelay = 0,
  className,
  locale: override,
  messages,
  copyMessages,
}: CopyValueProps) => {
  const locale = useKrakstackLocale(override);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [previous, setPrevious] = useState({ value, disabled, secret });
  if (
    previous.value !== value ||
    previous.disabled !== disabled ||
    previous.secret !== secret
  ) {
    setPrevious({ value, disabled, secret });
    setRevealedValue(null);
  }
  const revealed = secret && !disabled && revealedValue === value;
  useEffect(() => {
    if (!revealed || autoHideDelay <= 0) return;
    const timer = setTimeout(() => setRevealedValue(null), autoHideDelay);
    return () => clearTimeout(timer);
  }, [revealed, autoHideDelay, value]);

  return (
    <InputGroup
      className={cn(
        "min-w-0",
        variant === "ghost" &&
          "border-0 bg-transparent shadow-none dark:bg-transparent",
        className,
      )}
    >
      <InputGroupInput
        className={variant === "ghost" ? "pl-0 font-mono" : undefined}
        aria-label={secret && !revealed ? `${label}: ${copy.hidden}` : label}
        value={value}
        type={secret && !revealed ? "password" : "text"}
        autoComplete={secret ? "off" : undefined}
        readOnly
        disabled={disabled}
        onFocus={(event) => event.currentTarget.select()}
      />
      <InputGroupAddon align="inline-end" className="gap-0">
        {secret ? (
          <InputGroupButton
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled}
            aria-label={`${revealed ? copy.hide : copy.show} ${label}`}
            aria-pressed={revealed}
            onClick={() => setRevealedValue(revealed ? null : value)}
          >
            {revealed ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
          </InputGroupButton>
        ) : null}
        {copyable ? (
          <CopyButton
            type="button"
            value={value}
            valueDescription={label}
            disabled={disabled}
            variant="ghost"
            copyVariant={variant === "ghost" ? "default" : "large"}
            locale={locale}
            messages={copyMessages}
          />
        ) : null}
      </InputGroupAddon>
    </InputGroup>
  );
};
