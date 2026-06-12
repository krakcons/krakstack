import { useNavigate } from "@tanstack/react-router";

import { UserButton } from "@/components/ui/user-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/paraglide/runtime";
import { centralLoginUrl } from "@/services/auth/client/central";

const callbackUrl = (path: string) =>
  new URL(path, import.meta.env.VITE_SITE_URL).toString();

export function UserButtonPreview() {
  const navigate = useNavigate();

  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>User Menu</CardTitle>
        <CardDescription>
          This preview uses the central Krakstack Auth client.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-12">
        <UserButton
          apiKeyPermissions={{ projects: ["read"] }}
          signOutRedirect="/docs/registry/user-button"
          renderUnauthenticated={() => (
            <Button
              onClick={() =>
                navigate({
                  href: centralLoginUrl(
                    callbackUrl("/docs/registry/user-button"),
                    getLocale(),
                  ),
                })
              }
            >
              Sign In
            </Button>
          )}
        />
      </CardContent>
    </Card>
  );
}
