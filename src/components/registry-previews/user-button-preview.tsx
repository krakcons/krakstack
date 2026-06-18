import { useNavigate } from "@tanstack/react-router";

import { UserButton, type AuthUiClient } from "@krak-stack/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/services/auth/client";

const authUiClient = authClient as unknown as AuthUiClient;

export function UserButtonPreview() {
  const navigate = useNavigate();

  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>User Menu</CardTitle>
        <CardDescription>
          This preview uses the site-local Better Auth client.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-12">
        <UserButton
          authClient={authUiClient}
          apiKeyPermissions={{ projects: ["read"] }}
          signOutRedirect="/docs/registry/user-button"
          renderUnauthenticated={() => (
            <Button
              onClick={async () => {
                const result = await authClient.signIn.oauth2({
                  providerId: "krakstack-auth",
                  callbackURL: "/docs/registry/user-button",
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
      </CardContent>
    </Card>
  );
}
