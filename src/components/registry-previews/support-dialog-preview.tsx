import { Effect } from "effect";
import { SupportDialog } from "@/components/support-dialog";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const SupportDialogPreview = () => {
  const locale = getLocale();
  return (
    <div className="grid justify-items-start gap-3">
      <SupportDialog
        locale={locale}
        messages={{ [locale]: { success: m.support_preview_success() } }}
        onSubmit={() => Effect.runPromise(Effect.sleep("600 millis"))}
      />
      <p className="text-muted-foreground text-sm">
        {m.support_preview_local_only()}
      </p>
    </div>
  );
};
