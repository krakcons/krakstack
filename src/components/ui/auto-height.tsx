import { animateElement, useReducedMotion } from "@/lib/krakmotion";
import { useEffect, useRef, type ReactNode } from "react";

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
  const container = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = content.current;
    const wrapper = container.current;
    if (!element || !wrapper || !globalThis.ResizeObserver) return;
    let previous: number | undefined;
    let cancel = () => {};
    const observer = new ResizeObserver(() => {
      // Hidden tab panes have no layout box; zero is not their content height.
      if (element.getClientRects().length === 0) return;
      const height = element.getBoundingClientRect().height;
      const from = Number.parseFloat(getComputedStyle(wrapper).height);
      cancel();
      wrapper.style.height = `${height}px`;
      if (previous !== undefined)
        cancel = animateElement(
          wrapper,
          [{ height: `${from}px` }, { height: `${height}px` }],
          reduced ? 0 : Math.max(0, duration),
        );
      previous = height;
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancel();
      wrapper.style.height = "";
    };
  }, [duration, reduced]);
  return (
    <div
      ref={container}
      data-slot="auto-height"
      className={className}
      style={{ overflow: "clip", boxSizing: "content-box" }}
    >
      <div
        ref={content}
        className={contentClassName}
        style={{ display: "flow-root" }}
      >
        {children}
      </div>
    </div>
  );
};
