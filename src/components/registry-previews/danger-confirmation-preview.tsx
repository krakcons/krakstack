import { Effect } from "effect";
import { useRef, useState } from "react";
import { DangerConfirmation } from "@/components/ui/danger-confirmation";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const DangerConfirmationPreview = () => {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div className="grid justify-items-start gap-4">
      <Button
        ref={trigger}
        type="button"
        variant="destructive"
        onClick={() => {
          setDone(false);
          setOpen(true);
        }}
      >
        {m.interactions_delete_example()}
      </Button>
      <DangerConfirmation
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) trigger.current?.focus();
        }}
        title={m.interactions_delete_title()}
        description={m.interactions_delete_description()}
        confirmation="DELETE"
        locale={getLocale()}
        onConfirm={async () => {
          await Effect.runPromise(Effect.sleep("600 millis"));
          setDone(true);
        }}
      />
      <p role="status" className="text-muted-foreground text-sm">
        {done ? m.interactions_deleted_example() : m.interactions_local_only()}
      </p>
    </div>
  );
};
