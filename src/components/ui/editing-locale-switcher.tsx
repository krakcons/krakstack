import { SquarePen } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EditingLocale = string;
export const editingLocales = ["en", "fr"] as const;

const messages = {
  en: { label: "Editing", en: "English", fr: "French" },
  fr: { label: "Modification", en: "Anglais", fr: "Français" },
} as const;

export type EditingLocaleSwitcherMessages = Partial<Record<string, string>>;
export type EditingLocaleSwitcherMessageTranslations = Partial<
  Record<string, EditingLocaleSwitcherMessages>
>;

const editingLocaleMessages = (
  locale: string,
  translations?: EditingLocaleSwitcherMessageTranslations,
) => {
  const defaults = locale.startsWith("fr") ? messages.fr : messages.en;
  const base = translations?.[locale.split("-")[0] ?? locale];
  const exact = translations?.[locale];
  return {
    label: exact?.label ?? base?.label ?? defaults.label,
    localeName: (option: string) =>
      exact?.[option] ??
      base?.[option] ??
      (option === "en" ? defaults.en : option === "fr" ? defaults.fr : option),
  };
};

export function EditingLocaleSwitcher({
  locale = "en",
  locales = editingLocales,
  messages,
  value,
  onValueChange,
}: {
  locale?: string;
  locales?: readonly string[];
  messages?: EditingLocaleSwitcherMessageTranslations;
  value: EditingLocale;
  onValueChange: (value: EditingLocale) => void;
}) {
  const labels = editingLocaleMessages(locale, messages);
  const localeOptions = locales.map((value) => ({
    value,
    label: labels.localeName(value),
  }));

  return (
    <Select
      items={localeOptions}
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue !== null) onValueChange(nextValue);
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
