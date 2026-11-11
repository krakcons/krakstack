import { useState } from "react";
import { CronExpressionEditor } from "@/components/ui/cron-expression-editor";
import { getLocale } from "@/paraglide/runtime";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";

export const CronExpressionEditorPreview = () => {
  const [value, setValue] = useState("0 9 * * 1-5");
  const examples = [
    { value: "0 * * * *", label: m.cron_example_hourly() },
    { value: "0 9 * * *", label: m.cron_example_daily() },
    { value: "0 9 * * 1-5", label: m.cron_example_weekdays() },
  ];
  return (
    <div className="grid gap-5">
      <CronExpressionEditor
        value={value}
        onValueChange={setValue}
        timeZone="America/Toronto"
        referenceTime={new Date("2026-11-10T12:00:00Z")}
        locale={getLocale()}
      />
      <div className="grid gap-2 border-t pt-3">
        <p className="text-muted-foreground text-xs">
          {m.cron_examples_help()}
        </p>
        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <Button
              key={example.value}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setValue(example.value)}
            >
              {example.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
