import { Effect } from "effect";
import {
  SupportDialog,
  SupportForm,
  type SupportFormProps,
} from "@/components/support";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const getSupportPreviewProps = (): SupportFormProps => {
  const locale = getLocale();
  return {
    locale,
    supportEmail: "support@krakconsultants.com",
    onSubmit: () => Effect.runPromise(Effect.sleep("600 millis")),
  };
};

export const SupportDialogPreview = () => {
  const props = getSupportPreviewProps();
  return (
    <div className="grid max-w-xl gap-3">
      <p className="text-muted-foreground text-sm">
        {m.support_preview_local_only()}
      </p>
      <div>
        <SupportDialog
          {...props}
          trigger={<Button variant="outline">{m.support_feedback()}</Button>}
        />
      </div>
      <SupportForm {...props} />
    </div>
  );
};
