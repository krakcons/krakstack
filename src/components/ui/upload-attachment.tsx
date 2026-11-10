import {
  Check,
  File,
  LoaderCircle,
  RotateCcw,
  TriangleAlert,
  X,
} from "lucide-react";
import { useId } from "react";

import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";

export type UploadAttachmentState =
  | { status: "idle" }
  | { status: "uploading"; progress?: number }
  | { status: "processing" }
  | { status: "done" }
  | { status: "cancelled" }
  | { status: "error"; message: string };

export type UploadAttachmentMessages = {
  idle: string;
  uploading: string;
  processing: string;
  done: string;
  cancelled: string;
  cancel: string;
  retry: string;
  remove: string;
};

export type UploadAttachmentProps = {
  name: string;
  description?: string;
  state: UploadAttachmentState;
  disabled?: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
  onRemove?: () => void;
  className?: string;
  locale?: string;
  messages?: Partial<Record<string, Partial<UploadAttachmentMessages>>>;
};

const labels = {
  en: {
    idle: "Ready to upload",
    uploading: "Uploading",
    processing: "Processing",
    done: "Upload complete",
    cancelled: "Upload cancelled",
    cancel: "Cancel upload",
    retry: "Retry upload",
    remove: "Remove attachment",
  },
  fr: {
    idle: "Prêt à téléverser",
    uploading: "Téléversement",
    processing: "Traitement",
    done: "Téléversement terminé",
    cancelled: "Téléversement annulé",
    cancel: "Annuler le téléversement",
    retry: "Réessayer le téléversement",
    remove: "Retirer la pièce jointe",
  },
};

/** Controlled presentation. The host owns transport, cancellation and retry policy. */
export const UploadAttachment = ({
  name,
  description,
  state,
  disabled,
  onCancel,
  onRetry,
  onRemove,
  className,
  locale: override,
  messages,
}: UploadAttachmentProps) => {
  const locale = useKrakstackLocale(override);
  const id = useId();
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const busy = state.status === "uploading" || state.status === "processing";
  const progress =
    state.status === "uploading" &&
    state.progress !== undefined &&
    Number.isFinite(state.progress)
      ? Math.min(100, Math.max(0, state.progress))
      : undefined;
  const status = state.status === "error" ? state.message : copy[state.status];
  return (
    <Attachment
      state={state.status === "cancelled" ? "idle" : state.status}
      className={className}
      aria-labelledby={`${id}-name`}
    >
      <AttachmentMedia>
        {state.status === "done" ? (
          <Check aria-hidden="true" />
        ) : state.status === "error" ? (
          <TriangleAlert aria-hidden="true" />
        ) : busy ? (
          <LoaderCircle
            aria-hidden="true"
            className="motion-safe:animate-spin"
          />
        ) : (
          <File aria-hidden="true" />
        )}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle id={`${id}-name`}>{name}</AttachmentTitle>
        {description ? (
          <AttachmentDescription>{description}</AttachmentDescription>
        ) : null}
        <p
          role={state.status === "error" ? "alert" : "status"}
          className="text-muted-foreground mt-1 text-xs"
        >
          {status}
        </p>
        {state.status === "uploading" ? (
          <progress
            className="accent-primary mt-2 h-1.5 w-full"
            aria-label={`${copy.uploading}: ${name}`}
            max={100}
            value={progress}
          />
        ) : null}
      </AttachmentContent>
      <AttachmentActions>
        {busy && onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={`${copy.cancel}: ${name}`}
            onClick={onCancel}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
        {(state.status === "error" || state.status === "cancelled") &&
        onRetry ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={`${copy.retry}: ${name}`}
            onClick={onRetry}
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        ) : null}
        {!busy && onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={`${copy.remove}: ${name}`}
            onClick={onRemove}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </AttachmentActions>
    </Attachment>
  );
};
