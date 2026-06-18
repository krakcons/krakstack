import { SquarePen } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLocale } from "@/paraglide/runtime";

export type EditingLocale = "en" | "fr";

const messages = {
  en: { label: "Editing", en: "English", fr: "French" },
  fr: { label: "Modification", en: "Anglais", fr: "Français" },
} as const satisfies Record<
  EditingLocale,
  Record<EditingLocale | "label", string>
>;

export type EditingLocaleSwitcherMessages = Partial<
  Record<EditingLocale | "label", string>
>;

const editingLocaleMessages = (overrides?: EditingLocaleSwitcherMessages) => ({
  ...(getLocale().startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

export function EditingLocaleSwitcher({
  messages,
  value,
  onValueChange,
}: {
  messages?: EditingLocaleSwitcherMessages;
  value: EditingLocale;
  onValueChange: (value: EditingLocale) => void;
}) {
  const labels = editingLocaleMessages(messages);
  const localeOptions: { value: EditingLocale; label: string }[] = [
    { value: "en", label: labels.en },
    { value: "fr", label: labels.fr },
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
          <div className="sr-only sm:not-sr-only">{labels.label}</div>
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
