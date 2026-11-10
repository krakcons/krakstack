import { useId, useState } from "react";
import { AutoHeight } from "@/components/ui/auto-height";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";

export const AutoHeightPreview = () => {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return (
    <div className="grid gap-4">
      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded(!expanded)}
      >
        {m.interactions_resize_content()}
      </Button>
      <div id={id}>
        <AutoHeight className="rounded-lg border" contentClassName="p-5">
          <p>{m.interactions_height_summary()}</p>
          {expanded ? (
            <p className="text-muted-foreground mt-4 text-sm leading-7">
              {m.interactions_height_details()}
            </p>
          ) : null}
        </AutoHeight>
      </div>
      <p className="text-muted-foreground text-sm">
        {m.interactions_motion_help()}
      </p>
    </div>
  );
};
