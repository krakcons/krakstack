import { Check, Grid2X2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";

export type AppSwitcherItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
};

export type AppSwitcherMessages = {
  label: string;
  current: string;
  empty: string;
};
export type AppSwitcherProps = {
  items: readonly AppSwitcherItem[];
  currentApp?: string;
  disabled?: boolean;
  className?: string;
  locale?: string;
  messages?: Partial<Record<string, Partial<AppSwitcherMessages>>>;
};

const labels = {
  en: {
    label: "Switch application",
    current: "Current application",
    empty: "No applications available",
  },
  fr: {
    label: "Changer d’application",
    current: "Application actuelle",
    empty: "Aucune application disponible",
  },
};

/** Navigation only: the host supplies trusted destinations and available apps. */
export const AppSwitcher = ({
  items,
  currentApp,
  disabled,
  className,
  locale: override,
  messages,
}: AppSwitcherProps) => {
  const locale = useKrakstackLocale(override);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={className}
            disabled={disabled}
            aria-label={copy.label}
          />
        }
      >
        <Grid2X2 aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)]"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>{copy.label}</DropdownMenuLabel>
          {items.length === 0 ? (
            <p className="text-muted-foreground px-2 py-3 text-sm">
              {copy.empty}
            </p>
          ) : null}
          {items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              disabled={item.disabled}
              render={
                <a
                  href={item.disabled ? undefined : item.href}
                  aria-current={item.id === currentApp ? "page" : undefined}
                />
              }
              className="gap-3 py-3"
            >
              {item.icon ? (
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border"
                >
                  {item.icon}
                </span>
              ) : null}
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">{item.label}</span>
                  {item.badge}
                </span>
                {item.description ? (
                  <span className="text-muted-foreground text-xs">
                    {item.description}
                  </span>
                ) : null}
              </span>
              {item.id === currentApp ? (
                <>
                  <Check aria-hidden="true" />
                  <span className="sr-only">{copy.current}</span>
                </>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
