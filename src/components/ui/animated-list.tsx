import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { GripVertical } from "lucide-react";
import { cn } from "cn";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import {
  animateElement,
  useKeyedPresence,
  useListLayout,
  useReducedMotion,
  useVerticalDrag,
} from "@/lib/krakmotion";

export type AnimatedListProps<T> = {
  items: readonly T[];
  getKey: (item: T) => string;
  children: (item: T) => ReactNode;
  duration?: number;
  className?: string;
  itemClassName?: string;
  label?: string;
  onReorder?: (items: T[]) => void;
  getItemLabel?: (item: T) => string;
  dragOverflow?: number;
  locale?: string;
  messages?: Record<
    string,
    Partial<{
      reorder: string;
      instructions: string;
      position: (label: string, position: number, total: number) => string;
    }>
  >;
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
  const retained = useKeyedPresence(items, getKey);
  const [initial, setInitial] = useState(true);
  useEffect(() => setInitial(false), []);
  useListLayout(container, duration);
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
  const move = (key: string, target: number) => {
    const index = items.findIndex((item) => getKey(item) === key);
    if (index < 0 || index === target || !onReorder) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    if (item === undefined) return;
    next.splice(target, 0, item);
    setAnnouncedKey(key);
    onReorder(next);
  };
  return (
    <>
      <ul
        ref={container}
        data-slot="animated-list"
        className={cn("relative grid gap-3", className)}
        aria-label={label}
      >
        {retained.items.map((item) => {
          const key = getKey(item);
          const index = items.findIndex(
            (candidate) => getKey(candidate) === key,
          );
          return (
            <ListItem
              key={key}
              itemKey={key}
              present={retained.present.has(key)}
              initial={initial}
              duration={duration}
              className={itemClassName}
              instructions={instructions}
              handleLabel={`${copy.reorder}: ${getItemLabel?.(item) ?? key}`}
              reorderable={!!onReorder}
              disabled={items.length < 2}
              container={container}
              dragOverflow={dragOverflow}
              onExit={() => retained.remove(key)}
              onMove={(target) => move(key, target)}
              onKeyMove={(direction) =>
                move(
                  key,
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
                        ),
                )
              }
            >
              {children(item)}
            </ListItem>
          );
        })}
      </ul>
      {onReorder ? (
        <>
          <p id={instructions} className="sr-only">
            {copy.instructions}
          </p>
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {announcement}
          </p>
        </>
      ) : null}
    </>
  );
};

const ListItem = ({
  itemKey,
  present,
  initial,
  duration,
  className,
  instructions,
  handleLabel,
  reorderable,
  disabled,
  container,
  dragOverflow,
  onExit,
  onMove,
  onKeyMove,
  children,
}: {
  itemKey: string;
  present: boolean;
  initial: boolean;
  duration: number;
  className?: string;
  instructions: string;
  handleLabel: string;
  reorderable: boolean;
  disabled: boolean;
  container: RefObject<HTMLUListElement | null>;
  dragOverflow: number;
  onExit: () => void;
  onMove: (target: number) => void;
  onKeyMove: (direction: "Home" | "End" | "ArrowUp" | "ArrowDown") => void;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const mounted = useRef(false);
  const lastPresent = useRef(present);
  const transitioning = useRef(false);
  const exit = useEffectEvent(onExit);
  const reduced = useReducedMotion();
  const drag = useVerticalDrag({
    ref,
    container,
    enabled: reorderable && !disabled && present,
    overflow: dragOverflow,
    onMove,
  });
  useEffect(() => {
    const element = ref.current;
    const first = !mounted.current;
    mounted.current = true;
    if (!element || (first && initial && present)) return;
    if (!first && lastPresent.current === present && !transitioning.current)
      return;
    lastPresent.current = present;
    transitioning.current = true;
    return animateElement(
      element,
      [{ opacity: present ? 0 : 1 }, { opacity: present ? 1 : 0 }],
      reduced ? 0 : Math.max(0, duration),
      () => {
        transitioning.current = false;
        if (!present) exit();
      },
    );
  }, [present, initial, duration, reduced]);
  return (
    <li
      ref={ref}
      data-slot="animated-list-item"
      data-motion-key={itemKey}
      className={cn("relative", className)}
      inert={!present}
      aria-hidden={!present ? true : undefined}
    >
      {reorderable ? (
        <button
          data-slot="animated-list-handle"
          type="button"
          disabled={disabled || !present}
          aria-label={handleLabel}
          aria-describedby={instructions}
          className="text-muted-foreground focus-visible:ring-ring inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md outline-none select-none focus-visible:ring-2 active:cursor-grabbing disabled:cursor-default disabled:opacity-50"
          {...drag}
          onKeyDown={(event) => {
            if (
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey
            )
              return;
            if (
              event.key === "ArrowUp" ||
              event.key === "ArrowDown" ||
              event.key === "Home" ||
              event.key === "End"
            ) {
              event.preventDefault();
              event.stopPropagation();
              onKeyMove(event.key);
            }
          }}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
      ) : null}
      {children}
    </li>
  );
};
