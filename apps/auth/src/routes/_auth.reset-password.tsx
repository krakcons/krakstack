import { createFileRoute, useNavigate } from "@tanstack/react-router";

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

export const Route = createFileRoute("/_auth/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const form = useAppForm({
    defaultValues: {
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });

      if (!token) {
        formApi.setErrorMap({
          onSubmit: {
            form: m.reset_password_missing_token(),
            fields: {},
          },
        });
        return;
      }

      const result = await authClient.resetPassword({
        newPassword: value.password,
        token,
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.reset_password_error(),
            fields: {},
          },
        });
        return;
      }

      navigate({ to: "/sign-in" });
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl">{m.reset_password_title()}</CardTitle>
        <CardDescription>{m.reset_password_description()}</CardDescription>
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
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  label={m.reset_password_new_password()}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              )}
            </form.AppField>
            <form.FormError />
            <form.SubmitButton />
          </form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
