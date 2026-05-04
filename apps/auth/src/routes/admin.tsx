import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { KeyRound, LayoutDashboard, Loader2, ShieldAlert, Users } from "lucide-react";

import { m } from "@/paraglide/messages";
import { Button } from "@/components/ui/button";
import { LocaleToggle } from "@/components/locale-toggle";
import { SidebarLayout, type NavGroup } from "@/components/sidebar-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/services/auth/client";
import { AppBrand } from "@/components/app-brand";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const session = await authClient.getSession();

    if (!session.data?.user) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: Admin,
});

const adminNavGroups: NavGroup[] = [
  {
    label: m.sidebar_group_admin,
    items: [
      { label: m.sidebar_nav_dashboard, href: "/admin", icon: LayoutDashboard },
      { label: m.sidebar_nav_users, href: "/admin/users", icon: Users },
    ],
  },
  {
    label: m.sidebar_group_oauth,
    items: [{ label: m.sidebar_nav_clients, href: "/admin/oauth/clients", icon: KeyRound }],
  },
];

function Admin() {
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
          {m.admin_checking_access()}
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return <AdminAccessDenied isSignedIn={!!user} />;
  }

  return (
    <SidebarLayout
      sidebarHeader={
        <AppBrand
          label={m.sidebar_brand()}
          subtitle={m.sidebar_brand_subtitle()}
          icon={Users}
          href="/"
          variant="sidebar"
        />
      }
      groups={adminNavGroups}
    >
      <Outlet />
    </SidebarLayout>
  );
}

function AdminAccessDenied({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <main className="relative grid min-h-screen place-items-center px-6 py-10">
      <div className="absolute right-6 top-6 md:right-10 md:top-10">
        <LocaleToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <ShieldAlert />
          </div>
          <CardTitle>{m.admin_access_required()}</CardTitle>
          <CardDescription>
            {isSignedIn ? m.admin_no_permission() : m.admin_sign_in_first()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{m.admin_mistake()}</p>
        </CardContent>
        {!isSignedIn ? (
          <CardFooter>
            <Button render={<Link to="/sign-in" />}>{m.auth_sign_in()}</Button>
          </CardFooter>
        ) : null}
      </Card>
    </main>
  );
}
