import { Link, createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { ErrorMessage, useAppForm } from "@/components/form/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/sign-in")({
  component: SignIn,
});

function SignIn() {
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
          onSubmit: { form: result.error.message ?? "Unable to sign in.", fields: {} },
        });
        return;
      }

      window.location.assign(result.data?.url ?? "/");
    },
  });

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">Sign in</CardTitle>
          <CardDescription>Use your central Krakstack account.</CardDescription>
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
                  <field.TextField label="Email" type="email" autoComplete="email" required />
                )}
              </form.AppField>
              <form.AppField name="password">
                {(field) => (
                  <field.TextField
                    label="Password"
                    type="password"
                    autoComplete="current-password"
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
            Need an account?{" "}
            <Link
              className="font-medium text-foreground underline-offset-4 hover:underline"
              to="/sign-up"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
