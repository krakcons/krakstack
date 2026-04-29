import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { KeyRound, Loader2, ShieldAlert, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { AuthSidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
    return <DashboardPage />;
  }

  return <Outlet />;
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
    label: "Users",
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
    <SidebarProvider>
      <AuthSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
        </header>
        <div className="flex flex-col gap-6 px-5 py-6 md:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Overview of your auth instance.
                </p>
              </div>
            </div>
          </header>

          {error ? (
            <p className="text-sm text-destructive">{error.message}</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardDescription>Total Users</CardDescription>
                    <CardTitle className="text-3xl font-bold tabular-nums">
                      {isLoading ? <Loader2 className="animate-spin size-6" /> : (stats?.totalUsers ?? 0).toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="size-4" />
                      <span>Registered users</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>OAuth Clients</CardDescription>
                    <CardTitle className="text-3xl font-bold tabular-nums">
                      {isLoading ? <Loader2 className="animate-spin size-6" /> : (stats?.totalClients ?? 0).toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <KeyRound className="size-4" />
                      <span>Registered clients</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>OAuth Client Users</CardTitle>
                    <CardDescription>
                      Number of users consented to each OAuth client.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                      <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="userCount" fill="var(--color-userCount)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
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
