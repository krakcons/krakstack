import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FilePicker } from "@/components/ui/file-picker";

export const FilePickerPreview = () => {
  const [document, setDocument] = useState<File>();
  const [image, setImage] = useState<File>();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-[var(--surface-strong)]">
        <CardHeader>
          <CardTitle>Document</CardTitle>
          <CardDescription>
            Drop a PDF or text file, or open the native file dialog.
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
            title={document?.name ?? "Document"}
          />
        </CardContent>
      </Card>

      <Card className="bg-[var(--surface-strong)]">
        <CardHeader>
          <CardTitle>Image</CardTitle>
          <CardDescription>
            Selected images use a managed local preview URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilePicker
            accept="image/*"
            canClear={Boolean(image)}
            {...(image ? { file: image } : {})}
            id="file-picker-image"
            image={{ alt: "Selected image", height: 180, width: 320 }}
            name="image"
            onChange={setImage}
            onClear={() => setImage(undefined)}
            title={image?.name ?? "Image"}
          />
        </CardContent>
      </Card>
    </div>
  );
};
