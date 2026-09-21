import { ErrorComponent } from "@krak-stack/registry/error-component";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { m } from "@/paraglide/messages";

export const ErrorComponentPreview = () => (
  <Card>
    <CardHeader>
      <CardTitle>{m.error_preview_title()}</CardTitle>
      <CardDescription>{m.error_preview_description()}</CardDescription>
    </CardHeader>
    <CardContent>
      <ErrorComponent
        error={new Error(m.error_preview_message())}
        reset={() => {}}
        className="min-h-0"
        diagnostics={{ app: "KrakStack", reference: "preview-error" }}
      />
    </CardContent>
  </Card>
);
