import { useNumberTransition } from "@/lib/krakmotion";
import { useMemo } from "react";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";

export type AnimatedNumberProps = {
  value: number;
  duration?: number;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  className?: string;
};

/** Assistive technology receives the target, not a stream of intermediate values. */
export const AnimatedNumber = ({
  value,
  duration = 350,
  format,
  locale: override,
  className,
}: AnimatedNumberProps) => {
  const locale = useKrakstackLocale(override);
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, format),
    [locale, format],
  );
  const displayed = useNumberTransition(value, duration);
  return (
    <span data-slot="animated-number" className={className}>
      <span className="sr-only">{formatter.format(value)}</span>
      <span aria-hidden="true">{formatter.format(displayed)}</span>
    </span>
  );
};
