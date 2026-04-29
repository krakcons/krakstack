import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { KeyRound, LayoutDashboard, Loader2, ShieldAlert, Users } from "lucide-react";

import { m } from "@/paraglide/messages";
import { Button } from "@/components/ui/button";
import { LocaleToggle } from "@/components/locale-toggle";
import { SidebarLayout, SidebarPageHeader, type NavGroup } from "@/components/sidebar-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin")({
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
      { label: m.sidebar_nav_clients, href: "/admin/oauth/clients", icon: KeyRound },
    ],
  },
];

const adminBrand = {
  label: m.sidebar_brand,
  subtitle: m.sidebar_brand_subtitle,
  icon: Users,
  href: "/",
};

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
          {m.admin_checking_access()}
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return <AdminAccessDenied isSignedIn={!!user} />;
  }

  if (pathname === "/admin") {
    return <DashboardPage />;
  }

  return <SidebarLayout brand={adminBrand} groups={adminNavGroups} />;
}

type ClientStats = {
  id: string;
  clientId: string;
  name: string | null;
  icon: string | null;
  disabled: boolean | null;
  userCount: number;
};

type DashboardStats = {
  totalUsers: number;
  totalClients: number;
  clients: ClientStats[];
};

function useDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/oauth-stats", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats.");
      return (await res.json()) as DashboardStats;
    },
  });
}

const chartConfig = {
  userCount: {
    label: m.admin_total_users(),
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function DashboardPage() {
  const { data: stats, isLoading, error } = useDashboardStats();

  const chartData = (stats?.clients ?? []).map((c) => ({
    name: c.name ?? c.clientId,
    userCount: c.userCount,
  }));

  return (
    <SidebarLayout brand={adminBrand} groups={adminNavGroups}>
      <SidebarPageHeader
        title={m.admin_dashboard()}
        description={m.admin_dashboard_description()}
      />

      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>{m.admin_total_users()}</CardDescription>
                <CardTitle className="text-3xl font-bold tabular-nums">
                  {isLoading ? (
                    <Loader2 className="animate-spin size-6" />
                  ) : (
                    (stats?.totalUsers ?? 0).toLocaleString()
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  <span>{m.admin_registered_users()}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>{m.admin_oauth_clients()}</CardDescription>
                <CardTitle className="text-3xl font-bold tabular-nums">
                  {isLoading ? (
                    <Loader2 className="animate-spin size-6" />
                  ) : (
                    (stats?.totalClients ?? 0).toLocaleString()
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <KeyRound className="size-4" />
                  <span>{m.admin_registered_clients()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{m.admin_oauth_client_users()}</CardTitle>
                <CardDescription>{m.admin_oauth_client_users_description()}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="userCount" fill="var(--color-userCount)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
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
