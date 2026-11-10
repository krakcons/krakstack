import { Upload } from "lucide-react";
import { useRef, type ComponentProps, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type BulkListResult = { items: string[]; duplicates: number };

/** Text tokenization, not CSV parsing or domain validation. */
export const parseBulkList = (
  text: string,
  options: { separator?: RegExp; normalize?: (value: string) => string } = {},
): BulkListResult => {
  const values = text
    .split(options.separator ?? /[,\r\n]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const items = values.filter((value) => {
    const key = options.normalize?.(value) ?? value;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { items, duplicates: values.length - items.length };
};

export type BulkListInputProps = Omit<
  ComponentProps<typeof Textarea>,
  "value" | "defaultValue" | "onChange" | "children"
> & {
  value: string;
  onValueChange: (value: string) => void;
  label?: ReactNode;
  files?: {
    accept: string;
    label: string;
    multiple?: boolean;
    disabled?: boolean;
    onSelect: (files: readonly File[]) => void;
  };
};

export const BulkListInput = ({
  value,
  onValueChange,
  label,
  files,
  disabled,
  readOnly,
  ...props
}: BulkListInputProps) => {
  const input = useRef<HTMLInputElement>(null);
  const filesDisabled = disabled || readOnly || files?.disabled;
  return (
    <div
      className="flex min-w-0 flex-col gap-3"
      onDragOver={(event) => {
        if (files && event.dataTransfer.types.includes("Files"))
          event.preventDefault();
      }}
      onDrop={(event) => {
        if (!files || !event.dataTransfer.files.length) return;
        event.preventDefault();
        if (!filesDisabled)
          files.onSelect(Array.from(event.dataTransfer.files));
      }}
    >
      {label || files ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {label}
          {files ? (
            <>
              <input
                ref={input}
                type="file"
                className="hidden"
                accept={files.accept}
                multiple={files.multiple}
                disabled={filesDisabled}
                onChange={(event) => {
                  const selected = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  if (selected.length && !filesDisabled)
                    files.onSelect(selected);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filesDisabled}
                onClick={() => input.current?.click()}
              >
                <Upload aria-hidden="true" />
                {files.label}
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
      <Textarea
        {...props}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </div>
  );
};
