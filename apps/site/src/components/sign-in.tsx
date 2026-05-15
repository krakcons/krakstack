import { Link, useNavigate } from "@tanstack/react-router";

import { ErrorMessage, useAppForm } from "@/components/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/services/auth/client";
import { m } from "@/paraglide/messages";

export function SignIn() {
  const navigate = useNavigate();
  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({});

      const result = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.sign_in_error(),
            fields: {},
          },
        });
        return;
      }

      navigate({ href: result.data?.url ?? "/" });
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl">{m.auth_sign_in()}</CardTitle>
        <CardDescription>{m.sign_in_description()}</CardDescription>
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
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  label={m.field_password()}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              )}
            </form.AppField>
            <form.Subscribe
              selector={(formState) =>
                (formState.errorMap.onSubmit as { form?: unknown } | undefined)
                  ?.form
              }
            >
              {(error) =>
                error ? <ErrorMessage text={String(error)} /> : null
              }
            </form.Subscribe>
            <form.SubmitButton />
          </form>
        </form.AppForm>
        <p className="text-muted-foreground mt-6 text-center text-sm">
          {m.sign_in_need_account()}{" "}
          <Link
            className="text-foreground font-medium underline-offset-4 hover:underline"
            to="/sign-up"
          >
            {m.auth_sign_up()}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
