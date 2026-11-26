import { ErrorComponent } from "@krak-stack/registry/error-component";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { m } from "@/paraglide/messages";
import { Button } from "@/components/ui/button";
import { SupportDialog } from "@/components/support";
import { getSupportPreviewProps } from "./support-dialog-preview";

export const ErrorComponentPreview = () => {
  const support = getSupportPreviewProps();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.error_preview_title()}</CardTitle>
        <CardDescription>{m.error_preview_description()}</CardDescription>
        <CardDescription>{m.support_preview_local_only()}</CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorComponent
          error={new Error(m.error_preview_message())}
          reset={() => {}}
          className="min-h-0"
          diagnostics={{ app: "KrakStack", reference: "preview-error" }}
          renderFeedback={(errorDetails) => (
            <SupportDialog
              {...support}
              errorDetails={errorDetails}
              trigger={
                <Button variant="outline">{m.support_feedback()}</Button>
              }
            />
          )}
        />
      </CardContent>
    </Card>
  );
};
