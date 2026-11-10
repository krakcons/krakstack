import { useId, useState } from "react";
import { PresenceTransition } from "@/components/ui/presence-transition";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";

export const PresenceTransitionPreview = () => {
  const [open, setOpen] = useState(true);
  const id = useId();
  return (
    <div className="grid gap-4">
      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {m.interactions_toggle_content()}
      </Button>
      <div id={id} className="min-h-24">
        <PresenceTransition open={open}>
          <div className="bg-muted/30 rounded-lg border p-5">
            {m.interactions_presence_content()}
          </div>
        </PresenceTransition>
      </div>
      <p className="text-muted-foreground text-sm">
        {m.interactions_motion_help()}
      </p>
    </div>
  );
};
