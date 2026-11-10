import { useState } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const AnimatedNumberPreview = () => {
  const [value, setValue] = useState(1250);
  return (
    <div className="grid justify-items-start gap-4">
      <span className="text-muted-foreground text-sm">
        {m.interactions_example_total()}
      </span>
      <AnimatedNumber
        value={value}
        locale={getLocale()}
        format={{
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        }}
        className="text-4xl font-semibold tabular-nums"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setValue((current) => current + 250)}
        >
          {m.interactions_increase()}
        </Button>
        <Button type="button" variant="outline" onClick={() => setValue(1250)}>
          {m.interactions_reset()}
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        {m.interactions_motion_help()}
      </p>
    </div>
  );
};
