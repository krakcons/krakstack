"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  useCallback,
  useImperativeHandle,
  useRef,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { getLocale } from "@/paraglide/runtime";

export interface VirtualizedComboboxMessages {
  search: string;
  selected: (count: number) => string;
  selectMore: string;
}

export type VirtualizedComboboxMessageOverrides =
  Partial<VirtualizedComboboxMessages>;

const messages = {
  en: {
    search: "Search...",
    selected: (count: number) => `${count} selected`,
    selectMore: "Select more",
  },
  fr: {
    search: "Rechercher...",
    selected: (count: number) => `${count} sélectionnés`,
    selectMore: "Sélectionner davantage",
  },
} as const satisfies Record<"en" | "fr", VirtualizedComboboxMessages>;

export const virtualizedComboboxMessages = (
  overrides?: VirtualizedComboboxMessageOverrides,
) => ({
  ...(getLocale().startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

export interface VirtualizedComboboxOption<TData = never> {
  value: string;
  label: string;
  data?: TData;
}

export type VirtualizedComboboxVirtualizer = ReturnType<
  typeof useVirtualizer<HTMLDivElement, Element>
>;

interface VirtualizedComboboxSharedProps<TData> {
  ariaLabel: string;
  ariaInvalid?: boolean;
  contentClassName?: string;
  disabled?: boolean;
  emptyLabel: ReactNode;
  items: readonly VirtualizedComboboxOption<TData>[];
  messages?: VirtualizedComboboxMessageOverrides;
  onOpenChange?: (open: boolean) => void;
  onSearchValueChange?: (value: string) => void;
  open?: boolean;
  placeholder: ReactNode;
  renderItem?: (item: VirtualizedComboboxOption<TData>) => ReactNode;
  searchValue?: string;
  trigger?: ReactElement;
  triggerId?: string;
  virtualizerRef?: RefObject<VirtualizedComboboxVirtualizer | null>;
}

type VirtualizedComboboxSingleProps<TData> =
  VirtualizedComboboxSharedProps<TData> & {
    multiple?: false;
    onValueChange: (value: VirtualizedComboboxOption<TData> | null) => void;
    value: VirtualizedComboboxOption<TData> | null;
  };

type VirtualizedComboboxMultipleProps<TData> =
  VirtualizedComboboxSharedProps<TData> & {
    multiple: true;
    onValueChange: (value: VirtualizedComboboxOption<TData>[]) => void;
    value: readonly VirtualizedComboboxOption<TData>[];
  };

export type VirtualizedComboboxProps<TData = never> =
  | VirtualizedComboboxSingleProps<TData>
  | VirtualizedComboboxMultipleProps<TData>;

const optionEquals = <TData,>(
  item: VirtualizedComboboxOption<TData>,
  selected: VirtualizedComboboxOption<TData>,
) => item.value === selected.value;

const VirtualizedComboboxList = <TData,>({
  emptyLabel,
  groupSelections,
  messages: messageOverrides,
  renderItem,
  selectedValues,
  virtualizerRef,
}: {
  emptyLabel: ReactNode;
  groupSelections: boolean;
  messages?: VirtualizedComboboxMessageOverrides | undefined;
  renderItem?:
    | ((item: VirtualizedComboboxOption<TData>) => ReactNode)
    | undefined;
  selectedValues: ReadonlySet<string>;
  virtualizerRef: RefObject<VirtualizedComboboxVirtualizer | null>;
}) => {
  const filteredItems =
    ComboboxPrimitive.useFilteredItems<VirtualizedComboboxOption<TData>>();
  const labels = virtualizedComboboxMessages(messageOverrides);
  const entries = filteredItems.flatMap((item, index) => {
    if (!groupSelections) return [{ kind: "item" as const, item, index }];

    const selected = selectedValues.has(item.value);
    const previous = filteredItems[index - 1];
    const startsGroup =
      index === 0 || selectedValues.has(previous?.value ?? "") !== selected;
    const itemEntry = { kind: "item" as const, item, index };
    return startsGroup
      ? [
          {
            kind: "group" as const,
            key: selected ? "selected" : "available",
            label: selected
              ? labels.selected(selectedValues.size)
              : labels.selectMore,
          },
          itemEntry,
        ]
      : [itemEntry];
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index) => {
      const entry = entries[index];
      return entry?.kind === "group"
        ? `group-${entry.key}`
        : (entry?.item.value ?? index);
    },
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

  if (filteredItems.length === 0) {
    return (
      <div className="text-muted-foreground py-6 text-center text-sm">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ComboboxPrimitive.List
      className="scroll-py-1 overflow-auto overscroll-contain p-1"
      ref={handleScrollElementRef}
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
          const entry = entries[virtualItem.index];
          if (!entry) return null;

          const style = {
            height: virtualItem.size,
            transform: `translateY(${virtualItem.start}px)`,
          };

          if (entry.kind === "group") {
            return (
              <ComboboxPrimitive.Group className="contents" key={entry.key}>
                <ComboboxPrimitive.GroupLabel
                  className="text-muted-foreground absolute top-0 left-0 w-full px-2 pt-3 pb-1 text-xs"
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={style}
                >
                  {entry.label}
                </ComboboxPrimitive.GroupLabel>
              </ComboboxPrimitive.Group>
            );
          }

          return (
            <ComboboxPrimitive.Item
              aria-posinset={entry.index + 1}
              aria-setsize={filteredItems.length}
              className="data-highlighted:bg-accent data-highlighted:text-accent-foreground absolute top-0 left-0 flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50"
              data-index={virtualItem.index}
              index={entry.index}
              key={entry.item.value}
              ref={virtualizer.measureElement}
              style={style}
              value={entry.item}
            >
              {renderItem?.(entry.item) ?? (
                <span className="min-w-0 truncate">{entry.item.label}</span>
              )}
              <ComboboxPrimitive.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                <Check />
              </ComboboxPrimitive.ItemIndicator>
            </ComboboxPrimitive.Item>
          );
        })}
      </div>
    </ComboboxPrimitive.List>
  );
};

const VirtualizedComboboxContent = <TData,>({
  contentClassName,
  emptyLabel,
  groupSelections,
  messages: messageOverrides,
  renderItem,
  selectedValues,
  virtualizerRef,
}: Pick<
  VirtualizedComboboxSharedProps<TData>,
  "contentClassName" | "emptyLabel" | "messages" | "renderItem"
> & {
  groupSelections: boolean;
  selectedValues: ReadonlySet<string>;
  virtualizerRef: RefObject<VirtualizedComboboxVirtualizer | null>;
}) => {
  const labels = virtualizedComboboxMessages(messageOverrides);

  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        align="start"
        className="isolate z-50"
        side="bottom"
        sideOffset={6}
      >
        <ComboboxPrimitive.Popup
          className={cn(
            "relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-0 origin-(--transform-origin) overflow-hidden rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-in-95",
            contentClassName,
          )}
        >
          <div className="min-w-0 p-1 pb-0">
            <InputGroup className="border-input/30 bg-input/30 h-8 w-full min-w-0 shadow-none">
              <ComboboxPrimitive.Input
                placeholder={labels.search}
                render={<InputGroupInput />}
              />
            </InputGroup>
          </div>
          <VirtualizedComboboxList
            emptyLabel={emptyLabel}
            groupSelections={groupSelections}
            messages={messageOverrides}
            renderItem={renderItem}
            selectedValues={selectedValues}
            virtualizerRef={virtualizerRef}
          />
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
};

const defaultTrigger = (
  ariaLabel: string,
  ariaInvalid: boolean | undefined,
  disabled: boolean | undefined,
  label: ReactNode,
  triggerId: string | undefined,
) => (
  <Button
    aria-label={ariaLabel}
    aria-invalid={ariaInvalid}
    className="w-full max-w-full min-w-0 justify-between overflow-hidden"
    disabled={disabled}
    id={triggerId}
    type="button"
    variant="outline"
  >
    <span className="min-w-0 truncate text-left">{label}</span>
    <ChevronsUpDown className="text-muted-foreground shrink-0 opacity-70" />
  </Button>
);

const selectedLabel = <TData,>(
  value:
    | VirtualizedComboboxOption<TData>
    | readonly VirtualizedComboboxOption<TData>[]
    | null,
  placeholder: ReactNode,
) => {
  if (Array.isArray(value)) {
    return value.length > 0
      ? value.map(({ label }) => label).join(", ")
      : placeholder;
  }
  return value && "label" in value ? value.label : placeholder;
};

const useComboboxVirtualizerRef = (
  providedRef?: RefObject<VirtualizedComboboxVirtualizer | null>,
) => {
  const localRef = useRef<VirtualizedComboboxVirtualizer | null>(null);
  return providedRef ?? localRef;
};

const VirtualizedComboboxSingle = <TData,>(
  props: VirtualizedComboboxSingleProps<TData>,
) => {
  const virtualizerRef = useComboboxVirtualizerRef(props.virtualizerRef);
  return (
    <ComboboxPrimitive.Root<VirtualizedComboboxOption<TData>>
      disabled={props.disabled}
      inputValue={props.searchValue}
      items={[...props.items]}
      itemToStringLabel={(item) => item.label}
      isItemEqualToValue={optionEquals}
      onInputValueChange={(value) => props.onSearchValueChange?.(value)}
      onItemHighlighted={(_, { index, reason }) => {
        if (reason === "keyboard" && index >= 0) {
          virtualizerRef.current?.scrollToIndex(index, { align: "auto" });
        }
      }}
      onOpenChange={(open) => props.onOpenChange?.(open)}
      onValueChange={(value) => props.onValueChange(value)}
      open={props.open}
      value={props.value}
      virtualized
    >
      <ComboboxPrimitive.Trigger
        render={
          props.trigger ??
          defaultTrigger(
            props.ariaLabel,
            props.ariaInvalid,
            props.disabled,
            selectedLabel(props.value, props.placeholder),
            props.triggerId,
          )
        }
      />
      <VirtualizedComboboxContent
        {...props}
        groupSelections={false}
        selectedValues={new Set(props.value ? [props.value.value] : [])}
        virtualizerRef={virtualizerRef}
      />
    </ComboboxPrimitive.Root>
  );
};

const VirtualizedComboboxMultiple = <TData,>(
  props: VirtualizedComboboxMultipleProps<TData>,
) => {
  const virtualizerRef = useComboboxVirtualizerRef(props.virtualizerRef);
  return (
    <ComboboxPrimitive.Root<VirtualizedComboboxOption<TData>, true>
      disabled={props.disabled}
      inputValue={props.searchValue}
      items={[...props.items]}
      itemToStringLabel={(item) => item.label}
      isItemEqualToValue={optionEquals}
      multiple
      onInputValueChange={(value) => props.onSearchValueChange?.(value)}
      onItemHighlighted={(_, { index, reason }) => {
        if (reason === "keyboard" && index >= 0) {
          virtualizerRef.current?.scrollToIndex(index, { align: "auto" });
        }
      }}
      onOpenChange={(open) => props.onOpenChange?.(open)}
      onValueChange={(value) => props.onValueChange(value)}
      open={props.open}
      value={[...props.value]}
      virtualized
    >
      <ComboboxPrimitive.Trigger
        render={
          props.trigger ??
          defaultTrigger(
            props.ariaLabel,
            props.ariaInvalid,
            props.disabled,
            selectedLabel(props.value, props.placeholder),
            props.triggerId,
          )
        }
      />
      <VirtualizedComboboxContent
        {...props}
        groupSelections
        selectedValues={new Set(props.value.map(({ value }) => value))}
        virtualizerRef={virtualizerRef}
      />
    </ComboboxPrimitive.Root>
  );
};

export function VirtualizedCombobox<TData = never>(
  props: VirtualizedComboboxProps<TData>,
) {
  return props.multiple ? (
    <VirtualizedComboboxMultiple {...props} />
  ) : (
    <VirtualizedComboboxSingle {...props} />
  );
}
