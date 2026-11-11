import { useId, useLayoutEffect, useRef } from "react";
import { Effect, Option } from "effect";
import { CronExpressionParser } from "cron-parser";
import { Input } from "@/components/ui/input";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { formatCronDraft } from "./cron-expression-editor.schema";
import { cn } from "@/lib/utils";
export {
  CronDraftSchema,
  formatCronDraft,
} from "./cron-expression-editor.schema";

export const getCronPreview = (
  expression: string,
  timeZone: string,
  referenceTime: Date,
  count = 5,
): readonly Date[] | null => {
  if (
    expression.trim().split(/\s+/).length !== 5 ||
    !Number.isFinite(referenceTime.getTime()) ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 20
  )
    return null;
  const result = Effect.runSync(
    Effect.option(
      Effect.try(() => {
        new Intl.DateTimeFormat("en", { timeZone }).format(referenceTime);
        const interval = CronExpressionParser.parse(expression, {
          currentDate: referenceTime,
          tz: timeZone,
        });
        return Array.from({ length: count }, () => interval.next().toDate());
      }),
    ),
  );
  return Option.getOrNull(result);
};
export type CronExpressionEditorProps = {
  value: string;
  onValueChange: (value: string) => void;
  timeZone: string;
  /** Explicit instant keeps server rendering and DST previews reproducible. */
  referenceTime: Date;
  locale?: string;
  label?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
};
export const CronExpressionEditor = ({
  value,
  onValueChange,
  timeZone,
  referenceTime,
  locale,
  label,
  name,
  disabled,
  className,
  inputClassName,
}: CronExpressionEditorProps) => {
  const id = useId();
  const language = useKrakstackLocale(locale);
  const french = language.startsWith("fr");
  const dates = getCronPreview(value, timeZone, referenceTime);
  const selection = useRef<{
    element: HTMLInputElement;
    position: number;
  } | null>(null);
  useLayoutEffect(() => {
    const pending = selection.current;
    if (!pending) return;
    selection.current = null;
    pending.element.setSelectionRange(pending.position, pending.position);
  });
  const firstRun = dates?.[0];
  return (
    <div
      data-slot="cron-expression-editor"
      className={cn("grid min-w-0 gap-2", className)}
    >
      <label
        data-slot="cron-label"
        htmlFor={id}
        className="text-sm font-medium"
      >
        {label ?? (french ? "Expression cron" : "Cron expression")}
      </label>
      <Input
        data-component="cron-input"
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="*/15 9 * * 1-5"
        className={cn("font-mono tracking-wide", inputClassName)}
        aria-invalid={!dates}
        aria-describedby={`${id}-help`}
        onKeyDown={(event) => {
          if (
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey &&
            event.key.length === 1 &&
            !/[\d*/,\- ]/.test(event.key)
          )
            event.preventDefault();
        }}
        onChange={(event) => {
          const raw = event.target.value;
          const cursor = event.target.selectionStart ?? raw.length;
          const next = formatCronDraft(raw, cursor);
          if (next === null) return;
          selection.current = {
            element: event.target,
            position: raw.slice(0, cursor).replace(/\s+/g, " ").trimStart()
              .length,
          };
          onValueChange(next);
        }}
      />
      <p
        data-slot="cron-help"
        id={`${id}-help`}
        className="text-muted-foreground text-xs"
      >
        {french
          ? "Minute · heure · jour du mois · mois · jour de la semaine"
          : "Minute · hour · day of month · month · day of week"}
      </p>
      {dates && firstRun ? (
        <details
          data-slot="cron-preview"
          className="text-muted-foreground min-w-0 text-xs"
        >
          <summary
            data-slot="cron-summary"
            className="cursor-pointer rounded-sm outline-offset-4"
          >
            <span className="text-foreground font-medium">
              {french ? "Prochaines exécutions" : "Next runs"}
            </span>
            {" · "}
            <time dateTime={firstRun.toISOString()} title={timeZone}>
              {new Intl.DateTimeFormat(language, {
                timeZone,
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "short",
              }).format(firstRun)}
            </time>{" "}
            <span>+{dates.length - 1}</span>
          </summary>
          <p className="mt-2 break-all">{timeZone}</p>
          <ol data-slot="cron-runs" className="mt-1 grid gap-1">
            {dates.map((date) => (
              <li key={date.toISOString()}>
                <time dateTime={date.toISOString()}>
                  {new Intl.DateTimeFormat(language, {
                    timeZone,
                    dateStyle: "medium",
                    timeStyle: "long",
                  }).format(date)}
                </time>
              </li>
            ))}
          </ol>
        </details>
      ) : (
        <p
          data-slot="cron-error"
          role="status"
          className="text-destructive text-sm"
        >
          {french
            ? "Complétez les cinq champs. Si la règle est complète, vérifiez le fuseau, la date et les prochaines exécutions possibles."
            : "Complete all five fields. If the rule is complete, check the time zone, reference date and possible next runs."}
        </p>
      )}
    </div>
  );
};
