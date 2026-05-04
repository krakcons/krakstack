import { UserButton } from "@/components/user-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/services/auth/client";

export function UserButtonPreview() {
  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>User Menu</CardTitle>
        <CardDescription>This preview uses the site-local Better Auth client.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-12">
        <UserButton
          signOutRedirect="/docs/registry/user-button"
          renderUnauthenticated={() => (
            <Button
              onClick={async () => {
                const result = await authClient.signIn.oauth2({
                  providerId: "krakstack-auth",
                  callbackURL: "/docs/registry/user-button",
                });
                if (result.data?.url) {
                  window.location.assign(result.data.url);
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
