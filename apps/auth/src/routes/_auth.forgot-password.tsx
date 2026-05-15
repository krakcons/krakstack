import { Link, createFileRoute } from "@tanstack/react-router";

import { useAppForm } from "@/components/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { m } from "@/paraglide/messages";
import { authClient } from "@/services/auth/client";

export const Route = createFileRoute("/_auth/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const form = useAppForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });

      const result = await authClient.requestPasswordReset({
        email: value.email.trim(),
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.forgot_password_error(),
            fields: {},
          },
        });
        return;
      }

      formApi.setErrorMap({
        onSubmit: {
          form: m.forgot_password_success(),
          fields: {},
        },
      });
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl">{m.forgot_password_title()}</CardTitle>
        <CardDescription>{m.forgot_password_description()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  label={m.field_email()}
                  type="email"
                  autoComplete="email"
                  required
                />
              )}
            </form.AppField>
            <form.FormError />
            <form.SubmitButton />
          </form>
        </form.AppForm>
        <p className="text-muted-foreground mt-6 text-center text-sm">
          <Link
            className="text-foreground font-medium underline-offset-4 hover:underline"
            to="/sign-in"
          >
            {m.forgot_password_back_to_sign_in()}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
