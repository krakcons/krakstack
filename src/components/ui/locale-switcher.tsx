import {
  setLocale,
  getLocale,
  locales,
  type Locale,
} from "@/paraglide/runtime";
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

const LocaleSchema = Schema.Literals(locales).annotate({
  identifier: "Locale",
});

const messages = {
  en: {
    title: "Switch language",
    en: "English",
    fr: "Français",
  },
  fr: {
    title: "Changer de langue",
    en: "English",
    fr: "Français",
  },
} as const satisfies Record<Locale, Record<Locale | "title", string>>;

type LocaleSwitcherMessages = Partial<Record<Locale | "title", string>>;

type LocaleSwitcherProps = {
  messages?: LocaleSwitcherMessages;
};

const localeMessages = (overrides?: LocaleSwitcherMessages) => ({
  ...(getLocale().startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

export const LocaleSwitcher = ({ messages }: LocaleSwitcherProps) => {
  const locale = getLocale();
  const labels = localeMessages(messages);

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
                Option.match({ onNone: () => undefined, onSome: setLocale }),
              )
            }
          >
            {locales.map((l) => (
              <DropdownMenuRadioItem key={l} value={l}>
                {labels[l]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
