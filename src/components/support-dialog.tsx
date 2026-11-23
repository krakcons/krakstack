import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Effect, FileSystem, Result, Schema } from "effect";
import { Multipart } from "effect/http";
import { HttpApiSchema } from "effect/http-api";
import { ImageIcon, Paperclip, XIcon } from "lucide-react";
import {
  type ClipboardEvent,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const supportMessageLimit = 5000;
const supportReplyEmailLimit = 254;
const supportScreenshotLimit = 3;
const supportScreenshotMaxBytes = 5 * 1024 * 1024;
const screenshotFormats = new Map<
  string,
  {
    extension: string;
    signatures: readonly (readonly [number, readonly number[]])[];
  }
>([
  [
    "image/png",
    { extension: "png", signatures: [[0, [137, 80, 78, 71, 13, 10, 26, 10]]] },
  ],
  ["image/jpeg", { extension: "jpg", signatures: [[0, [255, 216, 255]]] }],
  [
    "image/webp",
    {
      extension: "webp",
      signatures: [
        [0, [82, 73, 70, 70]],
        [8, [87, 69, 66, 80]],
      ],
    },
  ],
]);
const screenshotAccept = Array.from(screenshotFormats.keys()).join(",");

const SupportMessage = Schema.Trim.check(
  Schema.isNonEmpty(),
  Schema.isMaxLength(supportMessageLimit),
).annotate({ identifier: "SupportMessage" });

export const SupportReplyEmail = Schema.Trim.check(
  Schema.isMaxLength(supportReplyEmailLimit),
  Schema.isPattern(/^[^\s@,<>]+@[^\s@,<>]+$/),
).annotate({ identifier: "SupportReplyEmail" });

const SupportScreenshots = Schema.Array(
  Schema.File.check(
    Schema.makeFilter(
      (file) =>
        screenshotFormats.has(file.type) &&
        file.size > 0 &&
        file.size <= supportScreenshotMaxBytes,
    ),
  ),
)
  .check(Schema.isMaxLength(supportScreenshotLimit))
  .annotate({ identifier: "SupportScreenshots" });

export const SupportRequestSchema = Schema.Struct({
  message: SupportMessage,
  replyEmail: Schema.optionalKey(SupportReplyEmail),
  attachments: SupportScreenshots,
}).annotate({ identifier: "SupportRequest" });

export type SupportRequest = typeof SupportRequestSchema.Type;

export const SupportMultipartPayload = Schema.Struct({
  message: SupportMessage,
  replyEmail: Schema.optionalKey(SupportReplyEmail),
  attachments: Schema.optionalKey(
    Multipart.FilesSchema.check(Schema.isMaxLength(supportScreenshotLimit)),
  ),
})
  .annotate({ identifier: "SupportMultipartPayload" })
  .pipe(
    HttpApiSchema.asMultipart({
      maxParts: supportScreenshotLimit + 2,
      maxFieldSize: 32 * 1024,
      maxFileSize: supportScreenshotMaxBytes,
      maxTotalSize:
        supportScreenshotLimit * supportScreenshotMaxBytes + 1024 * 1024,
    }),
  );

export class InvalidSupportScreenshot extends Schema.TaggedError<InvalidSupportScreenshot>()(
  "InvalidSupportScreenshot",
  {},
) {}

/** Read bounded temporary files from SupportMultipartPayload and check their signatures. */
export const readSupportScreenshots = Effect.fn("Support.readScreenshots")(
  function* (files: readonly Multipart.PersistedFile[]) {
    const fs = yield* FileSystem.FileSystem;
    return yield* Effect.forEach(files, (file, index) =>
      Effect.gen(function* () {
        const format = screenshotFormats.get(file.contentType);
        if (!format) return yield* new InvalidSupportScreenshot();
        const content = yield* fs.readFile(file.path);
        if (
          !format.signatures.every(([offset, signature]) =>
            signature.every((byte, index) => content[offset + index] === byte),
          )
        ) {
          return yield* new InvalidSupportScreenshot();
        }
        return {
          content,
          contentType: file.contentType,
          filename: `screenshot-${index + 1}.${format.extension}`,
        };
      }),
    );
  },
);

export type SupportDialogMessages = {
  title: string;
  description?: string;
  placeholder?: string;
  replyEmail: string;
  attach: string;
  invalidAttachments: string;
  removeAttachment: string;
  submit: string;
  pending: string;
  success: string;
  close: string;
  invalid: string;
  failed: string;
};

export type SupportDialogProps = {
  locale?: string;
  messages?: Partial<Record<string, Partial<SupportDialogMessages>>>;
  trigger?: ReactElement;
  askForReplyEmail?: boolean;
  onSubmit: (request: SupportRequest) => void | Promise<void>;
};

const labels = {
  en: {
    title: "Tell us how we can help",
    description:
      "Share any details that will help us answer your question or understand what went wrong.",
    placeholder: "I need help with…",
    replyEmail: "Reply email",
    attach: "Attach screenshots",
    invalidAttachments:
      "Screenshots weren’t added. Choose up to 3 PNG, JPEG or WebP images, 5 MB each.",
    removeAttachment: "Remove screenshot",
    submit: "Send message",
    pending: "Sending…",
    success: "Your message was sent.",
    close: "Close",
    invalid: "Check your message and reply email if requested.",
    failed: "Could not send your message. Try again.",
  },
  fr: {
    title: "Dites-nous comment nous pouvons vous aider",
    description:
      "Donnez-nous les détails qui nous aideront à répondre à votre question ou à comprendre le problème.",
    placeholder: "J’ai besoin d’aide pour…",
    replyEmail: "Adresse courriel pour la réponse",
    attach: "Joindre des captures d’écran",
    invalidAttachments:
      "Les captures d’écran n’ont pas été ajoutées. Choisissez jusqu’à 3 images PNG, JPEG ou WebP de 5 Mo chacune.",
    removeAttachment: "Retirer la capture d’écran",
    submit: "Envoyer le message",
    pending: "Envoi en cours…",
    success: "Votre message a été envoyé.",
    close: "Fermer",
    invalid:
      "Vérifiez le message et, si elle est demandée, l’adresse courriel.",
    failed: "Impossible d’envoyer votre message. Réessayez.",
  },
} satisfies Record<"en" | "fr", SupportDialogMessages>;

export const SupportDialog = ({
  locale: localeOverride,
  messages,
  trigger,
  askForReplyEmail = false,
  onSubmit,
}: SupportDialogProps) => {
  const locale = useKrakstackLocale(localeOverride);
  const language = locale.split("-")[0] ?? locale;
  const copy = {
    ...(language === "fr" ? labels.fr : labels.en),
    ...messages?.[language],
    ...messages?.[locale],
  };
  const id = useId();
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] = useState<readonly File[]>([]);
  const [invalidAttachments, setInvalidAttachments] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "idle" | "pending" | "invalid" | "failed" | "success"
  >("idle");
  const submitting = useRef(false);
  const pending = status === "pending";
  const handleOpenChange: NonNullable<
    DialogPrimitive.Root.Props["onOpenChange"]
  > = (next, details) => {
    if (submitting.current) {
      details.cancel();
      return;
    }
    if (next) {
      setAttachments([]);
      setInvalidAttachments(false);
      setStatus("idle");
    }
    setOpen(next);
  };

  const addAttachments = (files: readonly File[]) => {
    if (submitting.current || !files.length) return;
    const result = Schema.decodeUnknownResult(SupportScreenshots)([
      ...attachments,
      ...files,
    ]);
    setInvalidAttachments(Result.isFailure(result));
    if (Result.isSuccess(result)) setAttachments(result.success);
  };

  const pasteScreenshot = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!files.length) return;
    event.preventDefault();
    addAttachments(files);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    const request = Schema.decodeUnknownResult(SupportRequestSchema)({
      message: form.get("message"),
      ...(askForReplyEmail ? { replyEmail: form.get("replyEmail") } : {}),
      attachments,
    });
    if (Result.isFailure(request)) {
      setStatus("invalid");
      return;
    }

    submitting.current = true;
    setStatus("pending");
    try {
      await onSubmit(request.success);
      setAttachments([]);
      setInvalidAttachments(false);
      setStatus("success");
    } catch {
      setStatus("failed");
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={trigger ?? <Button variant="outline">{copy.title}</Button>}
      />
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup className="bg-popover text-popover-foreground ring-foreground/10 fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-xl p-6 ring-1 outline-none">
          <DialogHeader className={status === "success" ? undefined : "pe-8"}>
            <DialogTitle>
              <span id={`${id}-title`}>{copy.title}</span>
            </DialogTitle>
            {copy.description && (
              <DialogDescription>{copy.description}</DialogDescription>
            )}
          </DialogHeader>
          {status !== "success" && (
            <DialogClose
              render={
                <Button
                  className="absolute end-4 top-4"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={copy.close}
                  disabled={pending}
                />
              }
            >
              <XIcon aria-hidden="true" />
            </DialogClose>
          )}
          {status === "success" ? (
            <>
              <p role="status" className="text-sm">
                {copy.success}
              </p>
              <DialogFooter>
                <DialogClose render={<Button autoFocus />}>
                  {copy.close}
                </DialogClose>
              </DialogFooter>
            </>
          ) : (
            <form className="grid gap-4" onSubmit={submit} aria-busy={pending}>
              <fieldset disabled={pending} className="grid min-w-0 gap-4">
                {askForReplyEmail && (
                  <div className="grid gap-2">
                    <Label htmlFor={`${id}-email`}>{copy.replyEmail}</Label>
                    <Input
                      id={`${id}-email`}
                      name="replyEmail"
                      type="email"
                      autoComplete="email"
                      maxLength={supportReplyEmailLimit}
                      required
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Textarea
                    id={`${id}-message`}
                    aria-labelledby={`${id}-title`}
                    name="message"
                    rows={8}
                    className="min-h-44"
                    placeholder={copy.placeholder}
                    required
                    maxLength={supportMessageLimit}
                    onPaste={pasteScreenshot}
                  />
                  <input
                    ref={fileInput}
                    type="file"
                    aria-label={copy.attach}
                    accept={screenshotAccept}
                    multiple
                    hidden
                    onChange={(event) => {
                      addAttachments(
                        Array.from(event.currentTarget.files ?? []),
                      );
                      event.currentTarget.value = "";
                    }}
                  />
                  {attachments.length > 0 && (
                    <ul className="flex min-w-0 flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <li key={index} className="max-w-full min-w-0">
                          <Attachment size="xs" className="min-w-0 flex-nowrap">
                            <AttachmentContent className="flex items-center gap-1.5">
                              <AttachmentMedia className="shrink-0">
                                <ImageIcon aria-hidden="true" />
                              </AttachmentMedia>
                              <AttachmentTitle title={file.name}>
                                {file.name}
                              </AttachmentTitle>
                            </AttachmentContent>
                            <AttachmentActions className="pe-1">
                              <AttachmentAction
                                type="button"
                                aria-label={`${copy.removeAttachment}: ${file.name}`}
                                onClick={() => {
                                  setAttachments(
                                    attachments.filter(
                                      (_, position) => position !== index,
                                    ),
                                  );
                                  setInvalidAttachments(false);
                                }}
                              >
                                <XIcon aria-hidden="true" />
                              </AttachmentAction>
                            </AttachmentActions>
                          </Attachment>
                        </li>
                      ))}
                    </ul>
                  )}
                  {invalidAttachments && (
                    <p role="alert" className="text-destructive text-sm">
                      {copy.invalidAttachments}
                    </p>
                  )}
                </div>
              </fieldset>
              {(status === "failed" || status === "invalid") && (
                <p role="alert" className="text-destructive text-sm">
                  {status === "invalid" ? copy.invalid : copy.failed}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => fileInput.current?.click()}
                >
                  <Paperclip aria-hidden="true" />
                  {copy.attach}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="ms-auto"
                  disabled={pending}
                >
                  {pending ? copy.pending : copy.submit}
                </Button>
              </div>
            </form>
          )}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
};
