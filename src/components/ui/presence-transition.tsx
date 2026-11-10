import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import type { ReactNode } from "react";

export type PresenceTransitionProps = {
  open: boolean;
  children: ReactNode;
  duration?: number;
  className?: string;
};

/** Exit content becomes inert immediately, then unmounts after its animation. */
export const PresenceTransition = ({
  open,
  ...props
}: PresenceTransitionProps) => (
  <AnimatePresence initial={false}>
    {open ? <PresenceContent key="content" {...props} /> : null}
  </AnimatePresence>
);

const PresenceContent = ({
  children,
  duration = 180,
  className,
}: Omit<PresenceTransitionProps, "open">) => {
  const present = useIsPresent();
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-slot="presence-transition"
      className={className}
      inert={!present}
      aria-hidden={!present ? true : undefined}
      initial={{ opacity: 0, y: reduced !== false ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced !== false ? 0 : 4 }}
      transition={{
        duration: reduced !== false ? 0 : Math.max(0, duration) / 1000,
      }}
    >
      {children}
    </motion.div>
  );
};
