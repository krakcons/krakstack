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
  parseTimeValue,
  formatTimeValue,
  getTimeIntervals,
  timePrecisionUnit,
  parse12HourTime,
  type TimePrecision,
} from "./time-picker.schema";
export {
  TimeOnlySchema,
  MinuteStepSchema,
  getTimePickerState,
  parseTimeOnly,
  Time12HourSchema,
  parse12HourTime,
  TimeSecondSchema,
  TimeMillisecondSchema,
  parseTimeValue,
  formatTimeValue,
  type TimePrecision,
} from "./time-picker.schema";

export type TimePickerMessages = {
  label: string;
  open: string;
  clear: string;
  hours: string;
  minutes: string;
  seconds: string;
  milliseconds: string;
  period: string;
  done: string;
  invalid: string;
  invalid12: string;
  invalidSecond: string;
  invalidMillisecond: string;
  invalid12Second: string;
  invalid12Millisecond: string;
  outOfRange: string;
  invalidRange: string;
  offStep: string;
};

export type TimePickerProps = {
  /** Canonical 24-hour time at the selected precision, or a draft. */
  value: string;
  onValueChange: (value: string) => void;
  min?: string;
  max?: string;
  /** Allowed minute values start at 00 in each hour; integer from 1 to 60. */
  minuteStep?: number;
  /** Defaults to minute; seconds and milliseconds are opt-in. */
  precision?: TimePrecision;
  /** Display and entry format. Values and bounds always use 24-hour time. */
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
    seconds: "Seconds",
    milliseconds: "Milliseconds",
    period: "AM/PM",
    done: "Done",
    invalid: "Enter a valid time as HH:mm (00:00–23:59).",
    invalid12: "Enter a valid time with AM or PM, such as 09:30 AM.",
    invalidSecond: "Enter a valid time as HH:mm:ss (00:00:00–23:59:59).",
    invalidMillisecond:
      "Enter a valid time as HH:mm:ss.SSS (00:00:00.000–23:59:59.999).",
    invalid12Second:
      "Enter a valid time with seconds and AM or PM, such as 09:30:15 AM.",
    invalid12Millisecond:
      "Enter a valid time with milliseconds and AM or PM, such as 09:30:15.123 AM.",
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
    seconds: "Secondes",
    milliseconds: "Millisecondes",
    period: "AM/PM",
    done: "Terminer",
    invalid: "Saisissez une heure valide au format HH:mm (00:00–23:59).",
    invalid12:
      "Saisissez une heure valide avec AM ou PM, par exemple 09:30 AM.",
    invalidSecond:
      "Saisissez une heure valide au format HH:mm:ss (00:00:00–23:59:59).",
    invalidMillisecond:
      "Saisissez une heure valide au format HH:mm:ss.SSS (00:00:00.000–23:59:59.999).",
    invalid12Second:
      "Saisissez une heure valide avec les secondes et AM ou PM, par exemple 09:30:15 AM.",
    invalid12Millisecond:
      "Saisissez une heure valide avec les millisecondes et AM ou PM, par exemple 09:30:15.123 AM.",
    outOfRange: "Choisissez une heure dans la plage autorisée.",
    invalidRange: "La plage horaire ou le pas des minutes est invalide.",
    offStep: "Choisissez une heure qui respecte le pas des minutes.",
  },
};
const pad = (value: number) => String(value).padStart(2, "0");

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
  precision = "minute",
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
    precision: TimePrecision;
  }>();
  const activeDraft =
    draft?.value === value &&
    draft.hourCycle === hourCycle &&
    draft.precision === precision
      ? draft
      : undefined;
  const canonicalStatus = getTimePickerState({
    value,
    min,
    max,
    minuteStep,
    precision,
  });
  const status =
    canonicalStatus !== "invalid-range" &&
    hourCycle === 12 &&
    activeDraft?.text &&
    !parse12HourTime(activeDraft.text, precision)
      ? "invalid"
      : canonicalStatus;
  const parsedValue = parseTimeValue(value, precision);
  const displayValue =
    activeDraft?.text ??
    (hourCycle === 12 && parsedValue !== undefined
      ? `${Math.floor(parsedValue / 3_600_000) % 12 || 12}${value.slice(2)} ${parsedValue < 43_200_000 ? "AM" : "PM"}`
      : value);
  const error =
    status === "invalid"
      ? hourCycle === 12
        ? precision === "minute"
          ? copy.invalid12
          : precision === "second"
            ? copy.invalid12Second
            : copy.invalid12Millisecond
        : precision === "minute"
          ? copy.invalid
          : precision === "second"
            ? copy.invalidSecond
            : copy.invalidMillisecond
      : status === "invalid-range"
        ? copy.invalidRange
        : status === "out-of-range"
          ? copy.outOfRange
          : status === "off-step"
            ? copy.offStep
            : undefined;
  const locked = disabled || readOnly;
  const unit = timePrecisionUnit(precision);
  const intervals =
    status === "invalid-range"
      ? []
      : getTimeIntervals(
          min === undefined ? 0 : parseTimeValue(min, precision)!,
          max === undefined
            ? 86_400_000 - unit
            : parseTimeValue(max, precision)!,
          minuteStep,
          precision,
        );
  const selected =
    status === "valid" ? parsedValue! : (intervals[0]?.start ?? 0);
  const hour = Math.floor(selected / 3_600_000);
  const minute = Math.floor(selected / 60_000) % 60;
  const second = Math.floor(selected / 1000) % 60;
  const period = Math.floor(hour / 12);
  const periods = [
    ...new Set(intervals.map(({ minute }) => Math.floor(minute / 720))),
  ];
  const hours = [
    ...new Set(
      intervals
        .filter(
          ({ minute }) =>
            hourCycle === 24 || Math.floor(minute / 720) === period,
        )
        .map(({ minute }) => Math.floor(minute / 60)),
    ),
  ].sort((left, right) =>
    hourCycle === 12 ? (left % 12 || 12) - (right % 12 || 12) : left - right,
  );
  const minutes = intervals
    .filter(({ minute }) => Math.floor(minute / 60) === hour)
    .map(({ minute }) => minute % 60);
  const current = intervals.find(
    (interval) => interval.minute === Math.floor(selected / 60_000),
  );
  const seconds = Array.from({ length: 60 }, (_, second) => second).filter(
    (second) => {
      const start = hour * 3_600_000 + minute * 60_000 + second * 1000;
      return (
        current && start <= current.end && start + 1000 - unit >= current.start
      );
    },
  );
  const milliseconds = Array.from(
    { length: 1000 },
    (_, millisecond) => millisecond,
  ).filter((millisecond) => {
    const time = Math.floor(selected / 1000) * 1000 + millisecond;
    return current && time >= current.start && time <= current.end;
  });
  const selectClosest = (desired: number, choices = intervals) => {
    const candidates = choices.map(({ start, end }) =>
      Math.max(start, Math.min(end, desired)),
    );
    const closest = candidates.reduce<number | undefined>(
      (best, time) =>
        best === undefined ||
        Math.abs(time - desired) < Math.abs(best - desired)
          ? time
          : best,
      undefined,
    );
    if (closest !== undefined) select(closest);
  };
  const select = (time: number) => {
    const next = formatTimeValue(time, precision);
    if (
      !locked &&
      getTimePickerState({ value: next, min, max, minuteStep, precision }) ===
        "valid"
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
          placeholder={`${hourCycle === 12 ? "hh" : "HH"}:mm${precision === "minute" ? "" : ":ss"}${precision === "millisecond" ? ".SSS" : ""}${hourCycle === 12 ? " AM/PM" : ""}`}
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
              hourCycle === 12
                ? (parse12HourTime(text, precision) ?? text)
                : text;
            setDraft({ text, value: next, hourCycle, precision });
            onValueChange(next);
          }}
          onBlur={() => {
            if (
              activeDraft &&
              (hourCycle === 24 || parse12HourTime(activeDraft.text, precision))
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
              "max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] gap-3 overflow-y-auto",
              precision === "millisecond"
                ? "w-112"
                : precision === "second"
                  ? "w-96"
                  : "w-72",
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
                precision === "millisecond"
                  ? hourCycle === 12
                    ? "grid-cols-5"
                    : "grid-cols-4"
                  : precision === "second"
                    ? hourCycle === 12
                      ? "grid-cols-4"
                      : "grid-cols-3"
                    : hourCycle === 12
                      ? "grid-cols-3"
                      : "grid-cols-2",
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
                  selectClosest(
                    nextHour * 3_600_000 + (selected % 3_600_000),
                    intervals.filter(
                      ({ minute }) => Math.floor(minute / 60) === nextHour,
                    ),
                  );
                }}
              />
              <TimeColumn
                label={copy.minutes}
                values={minutes}
                selected={minute}
                className={columnClassName}
                optionClassName={optionClassName}
                onSelect={(minute) =>
                  selectClosest(
                    hour * 3_600_000 + minute * 60_000 + (selected % 60_000),
                    intervals.filter(
                      (interval) => interval.minute === hour * 60 + minute,
                    ),
                  )
                }
              />
              {precision !== "minute" ? (
                <TimeColumn
                  label={copy.seconds}
                  values={seconds}
                  selected={second}
                  className={columnClassName}
                  optionClassName={optionClassName}
                  onSelect={(second) => {
                    const start =
                      Math.floor(selected / 60_000) * 60_000 + second * 1000;
                    if (current)
                      selectClosest(start + (selected % 1000), [
                        {
                          ...current,
                          start: Math.max(current.start, start),
                          end: Math.min(current.end, start + 1000 - unit),
                        },
                      ]);
                  }}
                />
              ) : null}
              {precision === "millisecond" ? (
                <TimeColumn
                  label={copy.milliseconds}
                  values={milliseconds}
                  selected={selected % 1000}
                  format={(value) => String(value).padStart(3, "0")}
                  className={columnClassName}
                  optionClassName={optionClassName}
                  onSelect={(millisecond) =>
                    select(Math.floor(selected / 1000) * 1000 + millisecond)
                  }
                />
              ) : null}
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
                      ((hour % 12) + nextPeriod * 12) * 3_600_000 +
                      (selected % 3_600_000);
                    selectClosest(
                      desired,
                      intervals.filter(
                        ({ minute }) => Math.floor(minute / 720) === nextPeriod,
                      ),
                    );
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
