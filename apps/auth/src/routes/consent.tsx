import { createFileRoute } from "@tanstack/react-router";

import { m } from "@/paraglide/messages";
import { authClient } from "@/lib/auth-client";
import { useAppForm } from "@/components/form/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/consent")({
  validateSearch: (search: Record<string, unknown>) => ({
    clientId:
      typeof search.client_id === "string" ? search.client_id : m.consent_connected_application(),
    scope: typeof search.scope === "string" ? search.scope : "openid profile email",
  }),
  component: Consent,
});

function Consent() {
  const { clientId, scope } = Route.useSearch();
  const scopes = scope.split(" ").filter(Boolean);
  const form = useAppForm({
    defaultValues: {},
    onSubmitMeta: { accept: true },
    onSubmit: async ({ meta, formApi }) => {
      formApi.setErrorMap({});

      const result = await authClient.oauth2.consent({
        accept: meta.accept,
        scope,
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: { form: result.error.message ?? m.consent_error(), fields: {} },
        });
        return;
      }

      window.location.assign(result.data?.url ?? "/");
    },
  });

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-3xl">{m.consent_title()}</CardTitle>
          <CardDescription>{m.consent_description({ clientId })}</CardDescription>
        </CardHeader>
        <form.AppForm>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4">
              <p className="text-sm font-medium">{m.consent_requested_scopes()}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {scopes.map((item) => (
                  <span className="rounded-md border px-3 py-1 text-sm" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <form.Subscribe
              selector={(formState) =>
                (formState.errorMap.onSubmit as { form?: unknown } | undefined)?.form
              }
            >
              {(error) =>
                error ? <p className="text-sm text-destructive">{String(error)}</p> : null
              }
            </form.Subscribe>
          </CardContent>
          <CardFooter className="gap-3">
            <form.Subscribe selector={(formState) => formState.isSubmitting}>
              {(isSubmitting) => (
                <>
                  <Button
                    disabled={isSubmitting}
                    onClick={() => form.handleSubmit({ accept: true })}
                    type="button"
                  >
                    {m.consent_authorize()}
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    onClick={() => form.handleSubmit({ accept: false })}
                    type="button"
                    variant="outline"
                  >
                    {m.consent_deny()}
                  </Button>
                </>
              )}
            </form.Subscribe>
          </CardFooter>
        </form.AppForm>
      </Card>
    </main>
  );
}
