"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { CalendarDays, X } from "lucide-react";
import { enUS, fr } from "react-day-picker/locale";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { cn } from "@/lib/utils";
import { getDatePickerState, parseDateOnly } from "./date-picker.schema";
export {
  DateOnlySchema,
  getDatePickerState,
  parseDateOnly,
} from "./date-picker.schema";

export type DatePickerMessages = {
  label: string;
  open: string;
  clear: string;
  invalid: string;
  outOfRange: string;
  invalidRange: string;
};

// Supply the focus ref missing from the installed Calendar day-button wrapper.
const DatePickerDayButton = (
  props: ComponentProps<typeof CalendarDayButton>,
) => {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (props.modifiers.focused) ref.current?.focus();
  }, [props.modifiers.focused]);
  const buttonProps = { ...props, ref };
  return <CalendarDayButton {...buttonProps} />;
};
export type DatePickerProps = {
  /** YYYY-MM-DD, or an empty/incomplete draft while typing. Never an instant. */
  value: string;
  onValueChange: (value: string) => void;
  min?: string;
  max?: string;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  description?: string;
  locale?: string;
  messages?: Partial<Record<string, Partial<DatePickerMessages>>>;
  className?: string;
  inputClassName?: string;
  contentClassName?: string;
  calendarClassName?: string;
  calendarClassNames?: ComponentProps<typeof Calendar>["classNames"];
};
const labels = {
  en: {
    label: "Date",
    open: "Open calendar",
    clear: "Clear date",
    invalid: "Enter a valid date as YYYY-MM-DD.",
    outOfRange: "Choose a date within the allowed range.",
    invalidRange: "The allowed date range is invalid.",
  },
  fr: {
    label: "Date",
    open: "Ouvrir le calendrier",
    clear: "Effacer la date",
    invalid: "Saisissez une date valide au format AAAA-MM-JJ.",
    outOfRange: "Choisissez une date dans la plage autorisée.",
    invalidRange: "La plage de dates autorisée est invalide.",
  },
};

export const DatePicker = ({
  value,
  onValueChange,
  min,
  max,
  label,
  name,
  required,
  disabled,
  readOnly,
  clearable = true,
  description,
  locale: override,
  messages,
  className,
  inputClassName,
  contentClassName,
  calendarClassName,
  calendarClassNames,
}: DatePickerProps) => {
  const id = useId();
  const language = useKrakstackLocale(override);
  const copy = {
    ...(language.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[language.split("-")[0] ?? language],
    ...messages?.[language],
  };
  const [open, setOpen] = useState(false);
  const status = getDatePickerState({ value, min, max });
  const error =
    status === "invalid"
      ? copy.invalid
      : status === "out-of-range"
        ? copy.outOfRange
        : status === "invalid-range"
          ? copy.invalidRange
          : undefined;
  const selected = status === "valid" ? parseDateOnly(value) : undefined;
  const minimum = min ? parseDateOnly(min) : undefined;
  const maximum = max ? parseDateOnly(max) : undefined;
  const locked = disabled || readOnly;
  const describedBy =
    [description && `${id}-description`, error && `${id}-error`]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div
      data-slot="date-picker"
      data-state={status}
      className={cn("grid min-w-0 gap-2", className)}
    >
      <label
        htmlFor={id}
        data-slot="date-picker-label"
        className="text-sm font-medium"
      >
        {label ?? copy.label}
      </label>
      <div data-slot="date-picker-controls" className="flex min-w-0 gap-2">
        <Input
          ref={(element) => {
            element?.setCustomValidity(error ?? "");
          }}
          data-component="date-picker-input"
          id={id}
          name={name}
          value={value}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={language.startsWith("fr") ? "AAAA-MM-JJ" : "YYYY-MM-DD"}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn("min-w-0 flex-1 tabular-nums", inputClassName)}
          onChange={(event) => {
            if (!locked) onValueChange(event.target.value);
          }}
        />
        <Popover
          open={open && !locked && status !== "invalid-range"}
          onOpenChange={setOpen}
        >
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={locked || status === "invalid-range"}
                aria-label={copy.open}
                data-component="date-picker-trigger"
              />
            }
          >
            <CalendarDays aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent
            // Let Calendar's autoFocus select the active day instead of the first nav button.
            initialFocus={false}
            align="end"
            data-component="date-picker-content"
            className={cn(
              "w-auto max-w-[calc(100vw-2rem)] gap-0 p-0",
              contentClassName,
            )}
          >
            <PopoverTitle className="sr-only">
              {label ?? copy.label}
            </PopoverTitle>
            {open ? (
              <Calendar
                components={{ DayButton: DatePickerDayButton }}
                mode="single"
                required
                autoFocus
                timeZone="UTC"
                locale={language.startsWith("fr") ? fr : enUS}
                selected={selected}
                defaultMonth={selected ?? minimum ?? maximum}
                startMonth={minimum}
                endMonth={maximum}
                disabled={[
                  ...(minimum ? [{ before: minimum }] : []),
                  ...(maximum ? [{ after: maximum }] : []),
                ]}
                className={calendarClassName}
                classNames={calendarClassNames}
                onSelect={(date) => {
                  if (locked) return;
                  const next = date.toISOString().slice(0, 10);
                  if (getDatePickerState({ value: next, min, max }) !== "valid")
                    return;
                  onValueChange(next);
                  setOpen(false);
                }}
              />
            ) : null}
          </PopoverContent>
        </Popover>
        {clearable && value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-component="date-picker-clear"
            disabled={locked}
            aria-label={copy.clear}
            onClick={() => onValueChange("")}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {description ? (
        <p
          id={`${id}-description`}
          data-slot="date-picker-description"
          className="text-muted-foreground text-xs"
        >
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          data-slot="date-picker-error"
          role="status"
          className="text-destructive text-sm"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
};
