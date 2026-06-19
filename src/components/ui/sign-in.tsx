import { Link, useNavigate } from "@tanstack/react-router";
import { Blocks } from "lucide-react";

import { AppBrand } from "@/components/ui/app-brand";
import { ErrorMessage, useAppForm } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/services/auth/client";
import { getLocale } from "@/paraglide/runtime";

const messages = {
  en: {
    title: "Sign in",
    signUp: "Sign up",
    description: "Use your Krakstack Site account.",
    error: "Unable to sign in.",
    needAccount: "Need an account?",
    email: "Email",
    password: "Password",
    brandLabel: "Krakstack",
    brandSubtitle: "Site",
  },
  fr: {
    title: "Se connecter",
    signUp: "S'inscrire",
    description: "Utilisez votre compte Krakstack Site.",
    error: "Impossible de se connecter.",
    needAccount: "Besoin d'un compte ?",
    email: "E-mail",
    password: "Mot de passe",
    brandLabel: "Krakstack",
    brandSubtitle: "Site",
  },
} as const;

export type SignInMessages = Partial<
  Record<
    | "title"
    | "signUp"
    | "description"
    | "error"
    | "needAccount"
    | "email"
    | "password"
    | "brandLabel"
    | "brandSubtitle",
    string
  >
>;

const signInMessages = (overrides?: SignInMessages) => ({
  ...(getLocale().startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

export function SignIn({ messages }: { messages?: SignInMessages }) {
  const labels = signInMessages(messages);
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
            form: result.error.message ?? labels.error,
            fields: {},
          },
        });
        return;
      }

      navigate({ href: result.data?.url ?? "/" });
    },
  });

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <AppBrand
        label={labels.brandLabel}
        subtitle={labels.brandSubtitle}
        icon={Blocks}
        to="/"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{labels.title}</CardTitle>
          <CardDescription>{labels.description}</CardDescription>
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
                    label={labels.email}
                    type="email"
                    autoComplete="email"
                    required
                  />
                )}
              </form.AppField>
              <form.AppField name="password">
                {(field) => (
                  <field.TextField
                    label={labels.password}
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                )}
              </form.AppField>
              <form.Subscribe
                selector={(formState) =>
                  (
                    formState.errorMap.onSubmit as
                      | { form?: unknown }
                      | undefined
                  )?.form
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
            {labels.needAccount}{" "}
            <Link
              className="text-foreground font-medium underline-offset-4 hover:underline"
              to="/sign-up"
            >
              {labels.signUp}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
