import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const DatePickerPreview = () => {
  const [value, setValue] = useState("2026-11-11");
  return (
    <div className="mx-auto w-full max-w-sm">
      <DatePicker
        value={value}
        onValueChange={setValue}
        label={m.date_picker_demo_label()}
        description={m.date_picker_demo_help()}
        min="2026-01-01"
        max="2027-12-31"
        locale={getLocale()}
      />
    </div>
  );
};
