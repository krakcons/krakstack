import { useId, useLayoutEffect, useRef, type ComponentProps } from "react";
import {
  getCountries,
  AsYouType,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";
import { Input } from "@/components/ui/input";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { Button } from "@/components/ui/button";
import { VirtualizedCombobox } from "@/components/ui/virtualized-combobox";
import { ChevronsUpDown } from "lucide-react";
import { fitsE164DigitLimit } from "./phone-number-input.schema";
import { cn } from "@/lib/utils";

export type PhoneNumberDetails = {
  e164: string;
  extension: string | null;
  country: CountryCode | null;
};
export const normalizePhoneNumber = (
  value: string,
  country: CountryCode,
): PhoneNumberDetails | null => {
  const phone = parsePhoneNumberFromString(value, {
    defaultCountry: country,
    extract: false,
  });
  return phone?.isValid() && fitsE164DigitLimit(value, country)
    ? {
        e164: phone.number,
        extension: phone.ext ?? null,
        country: phone.country ?? null,
      }
    : null;
};
export type PhoneNumberInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "type" | "country"
> & {
  value: string;
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  onValueChange: (value: string, details: PhoneNumberDetails | null) => void;
  countries?: readonly CountryCode[];
  locale?: string;
  label?: string;
  withExtension?: boolean;
  containerClassName?: string;
  contentClassName?: string;
};
export const PhoneNumberInput = ({
  value,
  country,
  onCountryChange,
  onValueChange,
  countries = getCountries(),
  locale,
  label,
  id,
  onBlur,
  name,
  withExtension = false,
  onKeyDown,
  className,
  containerClassName,
  contentClassName,
  ...props
}: PhoneNumberInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const language = useKrakstackLocale(locale);
  const french = language.startsWith("fr");
  const names = new Intl.DisplayNames([language], { type: "region" });
  const options = [...new Set([country, ...countries])].sort((a, b) =>
    (names.of(a) ?? a).localeCompare(names.of(b) ?? b, language),
  );
  const valid = normalizePhoneNumber(value, country);
  const parsed = parsePhoneNumberFromString(value, {
    defaultCountry: country,
    extract: false,
  });
  const callingCode = value.trim().startsWith("+")
    ? (parsed?.countryCallingCode ?? getCountryCallingCode(country))
    : getCountryCallingCode(country);
  const nationalDraft = value.trim().startsWith(`+${callingCode}`)
    ? value
        .trim()
        .slice(callingCode.length + 1)
        .trimStart()
    : value;
  const extension = parsed?.ext ?? "";
  const nationalDigits = (
    extension
      ? nationalDraft.replace(/(?:ext\.?|x|#|;ext=)\s*\d+\s*$/i, "")
      : nationalDraft
  ).replace(/\D/g, "");
  const formatCountry = parsed?.country ?? country;
  const nationalValue = parsed?.isValid()
    ? parsed.formatNational({ formatExtension: (number) => number })
    : new AsYouType(formatCountry).input(nationalDigits);
  const pendingCaret = useRef<{
    element: HTMLInputElement;
    digits: number;
  } | null>(null);
  useLayoutEffect(() => {
    const pending = pendingCaret.current;
    if (!pending) return;
    pendingCaret.current = null;
    let remaining = pending.digits;
    let position = 0;
    while (position < pending.element.value.length && remaining > 0) {
      if (/\d/.test(pending.element.value[position]!)) remaining--;
      position++;
    }
    pending.element.setSelectionRange(position, position);
  });
  const emitNational = (draft: string, nextExtension = extension) => {
    const digits = draft.replace(/\D/g, "");
    const next = digits
      ? `+${callingCode} ${digits}${nextExtension ? ` ext. ${nextExtension}` : ""}`
      : "";
    if (!fitsE164DigitLimit(next, country)) {
      pendingCaret.current = null;
      return;
    }
    onValueChange(next, normalizePhoneNumber(next, country));
  };
  const countryLabel = french ? "Pays du numéro" : "Phone country";
  const items = options.map((code) => ({
    value: code,
    label: `${names.of(code)} (${code}) +${getCountryCallingCode(code)}`,
  }));
  return (
    <div
      data-slot="phone-number-input"
      className={cn("grid gap-2", containerClassName)}
    >
      <label
        data-slot="phone-number-label"
        htmlFor={inputId}
        className="text-sm font-medium"
      >
        {label ?? (french ? "Numéro de téléphone" : "Phone number")}
      </label>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={value}
          disabled={props.disabled}
        />
      ) : null}
      <div data-slot="phone-number-controls" className="flex min-w-0 gap-2">
        <VirtualizedCombobox
          ariaLabel={countryLabel}
          locale={language}
          items={items}
          value={items.find((item) => item.value === country) ?? null}
          placeholder={country}
          emptyLabel={
            french ? "Aucun pays correspondant." : "No matching countries."
          }
          contentClassName={cn(
            "w-72! max-w-[calc(100vw-2rem)]!",
            contentClassName,
          )}
          disabled={props.disabled || props.readOnly}
          trigger={
            <Button
              type="button"
              variant="outline"
              aria-label={countryLabel}
              disabled={props.disabled || props.readOnly}
              className="shrink-0 gap-1.5 px-2.5"
            >
              <span>{country}</span>
              <span className="text-muted-foreground">+{callingCode}</span>
              <ChevronsUpDown
                aria-hidden="true"
                className="size-3.5 opacity-60"
              />
            </Button>
          }
          onValueChange={(item) => {
            const selected = options.find((option) => option === item?.value);
            if (!selected || selected === country) return;
            const next = nationalDigits
              ? `+${getCountryCallingCode(selected)} ${nationalDigits}${extension ? ` ext. ${extension}` : ""}`
              : "";
            if (!fitsE164DigitLimit(next, selected)) return;
            onCountryChange(selected);
            onValueChange(next, normalizePhoneNumber(next, selected));
          }}
        />
        <Input
          {...props}
          data-component="phone-number-national"
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete={props.autoComplete ?? "tel-national"}
          className={cn("min-w-0 flex-1", className)}
          value={nationalValue}
          aria-invalid={Boolean(value) && !valid}
          aria-describedby={`${inputId}-status ${props["aria-describedby"] ?? ""}`}
          onChange={(event) => {
            const draft = event.target.value;
            const international = draft.trimStart().startsWith("+");
            const pasted = parsePhoneNumberFromString(draft, {
              defaultCountry: country,
              extract: false,
            });
            if (!international && !pasted?.ext) {
              pendingCaret.current = {
                element: event.target,
                digits: draft
                  .slice(0, event.target.selectionStart ?? draft.length)
                  .replace(/\D/g, "").length,
              };
              emitNational(draft);
              return;
            }
            const digits = draft.replace(/\D/g, "");
            const next = pasted?.isValid()
              ? `${pasted.number}${pasted.ext ? ` ext. ${pasted.ext}` : ""}`
              : digits
                ? `${international ? "+" : `+${callingCode} `}${digits}`
                : "";
            if (!fitsE164DigitLimit(next, country)) return;
            const details = normalizePhoneNumber(next, country);
            if (
              international &&
              details?.country &&
              options.includes(details.country) &&
              details.country !== country
            )
              onCountryChange(details.country);
            onValueChange(next, details);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (
              event.defaultPrevented ||
              props.readOnly ||
              props.disabled ||
              event.ctrlKey ||
              event.metaKey ||
              event.altKey
            )
              return;
            // Formatting belongs to the component, never to the typed input.
            if (event.key.length === 1 && /\D/.test(event.key)) {
              event.preventDefault();
              return;
            }
            if (event.key !== "Backspace" && event.key !== "Delete") return;
            const element = event.currentTarget;
            const start = element.selectionStart ?? 0;
            if (start !== element.selectionEnd) return;
            const direction = event.key === "Backspace" ? -1 : 1;
            let index = direction === -1 ? start - 1 : start;
            if (
              index < 0 ||
              index >= nationalValue.length ||
              /\d/.test(nationalValue[index]!)
            )
              return;
            while (
              index >= 0 &&
              index < nationalValue.length &&
              /\D/.test(nationalValue[index]!)
            )
              index += direction;
            if (index < 0 || index >= nationalValue.length) return;
            event.preventDefault();
            const next =
              nationalValue.slice(0, index) + nationalValue.slice(index + 1);
            pendingCaret.current = {
              element,
              digits: nationalValue
                .slice(0, direction === -1 ? index : start)
                .replace(/\D/g, "").length,
            };
            emitNational(next);
          }}
          onBlur={(event) => {
            if (!props.readOnly && !props.disabled && valid) {
              const formatted = parsePhoneNumberFromString(value, {
                defaultCountry: country,
                extract: false,
              })?.formatInternational();
              if (formatted && formatted !== value)
                onValueChange(formatted, valid);
            }
            onBlur?.(event);
          }}
        />
      </div>
      {withExtension || extension ? (
        <div
          data-slot="phone-number-extension"
          className="grid max-w-32 gap-1.5"
        >
          <label
            htmlFor={`${inputId}-extension`}
            className="text-muted-foreground text-xs"
          >
            {french ? "Poste" : "Extension"}
          </label>
          <Input
            id={`${inputId}-extension`}
            type="text"
            inputMode="numeric"
            value={extension}
            disabled={props.disabled}
            readOnly={props.readOnly}
            onChange={(event) =>
              emitNational(
                nationalDigits,
                event.target.value.replace(/\D/g, ""),
              )
            }
          />
        </div>
      ) : null}
      <p
        data-slot="phone-number-status"
        id={`${inputId}-status`}
        className="text-muted-foreground text-xs"
      >
        {valid
          ? `${valid.e164}${valid.extension ? ` ext. ${valid.extension}` : ""}`
          : french
            ? "Saisissez un numéro complet. La validation ne vérifie pas son propriétaire."
            : "Enter a complete number. Validation does not verify ownership."}
      </p>
    </div>
  );
};
