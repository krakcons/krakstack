import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
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
  component: Consent,
});

function Consent() {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<"accept" | "deny" | null>(null);
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const clientId = params.get("client_id") ?? "connected application";
  const scope = params.get("scope") ?? "openid profile email";
  const scopes = scope.split(" ").filter(Boolean);

  const submitConsent = async (accept: boolean) => {
    setError(null);
    setPending(accept ? "accept" : "deny");

    const result = await authClient.oauth2.consent({
      accept,
      scope,
    });

    setPending(null);

    if (result.error) {
      setError(result.error.message ?? "Unable to complete consent.");
      return;
    }

    window.location.assign(result.data?.url ?? "/");
  };

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Authorize application</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">{clientId}</span> is requesting access to
            your Krakstack account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">Requested scopes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {scopes.map((item) => (
                <span
                  className="rounded-md border px-3 py-1 text-sm"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
        <CardFooter className="gap-3">
          <Button disabled={pending !== null} onClick={() => submitConsent(true)} type="button">
            {pending === "accept" ? "Authorizing..." : "Authorize"}
          </Button>
          <Button
            disabled={pending !== null}
            onClick={() => submitConsent(false)}
            type="button"
            variant="outline"
          >
            {pending === "deny" ? "Denying..." : "Deny"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
