import {
  AnimatePresence,
  Reorder,
  motion,
  useDragControls,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { GripVertical } from "lucide-react";
import { useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { cn } from "@/lib/utils";

export type AnimatedListProps<T> = {
  items: readonly T[];
  getKey: (item: T) => string;
  children: (item: T) => ReactNode;
  duration?: number;
  className?: string;
  itemClassName?: string;
  label?: string;
  onReorder?: (items: T[]) => void;
  dragOverflow?: number;
  getItemLabel?: (item: T) => string;
  locale?: string;
  messages?: Partial<Record<string, Partial<AnimatedListMessages>>>;
};

export type AnimatedListMessages = {
  reorder: string;
  instructions: string;
  position: (label: string, position: number, total: number) => string;
};

const labels = {
  en: {
    reorder: "Reorder",
    instructions:
      "Drag to reorder, or use Arrow Up, Arrow Down, Home and End on the handle.",
    position: (label: string, position: number, total: number) =>
      `${label}, position ${position} of ${total}.`,
  },
  fr: {
    reorder: "Réordonner",
    instructions:
      "Faites glisser pour réordonner, ou utilisez les flèches haut et bas, Début et Fin sur la poignée.",
    position: (label: string, position: number, total: number) =>
      `${label}, position ${position} sur ${total}.`,
  },
};

/** Stable entity keys preserve child state across inserts and reordering. */
export const AnimatedList = <T,>({
  items,
  getKey,
  children,
  duration = 180,
  className,
  itemClassName,
  label,
  onReorder,
  dragOverflow = 12,
  getItemLabel,
  locale: override,
  messages,
}: AnimatedListProps<T>) => {
  const locale = useKrakstackLocale(override);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const instructions = useId();
  const container = useRef<HTMLUListElement>(null);
  const [announcedKey, setAnnouncedKey] = useState<string | null>(null);
  const keys = items.map(getKey);
  const announcement = items
    .map((item, index) =>
      getKey(item) === announcedKey
        ? copy.position(
            getItemLabel?.(item) ?? getKey(item),
            index + 1,
            items.length,
          )
        : "",
    )
    .join("");
  const reorder = (nextKeys: string[]) => {
    const order = new Map(nextKeys.map((key, index) => [key, index]));
    onReorder?.(
      [...items].sort(
        (a, b) => (order.get(getKey(a)) ?? 0) - (order.get(getKey(b)) ?? 0),
      ),
    );
  };

  if (onReorder)
    return (
      <>
        <Reorder.Group
          data-slot="animated-list"
          ref={container}
          as="ul"
          axis="y"
          values={keys}
          onReorder={reorder}
          className={cn("grid gap-3", className)}
          aria-label={label}
        >
          <AnimatePresence initial={false}>
            {items.map((item, index) => {
              const key = getKey(item);
              const itemLabel = getItemLabel?.(item) ?? key;
              return (
                <ReorderableListItem
                  key={key}
                  value={key}
                  duration={duration}
                  className={itemClassName}
                  instructions={instructions}
                  handleLabel={`${copy.reorder}: ${itemLabel}`}
                  disabled={items.length < 2}
                  constraints={container}
                  dragOverflow={dragOverflow}
                  onMove={(direction) => {
                    const target =
                      direction === "Home"
                        ? 0
                        : direction === "End"
                          ? items.length - 1
                          : Math.max(
                              0,
                              Math.min(
                                items.length - 1,
                                index + (direction === "ArrowUp" ? -1 : 1),
                              ),
                            );
                    if (index === target) return;
                    const nextKeys = [...keys];
                    nextKeys.splice(index, 1);
                    nextKeys.splice(target, 0, key);
                    setAnnouncedKey(key);
                    reorder(nextKeys);
                  }}
                  onDragEnd={() => setAnnouncedKey(key)}
                >
                  {children(item)}
                </ReorderableListItem>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
        <span id={instructions} className="sr-only">
          {copy.instructions}
        </span>
        <span role="status" className="sr-only">
          {announcement}
        </span>
      </>
    );

  return (
    <ul
      data-slot="animated-list"
      className={cn("grid gap-3", className)}
      aria-label={label}
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <AnimatedListItem
            key={getKey(item)}
            duration={duration}
            className={itemClassName}
          >
            {children(item)}
          </AnimatedListItem>
        ))}
      </AnimatePresence>
    </ul>
  );
};

const ReorderableListItem = ({
  children,
  value,
  duration,
  className,
  instructions,
  handleLabel,
  disabled,
  constraints,
  dragOverflow,
  onMove,
  onDragEnd,
}: {
  children: ReactNode;
  value: string;
  duration: number;
  className?: string;
  instructions: string;
  handleLabel: string;
  disabled: boolean;
  constraints: RefObject<HTMLUListElement | null>;
  dragOverflow: number;
  onMove: (direction: "ArrowUp" | "ArrowDown" | "Home" | "End") => void;
  onDragEnd: () => void;
}) => {
  const present = useIsPresent();
  const reduced = useReducedMotion();
  const controls = useDragControls();
  return (
    <Reorder.Item
      data-slot="animated-list-item"
      as="li"
      value={value}
      dragListener={false}
      dragControls={controls}
      dragMomentum={false}
      dragConstraints={constraints}
      dragElastic={0}
      onMeasureDragConstraints={(bounds) => ({
        ...bounds,
        top: bounds.top - Math.max(0, dragOverflow),
        bottom: bounds.bottom + Math.max(0, dragOverflow),
      })}
      tabIndex={-1}
      layout="position"
      className={cn("relative", className)}
      inert={!present}
      aria-hidden={!present ? true : undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: reduced !== false ? 0 : Math.max(0, duration) / 1000,
      }}
      onDragEnd={onDragEnd}
    >
      <button
        data-slot="animated-list-handle"
        type="button"
        disabled={disabled || !present}
        aria-label={handleLabel}
        aria-describedby={instructions}
        className="text-muted-foreground focus-visible:ring-ring inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md outline-none select-none focus-visible:ring-2 active:cursor-grabbing disabled:cursor-default disabled:opacity-50"
        onPointerDown={(event) => {
          if (!disabled && present) controls.start(event);
        }}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
            return;
          if (
            event.key === "ArrowUp" ||
            event.key === "ArrowDown" ||
            event.key === "Home" ||
            event.key === "End"
          ) {
            event.preventDefault();
            event.stopPropagation();
            onMove(event.key);
          }
        }}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      {children}
    </Reorder.Item>
  );
};

const AnimatedListItem = ({
  children,
  duration,
  className,
}: {
  children: ReactNode;
  duration: number;
  className?: string;
}) => {
  const present = useIsPresent();
  const reduced = useReducedMotion();
  return (
    <motion.li
      data-slot="animated-list-item"
      layout={reduced === false ? "position" : false}
      className={className}
      inert={!present}
      aria-hidden={!present ? true : undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: reduced !== false ? 0 : Math.max(0, duration) / 1000,
      }}
    >
      {children}
    </motion.li>
  );
};
