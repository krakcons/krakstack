"use client";

import { useId, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { cn } from "@/lib/utils";

export type SelectWithCustomInputOption = {
  value: string;
  label: string;
  disabled?: boolean;
  input?: {
    label: string;
    placeholder?: string;
    required?: boolean;
    maxLength?: number;
  };
};
export type SelectWithCustomInputValue = {
  option: string;
  customValue?: string;
};
export type SelectWithCustomInputProps = {
  label: string;
  options: readonly SelectWithCustomInputOption[];
  value: SelectWithCustomInputValue | null;
  onValueChange: (value: SelectWithCustomInputValue | null) => void;
  name?: string;
  customName?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  description?: string;
  error?: string;
  locale?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  inputClassName?: string;
};

/** Option identifiers and custom text stay separate; the host owns the option catalog. */
export const SelectWithCustomInput = ({
  label,
  options,
  value,
  onValueChange,
  name,
  customName,
  required,
  disabled,
  readOnly,
  placeholder,
  description,
  error,
  locale,
  className,
  triggerClassName,
  contentClassName,
  inputClassName,
}: SelectWithCustomInputProps) => {
  const id = useId();
  const language = useKrakstackLocale(locale);
  const selected = options.find((option) => option.value === value?.option);
  const input = useRef<HTMLInputElement>(null);
  const focusInput = useRef(false);
  const describedBy =
    [description && `${id}-description`, error && `${id}-error`]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div
      data-slot="select-with-custom-input"
      data-state={selected?.input ? "custom" : "preset"}
      className={cn("grid min-w-0 gap-2", className)}
    >
      <label
        htmlFor={id}
        data-slot="select-with-custom-input-label"
        className="text-sm font-medium"
      >
        {label}
      </label>
      <Select
        items={options}
        value={value?.option ?? null}
        name={name}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        onValueChange={(next) => {
          const option = options.find((option) => option.value === next);
          if (disabled || readOnly || option?.disabled) return;
          if (!option) {
            onValueChange(null);
            return;
          }
          if (option.value === value?.option) return;
          focusInput.current = Boolean(option.input);
          onValueChange(
            option.input
              ? { option: option.value, customValue: "" }
              : { option: option.value },
          );
        }}
      >
        <SelectTrigger
          id={id}
          data-component="select-with-custom-input-trigger"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn("w-full min-w-0", triggerClassName)}
        >
          <SelectValue
            placeholder={
              placeholder ??
              (language.startsWith("fr")
                ? "Sélectionner une option"
                : "Select an option")
            }
          />
        </SelectTrigger>
        <SelectContent
          data-component="select-with-custom-input-content"
          className={contentClassName}
          finalFocus={() => {
            const target = focusInput.current ? input.current : null;
            focusInput.current = false;
            return target ?? true;
          }}
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected?.input ? (
        <div data-slot="select-with-custom-input-field" className="grid gap-2">
          <label htmlFor={`${id}-custom`} className="text-sm font-medium">
            {selected.input.label}
          </label>
          <Input
            ref={input}
            id={`${id}-custom`}
            data-component="select-with-custom-input-text"
            name={customName ?? (name ? `${name}Custom` : undefined)}
            value={value?.customValue ?? ""}
            disabled={disabled}
            readOnly={readOnly}
            required={selected.input.required}
            maxLength={selected.input.maxLength}
            placeholder={selected.input.placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={inputClassName}
            onChange={(event) => {
              if (!disabled && !readOnly)
                onValueChange({
                  option: selected.value,
                  customValue: event.target.value,
                });
            }}
          />
        </div>
      ) : null}
      {description ? (
        <p
          id={`${id}-description`}
          data-slot="select-with-custom-input-description"
          className="text-muted-foreground text-xs"
        >
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          data-slot="select-with-custom-input-error"
          role="alert"
          className="text-destructive text-sm"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
};
