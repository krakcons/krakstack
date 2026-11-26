import { Effect, FileSystem, Result, Schema } from "effect";
import { Multipart } from "effect/http";
import { HttpApiSchema } from "effect/http-api";
import { CheckIcon, ImageIcon, Paperclip, XIcon } from "lucide-react";
import {
  type ClipboardEvent,
  type ReactElement,
  useId,
  useRef,
  useState,
  type FormEvent,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldLabel as BaseFieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { Textarea } from "@/components/ui/textarea";

const supportMessageLimit = 5000;
const supportReplyEmailLimit = 254;
const supportErrorDetailsLimit = 8000;
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

const SupportErrorDetails = Schema.String.check(
  Schema.isNonEmpty(),
  Schema.isMaxLength(supportErrorDetailsLimit),
).annotate({ identifier: "SupportErrorDetails" });

export const SupportRequestSchema = Schema.Struct({
  message: SupportMessage,
  replyEmail: Schema.optionalKey(SupportReplyEmail),
  errorDetails: Schema.optionalKey(SupportErrorDetails),
  attachments: SupportScreenshots,
}).annotate({ identifier: "SupportRequest" });

export type SupportRequest = typeof SupportRequestSchema.Type;

type SupportFormPayload = {
  message: FormDataEntryValue | null;
  replyEmail?: FormDataEntryValue | null;
  errorDetails?: string;
  attachments: readonly File[];
};

export const SupportMultipartPayload = Schema.Struct({
  message: SupportMessage,
  replyEmail: Schema.optionalKey(SupportReplyEmail),
  errorDetails: Schema.optionalKey(SupportErrorDetails),
  attachments: Schema.optionalKey(
    Multipart.FilesSchema.check(Schema.isMaxLength(supportScreenshotLimit)),
  ),
})
  .annotate({ identifier: "SupportMultipartPayload" })
  .pipe(
    HttpApiSchema.asMultipart({
      maxParts: supportScreenshotLimit + 3,
      maxFieldSize: 32 * 1024,
      maxFileSize: supportScreenshotMaxBytes,
      maxTotalSize:
        supportScreenshotLimit * supportScreenshotMaxBytes + 1024 * 1024,
    }),
  );

export class InvalidSupportScreenshot extends Schema.TaggedError<
  InvalidSupportScreenshot,
  { readonly brand: unique symbol }
>()("InvalidSupportScreenshot", {}) {}

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

export type SupportFormMessages = {
  title: string;
  description?: string;
  placeholder?: string;
  replyEmail: string;
  replyEmailPlaceholder?: string;
  attach: string;
  invalidAttachments: string;
  removeAttachment: string;
  submit: string;
  pending: string;
  success: string;
  successDescription?: string;
  close: string;
  invalid: string;
  failed: string;
  includeErrorDetails?: string;
  optional?: string;
  directEmail?: string;
};

export type SupportFormProps = {
  locale?: string;
  messages?: Partial<Record<string, Partial<SupportFormMessages>>>;
  askForReplyEmail?: boolean;
  defaultReplyEmail?: string;
  supportEmail?: string;
  errorDetails?: string;
  onSubmit: (request: SupportRequest) => void | Promise<void>;
};

const labels = {
  en: {
    title: "Tell us how we can help",
    description:
      "Share any details that will help us answer your question or understand what went wrong.",
    placeholder: "I need help with…",
    replyEmail: "Reply email",
    replyEmailPlaceholder: "you@example.com",
    attach: "Attach screenshots",
    invalidAttachments:
      "Screenshots weren’t added. Choose up to 3 PNG, JPEG or WebP images, 5 MB each.",
    removeAttachment: "Remove screenshot",
    submit: "Send message",
    pending: "Sending…",
    success: "Message sent",
    successDescription: "We will get back to you as soon as possible.",
    close: "Close",
    invalid: "Check your message and reply email if requested.",
    failed: "Could not send your message. Try again.",
    includeErrorDetails: "Include error details",
    optional: "optional",
    directEmail: "Or email us directly at",
  },
  fr: {
    title: "Dites-nous comment nous pouvons vous aider",
    description:
      "Donnez-nous les détails qui nous aideront à répondre à votre question ou à comprendre le problème.",
    placeholder: "J’ai besoin d’aide pour…",
    replyEmail: "Adresse courriel pour la réponse",
    replyEmailPlaceholder: "vous@example.com",
    attach: "Joindre des captures d’écran",
    invalidAttachments:
      "Les captures d’écran n’ont pas été ajoutées. Choisissez jusqu’à 3 images PNG, JPEG ou WebP de 5 Mo chacune.",
    removeAttachment: "Retirer la capture d’écran",
    submit: "Envoyer le message",
    pending: "Envoi en cours…",
    success: "Message envoyé",
    successDescription: "Nous vous répondrons dès que possible.",
    close: "Fermer",
    invalid:
      "Vérifiez le message et, si elle est demandée, l’adresse courriel.",
    failed: "Impossible d’envoyer votre message. Réessayez.",
    includeErrorDetails: "Inclure les détails de l’erreur",
    optional: "facultatif",
    directEmail: "Ou écrivez-nous directement à",
  },
} satisfies Record<"en" | "fr", SupportFormMessages>;

const useSupportFormMessages = (
  localeOverride: SupportFormProps["locale"],
  messages: SupportFormProps["messages"],
) => {
  const locale = useKrakstackLocale(localeOverride);
  const language = locale.split("-")[0] ?? locale;
  return {
    ...(language === "fr" ? labels.fr : labels.en),
    ...messages?.[language],
    ...messages?.[locale],
  };
};

const FieldLabel = ({
  htmlFor,
  children,
  optional,
  optionalText,
}: {
  htmlFor: string;
  children: string;
  optional?: boolean;
  optionalText: string;
}) => (
  <BaseFieldLabel htmlFor={htmlFor}>
    {children}
    {optional && (
      <span className="text-muted-foreground font-normal">
        {" "}
        ({optionalText})
      </span>
    )}
  </BaseFieldLabel>
);

const SupportCheck = () => (
  <span className="bg-primary/10 text-primary mb-1 grid size-12 place-items-center rounded-full">
    <CheckIcon className="size-6" aria-hidden="true" />
  </span>
);

const SupportConfirmation = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <div
    role="status"
    className="bg-muted/40 flex flex-col items-center gap-3 rounded-xl border px-6 py-8 text-center"
  >
    <SupportCheck />
    <h2 className="text-xl font-semibold">{title}</h2>
    {description && (
      <p className="text-muted-foreground text-sm">{description}</p>
    )}
  </div>
);

