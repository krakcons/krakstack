import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useMemo } from "react";
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
  const displayed = useMotionValue(value);
  const text = useTransform(() => formatter.format(displayed.get()));
  const reduced = useReducedMotion();
  useEffect(() => {
    if (
      reduced !== false ||
      duration <= 0 ||
      !Number.isFinite(value) ||
      !Number.isFinite(displayed.get())
    ) {
      displayed.set(value);
      return;
    }
    const controls = animate(displayed, value, {
      duration: duration / 1000,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [displayed, duration, reduced, value]);
  return (
    <span data-slot="animated-number" className={className}>
      <span className="sr-only">{formatter.format(value)}</span>
      <motion.span aria-hidden="true">{text}</motion.span>
    </span>
  );
};
