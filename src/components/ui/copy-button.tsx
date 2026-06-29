import { Button } from "@/components/ui/button";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";

type CopyButtonMessages = {
  copy?: string;
  copied?: string;
  copyFailed?: string;
};

type CopyButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "onClick"
> & {
  value: string;
  valueDescription?: string;
  copyVariant?: "default" | "sm" | "large";
  messages?: CopyButtonMessages;
  onCopied?: () => void;
  onCopyError?: (error: unknown) => void;
  resetDelay?: number;
};

type CopyState = "idle" | "copied" | "failed";

export function CopyButton({
  value,
  valueDescription,
  copyVariant = "default",
  messages,
  onCopied,
  onCopyError,
  resetDelay = 1500,
  disabled,
  size,
  "aria-label": ariaLabel,
  ...props
}: CopyButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const labels = {
    copy: messages?.copy ?? "Copy",
    copied: messages?.copied ?? "Copied",
    copyFailed: messages?.copyFailed ?? "Copy failed",
  };

  const accessibleLabel =
    ariaLabel ??
    (valueDescription ? `${labels.copy} ${valueDescription}` : labels.copy);
  const isLarge = copyVariant === "large";
  const defaultSize =
    copyVariant === "sm" ? "icon-xs" : isLarge ? "sm" : "icon-sm";

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  const resetCopyState = () => {
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopyState("idle"), resetDelay);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
      onCopied?.();
    } catch (error) {
      setCopyState("failed");
      onCopyError?.(error);
    }

    resetCopyState();
  };

  const status =
    copyState === "copied"
      ? valueDescription
        ? `${labels.copied}: ${valueDescription}`
        : labels.copied
      : copyState === "failed"
        ? valueDescription
          ? `${labels.copyFailed}: ${valueDescription}`
          : labels.copyFailed
        : "";

  return (
    <Button
      aria-label={accessibleLabel}
      disabled={disabled}
      onClick={copy}
      size={size ?? defaultSize}
      {...props}
    >
      <span aria-live="polite" className="sr-only" role="status">
        {status}
      </span>
      {copyState === "copied" ? <Check aria-hidden="true" /> : null}
      {copyState === "failed" ? <TriangleAlert aria-hidden="true" /> : null}
      {copyState === "idle" ? <Copy aria-hidden="true" /> : null}
      {isLarge ? <span>{labels.copy}</span> : null}
    </Button>
  );
}
