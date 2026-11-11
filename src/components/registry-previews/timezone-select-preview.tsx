import { useState } from "react";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const TimezoneSelectPreview = () => {
  const [value, setValue] = useState<string | null>("America/Toronto");
  return (
    <div className="grid min-w-0 gap-4">
      <TimezoneSelect
        label={m.new_components_timezone()}
        locale={getLocale()}
        value={value}
        onValueChange={setValue}
      />
      <p className="text-muted-foreground text-sm">
        {m.new_components_timezone_help()}
      </p>
    </div>
  );
};
