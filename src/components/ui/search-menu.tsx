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
import { getLocale } from "@/paraglide/runtime";

const messages = {
  en: {
    title: "Search",
    description: "Search for an item to open.",
    placeholder: "Search...",
    inputPlaceholder: "Search...",
    emptyMessage: "No results found.",
  },
  fr: {
    title: "Recherche",
    description: "Recherchez un élément à ouvrir.",
    placeholder: "Rechercher...",
    inputPlaceholder: "Rechercher...",
    emptyMessage: "Aucun résultat trouvé.",
  },
} as const;

export type SearchMenuMessages = Partial<
  Record<
    | "title"
    | "description"
    | "placeholder"
    | "inputPlaceholder"
    | "emptyMessage",
    string
  >
>;

const searchMenuMessages = (overrides?: SearchMenuMessages) => ({
  ...(getLocale().startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

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
  messages?: SearchMenuMessages;
  shortcutLabel?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: SearchMenuItem) => void;
};

export function SearchMenu({
  groups,
  title,
  description,
  placeholder,
  inputPlaceholder,
  emptyMessage,
  messages,
  shortcutLabel = "⌘K",
  className,
  open,
  onOpenChange,
  onSelect,
}: SearchMenuProps) {
  const labels = searchMenuMessages(messages);
  const resolvedTitle = title ?? labels.title;
  const resolvedDescription = description ?? labels.description;
  const resolvedPlaceholder = placeholder ?? labels.placeholder;
  const resolvedInputPlaceholder = inputPlaceholder ?? labels.inputPlaceholder;
  const resolvedEmptyMessage = emptyMessage ?? labels.emptyMessage;
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
        aria-label={resolvedPlaceholder}
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
          {resolvedPlaceholder}
        </span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
          {shortcutLabel}
        </kbd>
      </Button>
      <CommandDialog
        open={isOpen}
        onOpenChange={setOpen}
        title={resolvedTitle}
        description={resolvedDescription}
      >
        <Command>
          <CommandInput placeholder={resolvedInputPlaceholder} />
          <CommandList>
            <CommandEmpty>{resolvedEmptyMessage}</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup heading={group.heading} key={group.heading}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    className="data-[selected=false]:!text-foreground data-[selected=true]:bg-muted data-[selected=true]:text-foreground gap-3 py-2 data-[selected=false]:!bg-transparent"
                    value={item.label}
                    {...(item.keywords ? { keywords: item.keywords } : {})}
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
