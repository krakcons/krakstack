"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { CloudUpload, FileIcon, FileUp, RefreshCw, Trash2 } from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLocale } from "@/paraglide/runtime";

export type FilePickerMessages = {
  accepts: (accepts: string) => string;
  chooseFile: string;
  deleteFile: string;
  dropFile: string;
  replaceFile: string;
};

export type FilePickerMessageOverrides = Partial<FilePickerMessages>;

const messages = {
  en: {
    accepts: (accepts: string) => `Accepts: ${accepts}`,
    chooseFile: "Choose file",
    deleteFile: "Delete",
    dropFile: "Drag and drop a file here",
    replaceFile: "Replace file",
  },
  fr: {
    accepts: (accepts: string) => `Accepte : ${accepts}`,
    chooseFile: "Choisir un fichier",
    deleteFile: "Supprimer",
    dropFile: "Glissez-déposez un fichier ici",
    replaceFile: "Remplacer le fichier",
  },
} as const satisfies Record<"en" | "fr", FilePickerMessages>;

const filePickerMessages = (
  overrides?: FilePickerMessageOverrides,
): FilePickerMessages => ({
  ...(getLocale().startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

const formatBytes = (bytes: number) => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1,
  );
  if (index === 0) return `${bytes} ${sizes[index]}`;
  return `${(bytes / 1024 ** index).toFixed(1)} ${sizes[index]}`;
};

const fileDescription = (file: File) =>
  [
    file.type || file.name.split(".").pop()?.toUpperCase(),
    formatBytes(file.size),
  ]
    .filter(Boolean)
    .join(" · ");

export type FilePickerProps = {
  accept?: string;
  canClear?: boolean;
  file?: File;
  id: string;
  image?: {
    alt: string;
    height: number;
    src?: string;
    width: number;
  };
  invalid?: boolean;
  messages?: FilePickerMessageOverrides;
  name: string;
  onBlur?: () => void;
  onChange: (file: File) => void;
  onClear: () => void;
  required?: boolean;
  title: ReactNode;
};

export const FilePicker = ({
  accept = "",
  canClear = false,
  file,
  id,
  image,
  invalid = false,
  messages,
  name,
  onBlur,
  onChange,
  onClear,
  required,
  title,
}: FilePickerProps) => {
  const labels = filePickerMessages(messages);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const imageEnabled = image !== undefined;
  const objectUrl = useMemo(
    () => (file && imageEnabled ? URL.createObjectURL(file) : undefined),
    [file, imageEnabled],
  );

  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl],
  );

  const imageUrl = objectUrl ?? image?.src;
  const selected = Boolean(file || imageUrl);

  const selectFile = (nextFile?: File) => {
    if (nextFile) onChange(nextFile);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragging(false);
    if (inputRef.current) inputRef.current.files = event.dataTransfer.files;
    selectFile(event.dataTransfer.files[0]);
    onBlur?.();
  };

  const clear = () => {
    onClear();
    if (inputRef.current) inputRef.current.value = "";
  };

  const input = (
    <Input
      ref={inputRef}
      className="sr-only"
      id={id}
      name={name}
      type="file"
      accept={accept}
      required={required}
      onBlur={onBlur}
      onChange={(event) => selectFile(event.target.files?.[0])}
      aria-invalid={invalid}
    />
  );

  if (!selected) {
    return (
      <div
        className="bg-muted/30 data-[dragging=true]:bg-muted flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center transition-colors"
        data-dragging={dragging}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepthRef.current += 1;
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepthRef.current -= 1;
          if (dragDepthRef.current <= 0) {
            dragDepthRef.current = 0;
            setDragging(false);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <CloudUpload className="text-muted-foreground size-6" />
        <div>
          <p className="text-sm font-medium">{labels.dropFile}</p>
          <p className="text-muted-foreground text-xs">
            {labels.accepts(accept)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <FileUp data-icon="inline-start" />
          {labels.chooseFile}
        </Button>
        {input}
      </div>
    );
  }

  return (
    <>
      <Attachment
        className={image ? "w-fit max-w-full" : "w-full"}
        orientation={image ? "vertical" : "horizontal"}
        state={invalid ? "error" : "done"}
      >
        <AttachmentMedia
          variant={image ? "image" : "icon"}
          className={
            image
              ? "aspect-auto w-full max-w-full [&_img]:aspect-auto! [&_img]:object-contain!"
              : undefined
          }
        >
          {image && imageUrl ? (
            <img
              src={imageUrl}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="h-auto max-w-full object-contain"
              style={{ maxHeight: image.height }}
            />
          ) : (
            <FileIcon />
          )}
        </AttachmentMedia>
        <AttachmentContent className={image ? "w-full" : undefined}>
          <AttachmentTitle>{title}</AttachmentTitle>
          {file ? (
            <AttachmentDescription>
              {fileDescription(file)}
            </AttachmentDescription>
          ) : null}
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction
            type="button"
            aria-label={labels.replaceFile}
            onClick={() => inputRef.current?.click()}
          >
            <RefreshCw />
          </AttachmentAction>
          {canClear ? (
            <AttachmentAction
              type="button"
              aria-label={`${labels.deleteFile} ${typeof title === "string" ? title : ""}`}
              onClick={clear}
            >
              <Trash2 />
            </AttachmentAction>
          ) : null}
        </AttachmentActions>
      </Attachment>
      {input}
    </>
  );
};
