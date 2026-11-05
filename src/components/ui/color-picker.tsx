import { Schema } from "effect";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { HexColorPicker } from "react-colorful";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";

const HexColor = Schema.String.check(
  Schema.isPattern(/^#?(?:[\da-f]{3}|[\da-f]{6})$/i),
).annotate({
  identifier: "HexColor",
});

const normalizeHex = (value: string) => {
  const trimmed = value.trim();
  if (!Schema.is(HexColor)(trimmed)) return undefined;
  const hex = trimmed.replace(/^#/, "");
  return `#${(hex.length === 3
    ? hex
        .split("")
        .map((digit) => digit + digit)
        .join("")
    : hex
  ).toUpperCase()}`;
};

const labels = {
  en: {
    input: "HEX color",
    open: "Choose color",
    saturation: "Saturation and brightness",
    hue: "Hue",
    saturationValue: "Saturation",
    brightnessValue: "Brightness",
  },
  fr: {
    input: "Couleur HEX",
    open: "Choisir une couleur",
    saturation: "Saturation et luminosité",
    hue: "Teinte",
    saturationValue: "Saturation",
    brightnessValue: "Luminosité",
  },
};

export type ColorPickerMessages = Record<keyof typeof labels.en, string>;
export type ColorPickerMessageTranslations = Partial<
  Record<string, Partial<ColorPickerMessages>>
>;

export type ColorPickerProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type" | "size"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  locale?: string;
  messages?: ColorPickerMessageTranslations;
};

// react-colorful does not expose its internal slider labels as props. Keep this
// localization adapter scoped to the popup, including changing value text.
const ColorPanel = ({
  color,
  onChange,
  copy,
}: {
  color: string;
  onChange: (color: string) => void;
  copy: ColorPickerMessages;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const valueText = useRef({ raw: "", localized: "" });
  useEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const localize = () => {
      const saturation = panel.querySelector(
        ".react-colorful__saturation [role=slider]",
      );
      const hue = panel.querySelector(".react-colorful__hue [role=slider]");
      saturation?.setAttribute("aria-label", copy.saturation);
      hue?.setAttribute("aria-label", copy.hue);
      const text = saturation?.getAttribute("aria-valuetext");
      if (text) {
        const raw =
          text === valueText.current.localized ? valueText.current.raw : text;
        const localized = raw
          .replace("Saturation", copy.saturationValue)
          .replace("Brightness", copy.brightnessValue);
        valueText.current = { raw, localized };
        if (localized !== text)
          saturation?.setAttribute("aria-valuetext", localized);
      }
    };
    localize();
    const observer = new MutationObserver(localize);
    observer.observe(panel, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-valuetext"],
    });
    return () => observer.disconnect();
  }, [copy.saturation, copy.hue, copy.saturationValue, copy.brightnessValue]);

  return (
    <div
      ref={ref}
      className="[&_.react-colorful]:h-48 [&_.react-colorful]:w-full [&_.react-colorful__hue]:h-4 [&_.react-colorful__pointer]:size-5"
    >
      <HexColorPicker color={color} onChange={onChange} />
    </div>
  );
};

export const ColorPicker = ({
  value,
  defaultValue = "#2563EB",
  onValueChange,
  locale: localeOverride,
  messages,
  className,
  disabled,
  readOnly,
  onBlur,
  onKeyDown,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  ...inputProps
}: ColorPickerProps) => {
  const locale = useKrakstackLocale(localeOverride);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const [internalValue, setInternalValue] = useState(
    normalizeHex(defaultValue) ?? "#2563EB",
  );
  const color = normalizeHex(value ?? internalValue) ?? "#2563EB";
  const [draft, setDraft] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState(value);
  const [open, setOpen] = useState(false);

  // External changes (including form resets) supersede any incomplete draft.
  if (previousValue !== value) {
    setPreviousValue(value);
    if (draft === null || normalizeHex(draft) !== normalizeHex(value ?? ""))
      setDraft(null);
  }

  const commit = (next: string) => {
    const normalized = normalizeHex(next);
    if (!normalized) return;
    if (value === undefined) setInternalValue(normalized);
    if (normalized !== color) onValueChange?.(normalized);
  };

  return (
    <Popover open={open && !disabled && !readOnly} onOpenChange={setOpen}>
      <InputGroup className={className} data-disabled={disabled || undefined}>
        <InputGroupInput
          {...inputProps}
          type="text"
          aria-label={ariaLabel ?? copy.input}
          aria-invalid={
            ariaInvalid ??
            (draft !== null && !normalizeHex(draft) ? true : undefined)
          }
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          readOnly={readOnly}
          value={draft ?? color}
          onChange={(event) => {
            setDraft(event.target.value);
            commit(event.target.value);
          }}
          onBlur={(event) => {
            // Invalid/incomplete text never replaces the last valid color.
            setDraft(null);
            onBlur?.(event);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (
              !event.defaultPrevented &&
              (event.key === "Enter" || event.key === "Escape")
            ) {
              setDraft(null);
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <PopoverTrigger
            render={
              <InputGroupButton
                aria-label={copy.open}
                disabled={disabled || readOnly}
                size="icon-xs"
              />
            }
          >
            <span
              aria-hidden="true"
              className="size-5 rounded-sm border border-black/15"
              style={{ backgroundColor: color }}
            />
          </PopoverTrigger>
        </InputGroupAddon>
      </InputGroup>
      <PopoverContent
        align="end"
        className="w-64 max-w-[calc(100vw-2rem)] gap-3 p-3"
      >
        <PopoverTitle className="sr-only">{copy.open}</PopoverTitle>
        <ColorPanel
          color={color}
          copy={copy}
          onChange={(next) => {
            setDraft(null);
            commit(next);
          }}
        />
        <output className="text-muted-foreground text-center font-mono text-xs">
          {color}
        </output>
      </PopoverContent>
    </Popover>
  );
};
