"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { Clock, X } from "lucide-react";
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
import {
  getTimePickerState,
  parseTimeOnly,
  parse12HourTime,
} from "./time-picker.schema";
export {
  TimeOnlySchema,
  MinuteStepSchema,
  getTimePickerState,
  parseTimeOnly,
  Time12HourSchema,
  parse12HourTime,
} from "./time-picker.schema";

export type TimePickerMessages = {
  label: string;
  open: string;
  clear: string;
  hours: string;
  minutes: string;
  period: string;
  done: string;
  invalid: string;
  invalid12: string;
  outOfRange: string;
  invalidRange: string;
  offStep: string;
};

export type TimePickerProps = {
  /** HH:mm, or an empty/incomplete draft while typing. */
  value: string;
  onValueChange: (value: string) => void;
  min?: string;
  max?: string;
  /** Allowed minute values start at 00 in each hour; integer from 1 to 60. */
  minuteStep?: number;
  /** Display and entry format. Values and bounds always use 24-hour HH:mm. */
  hourCycle?: 12 | 24;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  description?: string;
  locale?: string;
  messages?: Partial<Record<string, Partial<TimePickerMessages>>>;
  className?: string;
  inputClassName?: string;
  contentClassName?: string;
  columnClassName?: string;
  optionClassName?: string;
};

