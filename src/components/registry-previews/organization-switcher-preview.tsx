import { useNavigate } from "@tanstack/react-router";

import { OrganizationSwitcher, type AuthUiClient } from "@krak-stack/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { m } from "@/paraglide/messages";
import { authClient, centralAuthBaseUrl } from "@/services/auth/client";

const authUiClient = authClient as unknown as AuthUiClient;

export function OrganizationSwitcherPreview() {
  const navigate = useNavigate();

  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Organization Switcher</CardTitle>
        <CardDescription>
          This preview uses the central Krakstack Auth client for organization
          state.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 py-12 sm:grid-cols-[minmax(0,18rem)_auto] sm:items-start sm:justify-center">
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm font-medium">
            {m.organization_switcher_preview_expanded()}
          </p>
          <OrganizationSwitcher
            authClient={authUiClient}
            baseUrl={centralAuthBaseUrl}
            className="max-w-xs"
            renderUnauthenticated={() => (
              <Button
                onClick={async () => {
                  const result = await authClient.signIn.oauth2({
                    providerId: "krakstack-auth",
                    callbackURL: "/docs/registry/organization-switcher",
                  });
                  if (result.data?.url) {
                    navigate({ href: result.data.url });
                  }
                }}
              >
                Sign In
              </Button>
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm font-medium">
            {m.organization_switcher_preview_collapsed()}
          </p>
          <div className="group w-8" data-collapsible="icon">
            <OrganizationSwitcher
              authClient={authUiClient}
              baseUrl={centralAuthBaseUrl}
              className="w-8"
              renderUnauthenticated={() => (
                <Button
                  size="icon"
                  onClick={async () => {
                    const result = await authClient.signIn.oauth2({
                      providerId: "krakstack-auth",
                      callbackURL: "/docs/registry/organization-switcher",
                    });
                    if (result.data?.url) {
                      navigate({ href: result.data.url });
                    }
                  }}
                >
                  <span className="sr-only">Sign In</span>
                </Button>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