export const SupportForm = ({
  locale,
  messages,
  askForReplyEmail,
  defaultReplyEmail,
  supportEmail,
  errorDetails,
  onSubmit,
}: SupportFormProps) => {
  const copy = useSupportFormMessages(locale, messages);
  const id = useId();
  const details = errorDetails?.trim().slice(0, supportErrorDetailsLimit);
  const directEmail =
    Schema.decodeUnknownOption(SupportReplyEmail)(supportEmail);
  const [attachments, setAttachments] = useState<readonly File[]>([]);
  const [invalidAttachments, setInvalidAttachments] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "idle" | "pending" | "invalid" | "failed" | "success"
  >("idle");
  const submitting = useRef(false);
  const pending = status === "pending";
  const addAttachments = (files: readonly File[]) => {
    if (submitting.current || !files.length) return;
    const result = Schema.decodeResult(SupportScreenshots)([
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
    const replyEmail = form.get("replyEmail");
    const payload: SupportFormPayload = {
      message: form.get("message"),
      attachments,
    };
    if (replyEmail || askForReplyEmail === true)
      payload.replyEmail = replyEmail;
    if (details && form.has("includeErrorDetails"))
      payload.errorDetails = details;
    const request = Schema.decodeUnknownResult(SupportRequestSchema)(payload);
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
    <div className="grid min-w-0 gap-4">
      {status === "success" ? (
        <SupportConfirmation
          title={copy.success}
          description={copy.successDescription}
        />
      ) : (
        <form className="grid gap-4" onSubmit={submit} aria-busy={pending}>
          <fieldset disabled={pending} className="grid min-w-0 gap-4">
            {askForReplyEmail !== false && (
              <div className="grid gap-2">
                <FieldLabel
                  htmlFor={`${id}-email`}
                  optional={askForReplyEmail !== true}
                  optionalText={copy.optional}
                >
                  {copy.replyEmail}
                </FieldLabel>
                <Input
                  id={`${id}-email`}
                  name="replyEmail"
                  type="email"
                  autoComplete="email"
                  placeholder={copy.replyEmailPlaceholder}
                  maxLength={supportReplyEmailLimit}
                  defaultValue={defaultReplyEmail}
                  required={askForReplyEmail === true}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Textarea
                id={`${id}-message`}
                aria-label={copy.title}
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
                  addAttachments(Array.from(event.currentTarget.files ?? []));
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
            {details && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${id}-include-error-details`}
                  name="includeErrorDetails"
                  defaultChecked
                  disabled={pending}
                />
                <BaseFieldLabel htmlFor={`${id}-include-error-details`}>
                  {copy.includeErrorDetails}
                </BaseFieldLabel>
              </div>
            )}
          </fieldset>
          {(status === "failed" || status === "invalid") && (
            <p role="alert" className="text-destructive text-sm">
              {status === "invalid" ? copy.invalid : copy.failed}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
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
      {status !== "success" && directEmail._tag === "Some" && (
        <p className="text-muted-foreground text-sm">
          {copy.directEmail}{" "}
          <a
            className="break-words underline underline-offset-4"
            href={`mailto:${encodeURIComponent(directEmail.value).replace(/%40/g, "@")}`}
          >
            {directEmail.value}
          </a>
        </p>
      )}
    </div>
  );
};

export const SupportPage = (props: SupportFormProps) => {
  const { title, description } = useSupportFormMessages(
    props.locale,
    props.messages,
  );
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="mx-auto grid w-full max-w-xl gap-8 self-start"
    >
      <header className="grid gap-3">
        <h1
          id={titleId}
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-base sm:text-lg">
            {description}
          </p>
        )}
      </header>
      <SupportForm {...props} />
    </section>
  );
};

export type SupportDialogMessages = SupportFormMessages;
export type SupportDialogProps = SupportFormProps & { trigger?: ReactElement };

export const SupportDialog = ({ trigger, ...props }: SupportDialogProps) => {
  const copy = useSupportFormMessages(props.locale, props.messages);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const submitting = useRef(false);
  const [draft, setDraft] = useState(0);
  const description = sent ? copy.successDescription : copy.description;

  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (submitting.current) {
          details.cancel();
          return;
        }
        if (next) {
          setSent(false);
          setDraft((version) => version + 1);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={trigger ?? <Button variant="outline">{copy.title}</Button>}
      />
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-4 overflow-auto text-base sm:max-w-lg"
      >
        <DialogHeader
          role={sent ? "status" : undefined}
          className={sent ? undefined : "pe-8"}
        >
          <DialogTitle className={sent ? "flex items-center gap-2" : undefined}>
            {sent ? copy.success : copy.title}
            {sent && (
              <CheckIcon className="text-primary size-4" aria-hidden="true" />
            )}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {sent ? (
          <DialogClose
            render={
              <Button
                variant="outline"
                className="justify-self-end"
                autoFocus
              />
            }
          >
            {copy.close}
          </DialogClose>
        ) : (
          <>
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
            <SupportForm
              key={draft}
              {...props}
              onSubmit={async (request) => {
                submitting.current = true;
                setPending(true);
                try {
                  await props.onSubmit(request);
                  setSent(true);
                } finally {
                  submitting.current = false;
                  setPending(false);
                }
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
