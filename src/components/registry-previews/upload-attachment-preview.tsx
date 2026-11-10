import { useState } from "react";
import {
  UploadAttachment,
  type UploadAttachmentState,
} from "@/components/ui/upload-attachment";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const UploadAttachmentPreview = () => {
  const [state, setState] = useState<UploadAttachmentState>({
    status: "uploading",
    progress: 42,
  });
  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <UploadAttachment
        locale={getLocale()}
        name="example-report.pdf"
        description="PDF · 240 KB"
        state={state}
        onCancel={() => setState({ status: "cancelled" })}
        onRetry={() => setState({ status: "uploading", progress: 0 })}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setState({ status: "uploading", progress: 42 })}
        >
          {m.new_components_upload_progress()}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setState({ status: "processing" })}
        >
          {m.new_components_upload_processing()}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setState({ status: "done" })}
        >
          {m.new_components_upload_done()}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setState({
              status: "error",
              message: m.new_components_upload_failure(),
            })
          }
        >
          {m.new_components_upload_error()}
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        {m.new_components_upload_help()}
      </p>
    </div>
  );
};
