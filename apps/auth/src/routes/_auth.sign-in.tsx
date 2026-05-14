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

export const Route = createFileRoute("/_auth/sign-in")({
  component: SignIn,
});

const hasTwoFactorRedirect = (data: unknown) => {
  if (
    typeof data !== "object" ||
    data === null ||
    !("twoFactorRedirect" in data)
  )
    return false;
  return data.twoFactorRedirect === true;
};

function SignIn() {
  const navigate = useNavigate();
  const finishSignIn = (url: string | null | undefined) => {
    if (
      url &&
      URL.canParse(url) &&
      new URL(url, window.location.origin).origin !== window.location.origin
    ) {
      window.location.assign(url);
    } else {
      navigate({ to: url ?? "/admin" });
    }
  };
  const setFormError = (message: string) => {
    form.setErrorMap({
      onSubmit: {
        form: message,
        fields: {},
      },
    });
  };

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });

      try {
        const result = await authClient.signIn.email({
          email: value.email.trim(),
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

        if (hasTwoFactorRedirect(result.data)) {
          navigate({ to: "/2fa" });
          return;
        }

        finishSignIn(result.data?.url);
      } catch {
        formApi.setErrorMap({
          onSubmit: {
            form: m.sign_in_error(),
            fields: {},
          },
        });
        return;
      }
    },
  });

  const signInWithGoogle = async () => {
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin",
        errorCallbackURL: "/sign-in",
      });

      if (result.error) {
        setFormError(result.error.message ?? m.sign_in_error());
        return;
      }

      if (result.data?.url) finishSignIn(result.data.url);
    } catch {
      setFormError(m.sign_in_error());
    }
  };

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
            onClick={signInWithGoogle}
          >
            {m.auth_continue_with_google()}
          </Button>
        </div>
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
