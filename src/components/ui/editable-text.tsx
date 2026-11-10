import { Pencil } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { AsyncActionButton } from "@/components/ui/async-action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";

export type EditableTextMessages = {
  edit: string;
  save: string;
  cancel: string;
  empty: string;
  pending: string;
  error: string;
};
export type EditableTextProps = {
  value: string;
  label: string;
  onSave: (value: string) => Promise<void>;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  locale?: string;
  messages?: Partial<Record<string, Partial<EditableTextMessages>>>;
};
const labels = {
  en: {
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    empty: "Not set",
    pending: "Saving…",
    error: "Could not save. Check the value and try again.",
  },
  fr: {
    edit: "Modifier",
    save: "Enregistrer",
    cancel: "Annuler",
    empty: "Non défini",
    pending: "Enregistrement…",
    error: "Impossible d’enregistrer. Vérifiez la valeur et réessayez.",
  },
};

export const EditableText = ({
  value,
  label,
  onSave,
  disabled,
  maxLength,
  className,
  locale: override,
  messages,
}: EditableTextProps) => {
  const locale = useKrakstackLocale(override);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const [editing, setEditing] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (wasEditing.current && !editing) trigger.current?.focus();
    wasEditing.current = editing;
  }, [editing]);
  return (
    <div className={className}>
      {editing ? (
        <EditableTextEditor
          value={value}
          label={label}
          onSave={onSave}
          disabled={disabled}
          maxLength={maxLength}
          locale={locale}
          copy={copy}
          onClose={() => setEditing(false)}
        />
      ) : (
        <Button
          ref={trigger}
          type="button"
          variant="ghost"
          disabled={disabled}
          aria-label={`${copy.edit} ${label}`}
          className="h-auto max-w-full text-left whitespace-normal"
          onClick={() => setEditing(true)}
        >
          <span className="break-all">{value || copy.empty}</span>
          <Pencil aria-hidden="true" />
        </Button>
      )}
    </div>
  );
};

const EditableTextEditor = ({
  value,
  label,
  onSave,
  disabled,
  maxLength,
  locale,
  copy,
  onClose,
}: EditableTextProps & { copy: EditableTextMessages; onClose: () => void }) => {
  const [draft, setDraft] = useState(value);
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const save = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  return (
    <div
      className="grid gap-3"
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Escape" && !pending) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <Label htmlFor={id}>{label}</Label>
      <Input
        ref={input}
        id={id}
        value={draft}
        maxLength={maxLength}
        disabled={disabled || pending}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            save.current?.click();
          }
        }}
      />
      <div className="grid grid-cols-[auto_1fr] items-start gap-2 [&_[data-slot=async-action-feedback]]:col-span-full [&_[data-slot=async-action-feedback]]:row-start-2 [&>[data-slot=async-action-button]]:contents">
        <AsyncActionButton
          ref={save}
          disabled={disabled || draft === value}
          locale={locale}
          messages={{
            [locale ?? "en"]: {
              pending: copy.pending,
              retry: copy.save,
              error: copy.error,
            },
          }}
          onPendingChange={setPending}
          onAction={async () => {
            await onSave(draft);
            onClose();
          }}
        >
          {copy.save}
        </AsyncActionButton>
        <Button
          className="justify-self-start"
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onClose}
        >
          {copy.cancel}
        </Button>
      </div>
    </div>
  );
};
