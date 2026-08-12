import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FilePicker } from "@/components/ui/file-picker";
import { m } from "@/paraglide/messages";

export const FilePickerPreview = () => {
  const [document, setDocument] = useState<File>();
  const [image, setImage] = useState<File>();
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-[var(--surface-strong)]">
        <CardHeader>
          <CardTitle>{m.file_picker_preview_document_title()}</CardTitle>
          <CardDescription>
            {m.file_picker_preview_document_description()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilePicker
            accept=".pdf,.txt"
            canClear={Boolean(document)}
            {...(document ? { file: document } : {})}
            id="file-picker-document"
            name="document"
            onChange={setDocument}
            onClear={() => setDocument(undefined)}
            title={document?.name ?? m.file_picker_preview_document_title()}
          />
        </CardContent>
      </Card>

      <Card className="bg-[var(--surface-strong)]">
        <CardHeader>
          <CardTitle>{m.file_picker_preview_image_title()}</CardTitle>
          <CardDescription>
            {m.file_picker_preview_image_description()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilePicker
            accept="image/*"
            canClear={Boolean(image)}
            {...(image ? { file: image } : {})}
            id="file-picker-image"
            image={{
              alt: m.file_picker_preview_selected_image_alt(),
              height: 180,
              width: 320,
            }}
            name="image"
            onChange={setImage}
            onClear={() => setImage(undefined)}
            title={image?.name ?? m.file_picker_preview_image_title()}
          />
        </CardContent>
      </Card>

      <Card className="bg-[var(--surface-strong)] lg:col-span-2">
        <CardHeader>
          <CardTitle>{m.file_picker_preview_multiple_title()}</CardTitle>
          <CardDescription>
            {m.file_picker_preview_multiple_description()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilePicker
            accept=".pdf,.txt,.doc,.docx"
            canClear={files.length > 0}
            files={files}
            id="file-picker-multiple"
            multiple
            name="files"
            onClear={() => setFiles([])}
            onFilesChange={setFiles}
            title={m.file_picker_preview_multiple_title()}
          />
        </CardContent>
      </Card>
    </div>
  );
};
