import { Link } from "@tanstack/react-router";

import { ErrorMessage, useAppForm } from "@/components/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { m } from "@/paraglide/messages";

export function SignUp() {
  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({});

      const result = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: { form: result.error.message ?? m.sign_up_error(), fields: {} },
        });
        return;
      }

      window.location.assign("/");
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl">{m.sign_up_title()}</CardTitle>
        <CardDescription>{m.sign_up_description()}</CardDescription>
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
            <form.AppField name="name">
              {(field) => <field.TextField label={m.field_name()} autoComplete="name" required />}
            </form.AppField>
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
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  label={m.field_password()}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              )}
            </form.AppField>
            <form.Subscribe
              selector={(formState) =>
                (formState.errorMap.onSubmit as { form?: unknown } | undefined)?.form
              }
            >
              {(error) => (error ? <ErrorMessage text={String(error)} /> : null)}
            </form.Subscribe>
            <form.SubmitButton />
          </form>
        </form.AppForm>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {m.sign_up_have_account()}{" "}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/sign-in">
            {m.auth_sign_in()}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
