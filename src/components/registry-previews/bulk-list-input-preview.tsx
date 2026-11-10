import { useId, useState } from "react";
import { BulkListInput, parseBulkList } from "@/components/ui/bulk-list-input";
import { Label } from "@/components/ui/label";
import { m } from "@/paraglide/messages";

export const BulkListInputPreview = () => {
  const id = useId();
  const [value, setValue] = useState(
    "alex@example.org,\ncamille@example.org,\nALEX@example.org",
  );
  const result = parseBulkList(value, {
    normalize: (item) => item.toLowerCase(),
  });
  return (
    <div className="mx-auto grid max-w-lg gap-3">
      <BulkListInput
        id={id}
        label={<Label htmlFor={id}>{m.new_components_recipients()}</Label>}
        value={value}
        onValueChange={setValue}
        rows={4}
        spellCheck={false}
      />
      <p role="status" className="text-muted-foreground text-sm">
        {m.new_components_list_summary({
          count: result.items.length,
          duplicates: result.duplicates,
        })}
      </p>
      <p className="text-muted-foreground text-xs">
        {m.new_components_list_help()}
      </p>
    </div>
  );
};
