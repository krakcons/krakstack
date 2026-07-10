import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useCallback,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

import { ComboboxItem } from "@/components/ui/combobox";

export type ComboboxVirtualizer = ReturnType<
  typeof useVirtualizer<HTMLDivElement, Element>
>;

export function ComboboxListVirtualized<Item>({
  getItemKey,
  virtualizerRef,
  children,
}: {
  getItemKey: (item: Item) => string | number;
  virtualizerRef?: RefObject<ComboboxVirtualizer | null>;
  children: (item: Item) => ReactNode;
}) {
  const filteredItems = ComboboxPrimitive.useFilteredItems<Item>();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 36,
    overscan: 8,
  });

  useImperativeHandle(virtualizerRef, () => virtualizer, [virtualizer]);

  const handleScrollElementRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollRef.current = element;
      if (element) virtualizer.measure();
    },
    [virtualizer],
  );

  if (filteredItems.length === 0) return null;

  return (
    <ComboboxPrimitive.List
      ref={handleScrollElementRef}
      className="overflow-auto overscroll-contain scroll-py-1 p-1"
      style={{
        height: Math.min(virtualizer.getTotalSize() + 8, 288),
        maxHeight: "var(--available-height)",
      }}
    >
      <div
        className="relative w-full"
        role="presentation"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = filteredItems[virtualItem.index];

          if (!item) return null;

          return (
            <ComboboxItem
              key={getItemKey(item)}
              ref={virtualizer.measureElement}
              index={virtualItem.index}
              data-index={virtualItem.index}
              value={item}
              aria-posinset={virtualItem.index + 1}
              aria-setsize={filteredItems.length}
              style={{
                height: virtualItem.size,
                left: 0,
                position: "absolute",
                top: 0,
                transform: `translateY(${virtualItem.start}px)`,
                width: "100%",
              }}
            >
              {children(item)}
            </ComboboxItem>
          );
        })}
      </div>
    </ComboboxPrimitive.List>
  );
}
