import { useId, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AsyncActionButton } from "@/components/ui/async-action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";

export type DangerConfirmationMessages = {
  confirm: string;
  cancel: string;
  typeToConfirm: string;
  pending: string;
  error: string;
};
export type DangerConfirmationProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmation?: string;
  onConfirm: () => Promise<void>;
  locale?: string;
  messages?: Partial<Record<string, Partial<DangerConfirmationMessages>>>;
};

const labels = {
  en: {
    confirm: "Confirm deletion",
    cancel: "Cancel",
    typeToConfirm: "Type the following text to confirm",
    pending: "Deleting…",
    error:
      "Could not complete the action. Check its status before trying again.",
  },
  fr: {
    confirm: "Confirmer la suppression",
    cancel: "Annuler",
    typeToConfirm: "Saisissez le texte suivant pour confirmer",
    pending: "Suppression…",
    error:
      "Impossible de terminer l’action. Vérifiez son état avant de réessayer.",
  },
};

/** Confirmation is a UI safeguard, never an authorization boundary. */
export const DangerConfirmation = (props: DangerConfirmationProps) => {
  const locale = useKrakstackLocale(props.locale);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...props.messages?.[locale.split("-")[0] ?? locale],
    ...props.messages?.[locale],
  };
  const [pending, setPending] = useState(false);
  return (
    <AlertDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!pending) props.onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <DangerConfirmationBody
          key={props.open ? "open" : "closed"}
          {...props}
          locale={locale}
          copy={copy}
          pending={pending}
          onPendingChange={setPending}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
};

const DangerConfirmationBody = ({
  title,
  description,
  confirmation,
  onConfirm,
  onOpenChange,
  locale,
  copy,
  pending,
  onPendingChange,
}: DangerConfirmationProps & {
  copy: DangerConfirmationMessages;
  pending: boolean;
  onPendingChange: (pending: boolean) => void;
}) => {
  const id = useId();
  const [text, setText] = useState("");
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      {confirmation !== undefined ? (
        <div className="grid gap-2">
          <Label htmlFor={id}>{copy.typeToConfirm}</Label>
          <code id={`${id}-phrase`} className="text-sm break-all">
            {confirmation}
          </code>
          <Input
            id={id}
            aria-describedby={`${id}-phrase`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={pending}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      ) : null}
      <AlertDialogFooter>
        <AlertDialogCancel type="button" disabled={pending}>
          {copy.cancel}
        </AlertDialogCancel>
        <AsyncActionButton
          variant="destructive"
          disabled={confirmation !== undefined && text !== confirmation}
          locale={locale}
          messages={{
            [locale ?? "en"]: {
              pending: copy.pending,
              retry: copy.confirm,
              error: copy.error,
            },
          }}
          onPendingChange={onPendingChange}
          onAction={async () => {
            await onConfirm();
            onOpenChange(false);
          }}
        >
          {copy.confirm}
        </AsyncActionButton>
      </AlertDialogFooter>
    </>
  );
};
