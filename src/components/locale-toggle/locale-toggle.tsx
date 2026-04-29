import { setLocale, getLocale, locales, type Locale } from "@/paraglide/runtime";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { m } from "@/paraglide/messages";

const localeLabels: Record<Locale, () => string> = {
  en: m.locale_en,
  fr: m.locale_fr,
};

export const LocaleToggle = () => {
  const locale = getLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" className="focus-visible:ring-0">
            <Languages className="size-4" />
            <span className="sr-only">{m.locale_toggle_label()}</span>
          </Button>
        }
      />
      <DropdownMenuContent className="w-32">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{m.locale_toggle_label()}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={locale} onValueChange={(v) => setLocale(v as Locale)}>
            {locales.map((l) => (
              <DropdownMenuRadioItem key={l} value={l}>
                {localeLabels[l]()}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
