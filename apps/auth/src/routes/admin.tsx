import { Link, Navigate, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

function Admin() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const session = authClient.useSession();
  const user = session.data?.user;
  const role = (user as Record<string, unknown> | undefined)?.role;
  const isAdmin =
    typeof role === "string" && role.split(",").some((item) => item.trim() === "admin");

  if (session.isPending) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" data-icon="inline-start" />
          Checking admin access...
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return <AdminAccessDenied isSignedIn={!!user} />;
  }

  if (pathname === "/admin") {
    return <Navigate replace to="/admin/oauth/clients" />;
  }

  return <Outlet />;
}

function AdminAccessDenied({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <ShieldAlert />
          </div>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>
            {isSignedIn
              ? "Your account does not have permission to open the admin area."
              : "Sign in with an admin account before opening the admin area."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you believe this is a mistake, ask an existing admin to add the admin role to your
            account.
          </p>
        </CardContent>
        {!isSignedIn ? (
          <CardFooter>
            <Button render={<Link to="/sign-in" />}>Sign in</Button>
          </CardFooter>
        ) : null}
      </Card>
    </main>
  );
}
