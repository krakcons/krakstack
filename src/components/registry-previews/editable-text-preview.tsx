import { Effect } from "effect";
import { useId, useState } from "react";
import { EditableText } from "@/components/ui/editable-text";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const EditableTextPreview = () => {
  const id = useId();
  const [value, setValue] = useState("KrakStack");
  const [fail, setFail] = useState(false);
  return (
    <div className="grid max-w-lg gap-4">
      <label htmlFor={id} className="flex items-center gap-2 text-sm">
        <input
          id={id}
          type="checkbox"
          checked={fail}
          onChange={(event) => setFail(event.target.checked)}
        />
        {m.interactions_simulate_failure()}
      </label>
      <EditableText
        value={value}
        label={m.interactions_project_name()}
        locale={getLocale()}
        maxLength={80}
        onSave={async (next) => {
          await Effect.runPromise(
            Effect.sleep("400 millis").pipe(
              Effect.andThen(
                fail || !next.trim()
                  ? Effect.fail("example validation")
                  : Effect.void,
              ),
            ),
          );
          setValue(next);
        }}
      />
      <p className="text-muted-foreground text-sm">
        {m.interactions_edit_help()}
      </p>
    </div>
  );
};
