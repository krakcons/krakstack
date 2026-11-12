import { useState } from "react";
import { TimePicker } from "@/components/ui/time-picker";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const TimePickerPreview = () => {
  const [value, setValue] = useState("09:30");
  const [hourCycle, setHourCycle] = useState<12 | 24>(12);
  return (
    <div className="mx-auto grid w-full max-w-sm gap-4">
      <TimePicker
        value={value}
        onValueChange={setValue}
        label={m.time_picker_demo_label()}
        description={m.time_picker_demo_help()}
        min="09:00"
        max="17:30"
        hourCycle={hourCycle}
        locale={getLocale()}
      />
      <Button
        type="button"
        variant="outline"
        aria-pressed={hourCycle === 24}
        onClick={() => setHourCycle((cycle) => (cycle === 12 ? 24 : 12))}
      >
        {m.time_picker_demo_24_hour()}
      </Button>
    </div>
  );
};
