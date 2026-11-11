import { Check, LoaderCircle, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { cn } from "@/lib/utils";

export type AsyncActionButtonMessages = {
  pending: string;
  success: string;
  retry: string;
  error: string;
};

export type AsyncActionButtonProps = Omit<
  ComponentProps<typeof Button>,
  "onClick" | "type" | "render" | "nativeButton" | "aria-busy"
> & {
  onAction: () => Promise<void>;
  onPendingChange?: (pending: boolean) => void;
  containerClassName?: string;
  locale?: string;
  messages?: Partial<Record<string, Partial<AsyncActionButtonMessages>>>;
};

const labels = {
  en: {
    pending: "Working…",
    success: "Completed",
    retry: "Try again",
    error: "The action failed. Please try again.",
  },
  fr: {
    pending: "En cours…",
    success: "Terminé",
    retry: "Réessayer",
    error: "L’action a échoué. Veuillez réessayer.",
  },
};

/** Runs only on activation. Failures stay local; raw error details are never rendered. */
export const AsyncActionButton = ({
  onAction,
  onPendingChange,
  children,
  disabled,
  locale: override,
  messages,
  containerClassName,
  ...props
}: AsyncActionButtonProps) => {
  const locale = useKrakstackLocale(override);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const locked = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = async () => {
    if (locked.current || disabled) return;
    locked.current = true;
    setStatus("pending");
    onPendingChange?.(true);
    try {
      await onAction();
      if (mounted.current) setStatus("success");
    } catch {
      if (mounted.current) setStatus("error");
    } finally {
      locked.current = false;
      onPendingChange?.(false);
    }
  };

  return (
    <span
      data-slot="async-action-button"
      data-state={status}
      className={cn(
        "inline-flex min-w-0 flex-col items-start gap-2",
        containerClassName,
      )}
    >
      <Button
        {...props}
        type="button"
        disabled={disabled || status === "pending"}
        aria-busy={status === "pending"}
        onClick={() => {
          void run();
        }}
      >
        {status === "pending" ? (
          <LoaderCircle
            aria-hidden="true"
            className="motion-safe:animate-spin"
          />
        ) : status === "success" ? (
          <Check aria-hidden="true" />
        ) : status === "error" ? (
          <RotateCcw aria-hidden="true" />
        ) : null}
        {status === "pending"
          ? copy.pending
          : status === "success"
            ? copy.success
            : status === "error"
              ? copy.retry
              : children}
      </Button>
      <span
        data-slot="async-action-feedback"
        role="status"
        className={status === "error" ? "text-destructive text-sm" : "sr-only"}
      >
        {status === "error"
          ? copy.error
          : status === "success"
            ? copy.success
            : status === "pending"
              ? copy.pending
              : ""}
      </span>
    </span>
  );
};
