import { OrganizationSwitcher } from "@/components/organization-switcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/services/auth/client";

export function OrganizationSwitcherPreview() {
  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Organization Switcher</CardTitle>
        <CardDescription>
          This preview uses the central Krakstack Auth client for organization
          state.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-12">
        <OrganizationSwitcher
          renderUnauthenticated={() => (
            <Button
              onClick={async () => {
                const result = await authClient.signIn.oauth2({
                  providerId: "krakstack-auth",
                  callbackURL: "/docs/registry/organization-switcher",
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
