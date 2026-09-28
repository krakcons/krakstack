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
import { Schema } from "effect";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FilePickerMessages = {
  accepts: (accepts: string) => string;
  chooseFile: string;
  chooseFiles: string;
  deleteFile: string;
  dropFile: string;
  dropFiles: string;
  replaceFile: string;
};

export type FilePickerMessageOverrides = Partial<FilePickerMessages>;
export type FilePickerMessageTranslations = Partial<
  Record<string, FilePickerMessageOverrides>
>;

const messages = {
  en: {
    accepts: (accepts: string) => `Accepts: ${accepts}`,
    chooseFile: "Choose file",
    chooseFiles: "Choose files",
    deleteFile: "Delete",
    dropFile: "Drag and drop a file here",
    dropFiles: "Drag and drop files here",
    replaceFile: "Replace file",
  },
  fr: {
    accepts: (accepts: string) => `Accepte : ${accepts}`,
    chooseFile: "Choisir un fichier",
    chooseFiles: "Choisir des fichiers",
    deleteFile: "Supprimer",
    dropFile: "Glissez-déposez un fichier ici",
    dropFiles: "Glissez-déposez des fichiers ici",
    replaceFile: "Remplacer le fichier",
  },
} as const satisfies Record<"en" | "fr", FilePickerMessages>;

const filePickerMessages = (
  locale: string,
  translations?: FilePickerMessageTranslations,
): FilePickerMessages => ({
  ...(locale.startsWith("fr") ? messages.fr : messages.en),
  ...translations?.[locale.split("-")[0] ?? locale],
  ...translations?.[locale],
});

const formatBytes = (bytes: number, locale: string) => {
  const units = [
    "byte",
    "kilobyte",
    "megabyte",
    "gigabyte",
    "terabyte",
  ] as const;
  const index = Math.min(
    bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value =
    index === 0 ? bytes : Number((bytes / 1024 ** index).toFixed(1));
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: units[index],
    unitDisplay: "short",
  }).format(value);
};

const fileDescription = (file: File, locale: string) =>
  [
    file.type || file.name.split(".").pop()?.toUpperCase(),
    formatBytes(file.size, locale),
  ]
    .filter(Boolean)
    .join(" · ");

export type FilePickerProps = {
  accept?: string;
  canClear?: boolean;
  file?: File;
  files?: readonly File[];
  id: string;
  image?: {
    alt: string;
    height: number;
    src?: string;
    width: number;
  };
  invalid?: boolean;
  locale?: string;
  messages?: FilePickerMessageTranslations;
  multiple?: boolean;
  name: string;
  onBlur?: () => void;
  onChange?: (file: File) => void;
  onClear: () => void;
  onFilesChange?: (files: File[]) => void;
  required?: boolean;
  title: ReactNode;
};

export const FilePicker = ({
  accept = "",
  canClear = false,
  file,
  files = [],
  id,
  image,
  invalid = false,
  locale = "en",
  messages,
  multiple = false,
  name,
  onBlur,
  onChange,
  onClear,
  onFilesChange,
  required,
  title,
}: FilePickerProps) => {
  const labels = filePickerMessages(locale, messages);
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

  const selectFiles = (nextFiles: FileList | readonly File[]) => {
    const selectedFiles = Array.from(nextFiles);
    if (multiple) {
      const uniqueFiles = new Map(
        [...files, ...selectedFiles].map((selectedFile) => [
          `${selectedFile.name}:${selectedFile.size}:${selectedFile.lastModified}`,
          selectedFile,
        ]),
      );
      onFilesChange?.(Array.from(uniqueFiles.values()));
    } else if (selectedFiles[0]) {
      onChange?.(selectedFiles[0]);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragging(false);
    selectFiles(event.dataTransfer.files);
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
      multiple={multiple}
      required={required && (!multiple || files.length === 0)}
      onBlur={onBlur}
      onChange={(event) => {
        if (event.target.files) selectFiles(event.target.files);
        if (multiple) event.target.value = "";
      }}
      aria-invalid={invalid}
    />
  );

  if (multiple) {
    return (
      <div className="grid min-w-0 gap-3">
        <div
          className="bg-muted/30 data-[dragging=true]:bg-muted flex min-h-32 min-w-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center transition-colors"
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
          <div className="max-w-full min-w-0">
            <p className="text-sm font-medium">{labels.dropFiles}</p>
            <p className="text-muted-foreground max-w-full text-xs [overflow-wrap:anywhere]">
              {labels.accepts(accept)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            <FileUp data-icon="inline-start" />
            {labels.chooseFiles}
          </Button>
          {input}
        </div>
        {files.length > 0 ? (
          <AttachmentGroup>
            {files.map((selectedFile) => (
              <Attachment
                key={`${selectedFile.name}:${selectedFile.size}:${selectedFile.lastModified}`}
                state={invalid ? "error" : "idle"}
              >
                <AttachmentMedia>
                  <FileIcon />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{selectedFile.name}</AttachmentTitle>
                  <AttachmentDescription>
                    {fileDescription(selectedFile, locale)}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    type="button"
                    aria-label={`${labels.deleteFile} ${selectedFile.name}`}
                    onClick={() =>
                      onFilesChange?.(
                        files.filter((candidate) => candidate !== selectedFile),
                      )
                    }
                  >
                    <Trash2 />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}
          </AttachmentGroup>
        ) : null}
      </div>
    );
  }

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
              {fileDescription(file, locale)}
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
              aria-label={`${labels.deleteFile} ${Schema.is(Schema.String)(title) ? title : ""}`}
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
