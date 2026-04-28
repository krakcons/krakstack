import { UserButton } from "@/components/user-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UserButtonPreview() {
  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>User Menu</CardTitle>
        <CardDescription>This preview uses the site-local Better Auth client.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-12">
        <UserButton signOutRedirect="/docs/registry/user-button" />
      </CardContent>
    </Card>
  );
}
