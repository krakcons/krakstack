import { Effect } from "effect";
import { useId, useState } from "react";
import { AsyncActionButton } from "@/components/ui/async-action-button";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const AsyncActionButtonPreview = () => {
  const id = useId();
  const [fail, setFail] = useState(false);
  return (
    <div className="grid justify-items-start gap-4">
      <label htmlFor={id} className="flex items-center gap-2 text-sm">
        <input
          id={id}
          type="checkbox"
          checked={fail}
          onChange={(event) => setFail(event.target.checked)}
        />
        {m.interactions_simulate_failure()}
      </label>
      <AsyncActionButton
        locale={getLocale()}
        onAction={() =>
          Effect.runPromise(
            Effect.sleep("600 millis").pipe(
              Effect.andThen(fail ? Effect.fail("example") : Effect.void),
            ),
          )
        }
      >
        {m.interactions_run_action()}
      </AsyncActionButton>
      <p className="text-muted-foreground text-sm">
        {m.interactions_local_only()}
      </p>
    </div>
  );
};
