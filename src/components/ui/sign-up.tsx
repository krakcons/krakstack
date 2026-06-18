import { Link, useNavigate } from "@tanstack/react-router";

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
    signIn: "Sign in",
    title: "Create account",
    description: "Create an account for this site.",
    error: "Unable to create account.",
    haveAccount: "Already have an account?",
    name: "Name",
    email: "Email",
    password: "Password",
  },
  fr: {
    signIn: "Se connecter",
    title: "Créer un compte",
    description: "Créez un compte pour ce site.",
    error: "Impossible de créer le compte.",
    haveAccount: "Vous avez déjà un compte ?",
    name: "Nom",
    email: "E-mail",
    password: "Mot de passe",
  },
} as const;

export type SignUpMessages = Partial<
  Record<
    | "signIn"
    | "title"
    | "description"
    | "error"
    | "haveAccount"
    | "name"
    | "email"
    | "password",
    string
  >
>;

const signUpMessages = (overrides?: SignUpMessages) => ({
  ...(getLocale().startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

export function SignUp({ messages }: { messages?: SignUpMessages }) {
  const labels = signUpMessages(messages);
  const navigate = useNavigate();
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
          onSubmit: {
            form: result.error.message ?? labels.error,
            fields: {},
          },
        });
        return;
      }

      navigate({ to: "/" });
    },
  });

  return (
    <Card className="w-full max-w-md">
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
            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  label={labels.name}
                  autoComplete="name"
                  required
                />
              )}
            </form.AppField>
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
                  autoComplete="new-password"
                  minLength={8}
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
          {labels.haveAccount}{" "}
          <Link
            className="text-foreground font-medium underline-offset-4 hover:underline"
            to="/sign-in"
          >
            {labels.signIn}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
