import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type AutoHeightProps = {
  children: ReactNode;
  duration?: number;
  className?: string;
  contentClassName?: string;
};

/** Measures content, not the animated container. SSR and observer-less browsers stay auto-sized. */
export const AutoHeight = ({
  children,
  duration = 200,
  className,
  contentClassName,
}: AutoHeightProps) => {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = content.current;
    if (!element || !globalThis.ResizeObserver) return;
    const observer = new ResizeObserver(() => {
      // Hidden tab panes have no layout box; zero is not their content height.
      if (element.getClientRects().length === 0) return;
      setHeight(element.getBoundingClientRect().height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <motion.div
      data-slot="auto-height"
      className={className}
      initial={false}
      animate={{ height: height ?? "auto" }}
      transition={{
        duration: reduced !== false ? 0 : Math.max(0, duration) / 1000,
      }}
      style={{ overflow: "clip", boxSizing: "content-box" }}
    >
      <div
        ref={content}
        className={contentClassName}
        style={{ display: "flow-root" }}
      >
        {children}
      </div>
    </motion.div>
  );
};
