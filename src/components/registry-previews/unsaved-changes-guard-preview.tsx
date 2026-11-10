import { Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import { UnsavedChangesGuard } from "@/components/ui/unsaved-changes-guard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const UnsavedChangesGuardPreview = () => {
  const id = useId();
  const [saved, setSaved] = useState("KrakStack");
  const [draft, setDraft] = useState(saved);
  const dirty = draft !== saved;
  return (
    <div className="grid max-w-lg gap-4">
      <UnsavedChangesGuard dirty={dirty} locale={getLocale()} />
      <Label htmlFor={id}>{m.interactions_project_name()}</Label>
      <Input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" disabled={!dirty} onClick={() => setSaved(draft)}>
          {m.interactions_save_locally()}
        </Button>
        <Link to="/docs" className="text-sm underline underline-offset-4">
          {m.interactions_try_leaving()}
        </Link>
      </div>
      <p role="status" className="text-muted-foreground text-sm">
        {dirty ? m.interactions_unsaved() : m.interactions_saved()}
      </p>
      <p className="text-muted-foreground text-sm">
        {m.interactions_guard_help()}
      </p>
    </div>
  );
};
