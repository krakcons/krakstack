import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ChoiceCardOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

type ChoiceCardsBaseProps = {
  name: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  options: readonly ChoiceCardOption[];
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  onBlur?: () => void;
};

export type ChoiceCardsProps = ChoiceCardsBaseProps &
  (
    | {
        mode: "single";
        value: string | null;
        onValueChange: (value: string) => void;
        required?: boolean;
      }
    | {
        mode: "multiple";
        value: readonly string[];
        onValueChange: (value: string[]) => void;
        required?: never;
      }
  );

/** Native inputs retain browser keyboard navigation and form submission. */
export const ChoiceCards = (props: ChoiceCardsProps) => {
  const id = useId();
  const describedBy =
    [
      props.description ? `${id}-description` : undefined,
      props.error ? `${id}-error` : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <fieldset
      data-slot="choice-cards"
      disabled={props.disabled}
      aria-describedby={describedBy}
      aria-invalid={props.error ? true : undefined}
      className={cn("min-w-0 space-y-3", props.containerClassName)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          props.onBlur?.();
      }}
    >
      <legend data-slot="choice-cards-label" className="text-sm font-medium">
        {props.label}
      </legend>
      {props.description ? (
        <p id={`${id}-description`} className="text-muted-foreground text-sm">
          {props.description}
        </p>
      ) : null}
      <div
        data-slot="choice-cards-grid"
        className={cn("grid gap-3 sm:grid-cols-2", props.className)}
      >
        {props.options.map((option) => (
          <label
            data-slot="choice-card"
            data-state={
              (
                props.mode === "single"
                  ? props.value === option.value
                  : props.value.includes(option.value)
              )
                ? "checked"
                : "unchecked"
            }
            data-disabled={props.disabled || option.disabled || undefined}
            key={option.value}
            className="bg-card has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-ring flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors has-focus-visible:ring-2 has-disabled:cursor-not-allowed has-disabled:opacity-50"
          >
            <input
              type={props.mode === "single" ? "radio" : "checkbox"}
              name={props.name}
              value={option.value}
              disabled={option.disabled}
              required={props.mode === "single" ? props.required : undefined}
              checked={
                props.mode === "single"
                  ? props.value === option.value
                  : props.value.includes(option.value)
              }
              aria-invalid={props.error ? true : undefined}
              aria-describedby={describedBy}
              className="accent-primary mt-0.5 size-4 shrink-0"
              onChange={(event) => {
                if (props.mode === "single") props.onValueChange(option.value);
                else
                  props.onValueChange(
                    event.target.checked
                      ? [...props.value, option.value]
                      : props.value.filter((value) => value !== option.value),
                  );
              }}
            />
            {option.icon ? (
              <span aria-hidden="true" className="shrink-0 [&_svg]:size-5">
                {option.icon}
              </span>
            ) : null}
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-medium">{option.label}</span>
              {option.description ? (
                <span className="text-muted-foreground">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
      {props.error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
          {props.error}
        </p>
      ) : null}
    </fieldset>
  );
};
