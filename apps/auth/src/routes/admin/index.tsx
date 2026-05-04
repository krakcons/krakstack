import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { KeyRound, Loader2, Users } from "lucide-react";

import { m } from "@/paraglide/messages";
import { SidebarPageHeader } from "@/components/sidebar-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

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
    <>
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
    </>
  );
}
