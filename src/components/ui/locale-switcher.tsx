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
import { Option, Schema } from "effect";

export const locales = ["en", "fr"] as const;

const messages = {
  en: {
    title: "Switch language",
    en: "English",
    fr: "Français",
  },
  fr: {
    title: "Changer de langue",
    en: "Anglais",
    fr: "Français",
  },
} as const;

export type LocaleSwitcherMessages = Partial<Record<string, string>>;
export type LocaleSwitcherMessageTranslations = Partial<
  Record<string, LocaleSwitcherMessages>
>;

type LocaleSwitcherProps = {
  locale: string;
  locales?: readonly string[];
  messages?: LocaleSwitcherMessageTranslations;
  onLocaleChange: (locale: string) => void;
};

const localeMessages = (
  locale: string,
  translations?: LocaleSwitcherMessageTranslations,
) => {
  const defaults = locale.startsWith("fr") ? messages.fr : messages.en;
  const base = translations?.[locale.split("-")[0] ?? locale];
  const exact = translations?.[locale];
  return {
    title: exact?.title ?? base?.title ?? defaults.title,
    localeName: (option: string) =>
      exact?.[option] ??
      base?.[option] ??
      (option === "en" ? defaults.en : option === "fr" ? defaults.fr : option),
  };
};

export const LocaleSwitcher = ({
  locale,
  locales: localeOptions = locales,
  messages,
  onLocaleChange,
}: LocaleSwitcherProps) => {
  const labels = localeMessages(locale, messages);
  const LocaleSchema = Schema.String.check(
    Schema.makeFilter((value) => localeOptions.includes(value)),
  ).annotate({ identifier: "Locale" });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" aria-label={labels.title}>
            <Languages className="size-4" />
            <span className="sr-only">{labels.title}</span>
          </Button>
        }
      />
      <DropdownMenuContent className="w-32">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{labels.title}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            aria-label={labels.title}
            value={locale}
            onValueChange={(value) =>
              Schema.decodeUnknownOption(LocaleSchema)(value).pipe(
                Option.match({
                  onNone: () => undefined,
                  onSome: onLocaleChange,
                }),
              )
            }
          >
            {localeOptions.map((l) => (
              <DropdownMenuRadioItem key={l} value={l}>
                {labels.localeName(l)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
