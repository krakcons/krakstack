import type { ReactNode } from "react";
import { usePresence } from "@/lib/krakmotion";

export type PresenceTransitionProps = {
  open: boolean;
  children: ReactNode;
  duration?: number;
  className?: string;
};

/** Exit content becomes inert immediately, then unmounts after its animation. */
export const PresenceTransition = ({
  open,
  children,
  duration = 180,
  className,
}: PresenceTransitionProps) => {
  const { ref, mounted } = usePresence(open, duration);
  return mounted ? (
    <div
      ref={ref}
      data-slot="presence-transition"
      className={className}
      inert={!open}
      aria-hidden={!open ? true : undefined}
    >
      {children}
    </div>
  ) : null;
};
