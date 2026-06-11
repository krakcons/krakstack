import { SquarePen } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { m } from "@/paraglide/messages";

export type EditingLocale = "en" | "fr";

export function EditingLocaleSwitcher({
  value,
  onValueChange,
}: {
  value: EditingLocale;
  onValueChange: (value: EditingLocale) => void;
}) {
  const localeOptions: { value: EditingLocale; label: string }[] = [
    { value: "en", label: m.editing_locale_switcher_english() },
    { value: "fr", label: m.editing_locale_switcher_french() },
  ];

  return (
    <Select
      items={localeOptions}
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue === "en" || nextValue === "fr") {
          onValueChange(nextValue);
        }
      }}
    >
      <SelectTrigger id="editing-locale" className="w-full sm:w-fit">
        <Label
          htmlFor="editing-locale"
          className="text-muted-foreground text-sm"
        >
          <SquarePen className="size-4 sm:hidden" />
          <div className="sr-only sm:not-sr-only">
            {m.editing_locale_switcher_label()}
          </div>
        </Label>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {localeOptions.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