const labels = {
  en: {
    label: "Time",
    open: "Open time picker",
    clear: "Clear time",
    hours: "Hours",
    minutes: "Minutes",
    period: "AM/PM",
    done: "Done",
    invalid: "Enter a valid time as HH:mm (00:00–23:59).",
    invalid12: "Enter a valid time with AM or PM, such as 09:30 AM.",
    outOfRange: "Choose a time within the allowed range.",
    invalidRange: "The allowed time range or minute step is invalid.",
    offStep: "Choose a time that matches the minute step.",
  },
  fr: {
    label: "Heure",
    open: "Ouvrir le sélecteur d’heure",
    clear: "Effacer l’heure",
    hours: "Heures",
    minutes: "Minutes",
    period: "AM/PM",
    done: "Terminer",
    invalid: "Saisissez une heure valide au format HH:mm (00:00–23:59).",
    invalid12:
      "Saisissez une heure valide avec AM ou PM, par exemple 09:30 AM.",
    outOfRange: "Choisissez une heure dans la plage autorisée.",
    invalidRange: "La plage horaire ou le pas des minutes est invalide.",
    offStep: "Choisissez une heure qui respecte le pas des minutes.",
  },
};
const pad = (value: number) => String(value).padStart(2, "0");
const formatTime = (value: number) =>
  `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;

const TimeColumn = ({
  label,
  values,
  selected,
  onSelect,
  className,
  optionClassName,
  format = pad,
}: {
  label: string;
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  className?: string;
  optionClassName?: string;
  format?: (value: number) => string;
}) => {
  const id = useId();
  const focusOnSelection = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const selectedOption = useRef<HTMLButtonElement>(null);
  const choicesKey = values.join(",");
  // Center only when selection/options change, never in response to ordinary renders or scrolling.
  useLayoutEffect(() => {
    const container = viewport.current;
    const option = selectedOption.current;
    if (container && option) {
      container.scrollTop =
        option.offsetTop - (container.clientHeight - option.offsetHeight) / 2;
    }
  }, [selected, choicesKey]);
  return (
    <div
      data-slot="time-picker-column"
      className={cn("grid min-w-0 gap-2", className)}
    >
      <p
        id={id}
        data-slot="time-picker-column-label"
        className="text-muted-foreground text-center text-xs font-medium"
      >
        {label}
      </p>
      <div
        ref={viewport}
        role="radiogroup"
        aria-labelledby={id}
        data-slot="time-picker-options"
        className="relative flex h-56 min-w-0 flex-col gap-1 overflow-y-auto overscroll-contain p-1"
      >
        {values.map((value) => (
          <Button
            key={value}
            type="button"
            role="radio"
            aria-checked={value === selected}
            tabIndex={value === selected ? 0 : -1}
            variant={value === selected ? "secondary" : "ghost"}
            data-component="time-picker-option"
            className={cn(
              "w-full min-w-0 shrink-0 px-1 tabular-nums",
              optionClassName,
            )}
            ref={(element) => {
              if (value === selected) selectedOption.current = element;
              if (element && value === selected && focusOnSelection.current) {
                element.focus({ preventScroll: true });
                focusOnSelection.current = false;
              }
            }}
            onClick={() => onSelect(value)}
            onKeyDown={(event) => {
              const index = values.indexOf(value);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? values.length - 1
                    : event.key === "ArrowDown" || event.key === "ArrowRight"
                      ? (index + 1) % values.length
                      : event.key === "ArrowUp" || event.key === "ArrowLeft"
                        ? (index - 1 + values.length) % values.length
                        : undefined;
              if (next === undefined) return;
              event.preventDefault();
              focusOnSelection.current = true;
              onSelect(values[next]!);
            }}
          >
            {format(value)}
          </Button>
        ))}
      </div>
    </div>
  );
};

export const TimePicker = ({
  value,
  onValueChange,
  min,
  max,
  minuteStep = 1,
  hourCycle = 12,
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
  columnClassName,
  optionClassName,
}: TimePickerProps) => {
  const id = useId();
  const language = useKrakstackLocale(override);
  const copy = {
    ...(language.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[language.split("-")[0] ?? language],
    ...messages?.[language],
  };
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{
    text: string;
    value: string;
    hourCycle: 12 | 24;
  }>();
  const activeDraft =
    draft?.value === value && draft.hourCycle === hourCycle ? draft : undefined;
  const canonicalStatus = getTimePickerState({ value, min, max, minuteStep });
  const status =
    canonicalStatus !== "invalid-range" &&
    hourCycle === 12 &&
    activeDraft?.text &&
    !parse12HourTime(activeDraft.text)
      ? "invalid"
      : canonicalStatus;
  const parsedValue = parseTimeOnly(value);
  const displayValue =
    activeDraft?.text ??
    (hourCycle === 12 && parsedValue !== undefined
      ? `${Math.floor(parsedValue / 60) % 12 || 12}:${pad(parsedValue % 60)} ${parsedValue < 720 ? "AM" : "PM"}`
      : value);
  const error =
    status === "invalid"
      ? hourCycle === 12
        ? copy.invalid12
        : copy.invalid
      : status === "invalid-range"
        ? copy.invalidRange
        : status === "out-of-range"
          ? copy.outOfRange
          : status === "off-step"
            ? copy.offStep
            : undefined;
  const locked = disabled || readOnly;
  const times =
    status === "invalid-range"
      ? []
      : Array.from({ length: 1440 }, (_, time) => time).filter((time) => {
          const text = formatTime(time);
          return (
            (!min || text >= min) &&
            (!max || text <= max) &&
            (time % 60) % minuteStep === 0
          );
        });
  const selected = status === "valid" ? parseTimeOnly(value)! : (times[0] ?? 0);
  const hour = Math.floor(selected / 60);
  const period = Math.floor(hour / 12);
  const periods = [...new Set(times.map((time) => Math.floor(time / 720)))];
  const hours = [
    ...new Set(
      times
        .filter((time) => hourCycle === 24 || Math.floor(time / 720) === period)
        .map((time) => Math.floor(time / 60)),
    ),
  ].sort((left, right) =>
    hourCycle === 12 ? (left % 12 || 12) - (right % 12 || 12) : left - right,
  );
  const minutes = times
    .filter((time) => Math.floor(time / 60) === hour)
    .map((time) => time % 60);
  const select = (time: number) => {
    const next = formatTime(time);
    if (
      !locked &&
      getTimePickerState({ value: next, min, max, minuteStep }) === "valid"
    ) {
      setDraft(undefined);
      onValueChange(next);
    }
  };
  const describedBy =
    [description && `${id}-description`, error && `${id}-error`]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div
      data-slot="time-picker"
      data-state={status}
      className={cn("grid min-w-0 gap-2", className)}
    >
      <label
        htmlFor={id}
        data-slot="time-picker-label"
        className="text-sm font-medium"
      >
        {label ?? copy.label}
      </label>
      <div data-slot="time-picker-controls" className="flex min-w-0 gap-2">
        <Input
          id={id}
          value={displayValue}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          ref={(element) => {
            element?.setCustomValidity(error ?? "");
          }}
          placeholder={hourCycle === 12 ? "hh:mm AM/PM" : "HH:mm"}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          data-component="time-picker-input"
          className={cn("min-w-0 flex-1 tabular-nums", inputClassName)}
          onChange={(event) => {
            if (locked) return;
            const text = event.target.value;
            const next =
              hourCycle === 12 ? (parse12HourTime(text) ?? text) : text;
            setDraft({ text, value: next, hourCycle });
            onValueChange(next);
          }}
          onBlur={() => {
            if (
              activeDraft &&
              (hourCycle === 24 || parse12HourTime(activeDraft.text))
            )
              setDraft(undefined);
          }}
        />
        <input type="hidden" name={name} value={value} disabled={disabled} />
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
                data-component="time-picker-trigger"
              />
            }
          >
            <Clock aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            data-component="time-picker-content"
            className={cn(
              "max-h-[calc(100dvh-2rem)] w-72 max-w-[calc(100vw-2rem)] gap-3 overflow-y-auto",
              contentClassName,
            )}
          >
            <PopoverTitle className="sr-only">
              {label ?? copy.label}
            </PopoverTitle>
            <div
              data-slot="time-picker-columns"
              className={cn(
                "grid gap-3",
                hourCycle === 12 ? "grid-cols-3" : "grid-cols-2",
              )}
            >
              <TimeColumn
                label={copy.hours}
                values={hours}
                selected={hour}
                className={columnClassName}
                format={
                  hourCycle === 12 ? (hour) => String(hour % 12 || 12) : pad
                }
                optionClassName={optionClassName}
                onSelect={(nextHour) => {
                  const choices = times.filter(
                    (time) => Math.floor(time / 60) === nextHour,
                  );
                  const closest = choices.reduce(
                    (best, time) =>
                      Math.abs((time % 60) - (selected % 60)) <
                      Math.abs((best % 60) - (selected % 60))
                        ? time
                        : best,
                    choices[0]!,
                  );
                  select(closest);
                }}
              />
              <TimeColumn
                label={copy.minutes}
                values={minutes}
                selected={selected % 60}
                className={columnClassName}
                optionClassName={optionClassName}
                onSelect={(minute) => select(hour * 60 + minute)}
              />
              {hourCycle === 12 ? (
                <TimeColumn
                  label={copy.period}
                  values={periods}
                  selected={period}
                  format={(value) => (value === 0 ? "AM" : "PM")}
                  className={columnClassName}
                  optionClassName={optionClassName}
                  onSelect={(nextPeriod) => {
                    const desired =
                      ((hour % 12) + nextPeriod * 12) * 60 + (selected % 60);
                    const choices = times.filter(
                      (time) => Math.floor(time / 720) === nextPeriod,
                    );
                    const closest = choices.reduce(
                      (best, time) =>
                        Math.abs(time - desired) < Math.abs(best - desired)
                          ? time
                          : best,
                      choices[0]!,
                    );
                    select(closest);
                  }}
                />
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              data-component="time-picker-done"
              onClick={() => setOpen(false)}
            >
              {copy.done}
            </Button>
          </PopoverContent>
        </Popover>
        {clearable && value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-component="time-picker-clear"
            disabled={locked}
            aria-label={copy.clear}
            onClick={() => {
              setDraft(undefined);
              onValueChange("");
            }}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {description ? (
        <p
          id={`${id}-description`}
          data-slot="time-picker-description"
          className="text-muted-foreground text-xs"
        >
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          data-slot="time-picker-error"
          role="status"
          className="text-destructive text-sm"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
};
