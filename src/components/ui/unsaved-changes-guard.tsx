import { useBlocker } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";

export type UnsavedChangesGuardMessages = {
  title: string;
  description: string;
  stay: string;
  leave: string;
};
export type UnsavedChangesGuardProps = {
  dirty: boolean;
  enabled?: boolean;
  protectBeforeUnload?: boolean;
  locale?: string;
  messages?: Partial<Record<string, Partial<UnsavedChangesGuardMessages>>>;
  className?: string;
};
const labels = {
  en: {
    title: "Leave without saving?",
    description:
      "You have unsaved changes. Leaving this page will discard them.",
    stay: "Keep editing",
    leave: "Leave page",
  },
  fr: {
    title: "Quitter sans enregistrer ?",
    description:
      "Des modifications n’ont pas été enregistrées. Elles seront perdues si vous quittez cette page.",
    stay: "Continuer la modification",
    leave: "Quitter la page",
  },
};

/** Mount once per editing route, inside a TanStack Router provider. */
export const UnsavedChangesGuard = ({
  dirty,
  enabled = true,
  protectBeforeUnload = true,
  locale: override,
  messages,
  className,
}: UnsavedChangesGuardProps) => {
  const locale = useKrakstackLocale(override);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const blocker = useBlocker({
    shouldBlockFn: () => dirty && enabled,
    enableBeforeUnload: dirty && enabled && protectBeforeUnload,
    withResolver: true,
  });
  return (
    <AlertDialog
      open={blocker.status === "blocked"}
      onOpenChange={(open) => {
        if (!open) blocker.reset?.();
      }}
    >
      <AlertDialogContent
        data-component="unsaved-changes-guard"
        className={className}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">{copy.stay}</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={() => blocker.proceed?.()}
          >
            {copy.leave}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
