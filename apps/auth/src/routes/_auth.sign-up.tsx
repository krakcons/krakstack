import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { m } from "@/paraglide/messages";
import { authClient } from "@/services/auth/client";
import { useAppForm } from "@/components/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/sign-up")({
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const setFormError = (message: string) => {
    form.setErrorMap({
      onSubmit: {
        form: message,
        fields: {},
      },
    });
  };

  const signUpWithGoogle = async () => {
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin",
        errorCallbackURL: "/sign-up",
      });

      if (result.error) {
        setFormError(result.error.message ?? m.sign_up_error());
        return;
      }

      if (result.data?.url) navigate({ href: result.data.url });
    } catch {
      setFormError(m.sign_up_error());
    }
  };

  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });

      try {
        const result = await authClient.signUp.email({
          name: value.name.trim(),
          email: value.email.trim(),
          password: value.password,
        });

        if (result.error) {
          formApi.setErrorMap({
            onSubmit: {
              form: result.error.message ?? m.sign_up_error(),
              fields: {},
            },
          });
          return;
        }

        navigate({
          to: "/verify-email",
          search: { email: value.email.trim() },
        });
      } catch {
        formApi.setErrorMap({
          onSubmit: {
            form: m.sign_up_error(),
            fields: {},
          },
        });
        return;
      }
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
              {(field) => (
                <field.TextField
                  label={m.field_name()}
                  autoComplete="name"
                  required
                />
              )}
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
            <form.FormError />
            <form.SubmitButton />
          </form>
        </form.AppForm>
        <div className="mt-4 flex flex-col gap-3">
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span className="bg-border h-px flex-1" />
            {m.auth_or_continue_with()}
            <span className="bg-border h-px flex-1" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={signUpWithGoogle}
          >
            {m.auth_continue_with_google()}
          </Button>
        </div>
        <p className="text-muted-foreground mt-6 text-center text-sm">
          {m.sign_up_have_account()}{" "}
          <Link
            className="text-foreground font-medium underline-offset-4 hover:underline"
            to="/sign-in"
          >
            {m.auth_sign_in()}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
