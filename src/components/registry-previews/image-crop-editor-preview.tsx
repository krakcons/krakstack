import { useEffect, useState } from "react";
import {
  ImageCropEditor,
  type ImageCropState,
} from "@/components/ui/image-crop-editor";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

const source = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#0f766e"/><circle cx="240" cy="220" r="160" fill="#fbbf24"/><path d="M0 600L450 160L800 600Z" fill="#a7f3d0"/><circle cx="630" cy="110" r="55" fill="#fef3c7"/></svg>')}`;

export const ImageCropEditorPreview = () => {
  const [value, setValue] = useState<ImageCropState>({
    x: 50,
    y: 50,
    zoom: 1,
    rotation: 0,
  });
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  return (
    <div className="grid gap-4">
      <ImageCropEditor
        src={source}
        label={m.new_components_crop()}
        locale={getLocale()}
        value={value}
        onValueChange={setValue}
        onExport={(blob) => setUrl(URL.createObjectURL(blob))}
      />
      {url && (
        <figure className="grid gap-2">
          <img
            src={url}
            alt={m.new_components_crop_result()}
            className="size-32 rounded-lg border"
          />
          <figcaption className="text-muted-foreground text-sm">
            {m.new_components_crop_result()}
          </figcaption>
        </figure>
      )}
    </div>
  );
};
