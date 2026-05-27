import { SearchIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

export type SearchMenuItem = {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  onSelect?: () => void;
};

export type SearchMenuGroup = {
  heading: string;
  items: SearchMenuItem[];
};

export type SearchMenuProps = {
  groups: SearchMenuGroup[];
  title?: string;
  description?: string;
  placeholder?: string;
  inputPlaceholder?: string;
  emptyMessage?: string;
  shortcutLabel?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: SearchMenuItem) => void;
};

export function SearchMenu({
  groups,
  title = m.search_menu_title(),
  description = m.search_menu_description(),
  placeholder = m.search_menu_placeholder(),
  inputPlaceholder = m.search_menu_input_placeholder(),
  emptyMessage = m.search_menu_empty(),
  shortcutLabel = "⌘K",
  className,
  open,
  onOpenChange,
  onSelect,
}: SearchMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = open ?? uncontrolledOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setUncontrolledOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;

      event.preventDefault();
      setOpen(!isOpen);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setOpen]);

  return (
    <>
      <Button
        aria-label={placeholder}
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "sm:h-9 sm:w-64 sm:justify-start sm:gap-2.5 sm:px-2.5 sm:font-normal",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="text-muted-foreground hidden min-w-0 flex-1 truncate text-left font-normal sm:block">
          {placeholder}
        </span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
          {shortcutLabel}
        </kbd>
      </Button>
      <CommandDialog
        open={isOpen}
        onOpenChange={setOpen}
        title={title}
        description={description}
      >
        <Command>
          <CommandInput placeholder={inputPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup heading={group.heading} key={group.heading}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    className="data-[selected=false]:!text-foreground data-[selected=true]:bg-muted data-[selected=true]:text-foreground gap-3 py-2 data-[selected=false]:!bg-transparent"
                    value={[
                      item.label,
                      item.description,
                      group.heading,
                      ...(item.keywords ?? []),
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onSelect={() => {
                      setOpen(false);
                      item.onSelect?.();
                      onSelect?.(item);
                    }}
                    {...(item.disabled === undefined
                      ? {}
                      : { disabled: item.disabled })}
                  >
                    {item.icon ? (
                      <div className="text-muted-foreground bg-background group-data-[selected=true]/command-item:bg-background flex size-8 shrink-0 items-center justify-center rounded-md border">
                        {item.icon}
                      </div>
                    ) : null}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-medium">{item.label}</span>
                      {item.description ? (
                        <span className="text-muted-foreground truncate text-xs">
                          {item.description}
                        </span>
                      ) : null}
                    </div>
                    {item.shortcut ? (
                      <CommandShortcut>{item.shortcut}</CommandShortcut>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
