import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";
import {
  KeyRound,
  LayoutDashboard,
  Loader2,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

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
import type { AuthSession } from "@/services/auth/config";

type SessionData = AuthSession | null;

const isAdminUser = (user: AuthSession["user"] | undefined) => {
  const role = (user as Record<string, unknown> | undefined)?.role;

  return (
    typeof role === "string" &&
    role.split(",").some((item) => item.trim() === "admin")
  );
};

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const session = await authClient.getSession({
      query: { disableCookieCache: true },
    });

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
    items: [
      {
        label: m.sidebar_nav_clients,
        href: "/admin/oauth/clients",
        icon: KeyRound,
      },
    ],
  },
];

function Admin() {
  const session = authClient.useSession();
  const [refreshedSession, setRefreshedSession] = useState<SessionData>(null);
  const [isRefreshingSession, setIsRefreshingSession] = useState(true);

  useEffect(() => {
    let isActive = true;

    void authClient
      .getSession({ query: { disableCookieCache: true } })
      .then((result) => {
        if (!isActive) return;
        setRefreshedSession(result.data ?? null);
      })
      .finally(() => {
        if (!isActive) return;
        setIsRefreshingSession(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const currentSession = refreshedSession ?? session.data ?? null;
  const user = currentSession?.user;
  const isAdmin = isAdminUser(user);

  if (session.isPending || isRefreshingSession) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-10">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
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
      <div className="absolute top-6 right-6 md:top-10 md:right-10">
        <LocaleToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="bg-destructive/10 text-destructive mb-2 flex size-10 items-center justify-center rounded-md">
            <ShieldAlert />
          </div>
          <CardTitle>{m.admin_access_required()}</CardTitle>
          <CardDescription>
            {isSignedIn ? m.admin_no_permission() : m.admin_sign_in_first()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{m.admin_mistake()}</p>
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
