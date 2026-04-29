import { createFileRoute, redirect } from "@tanstack/react-router";
import { CheckSquare, LayoutDashboard } from "lucide-react";

import { TableSearchSchema } from "@/components/data-table";
import { SidebarLayout, SidebarPageHeader } from "@/components/sidebar-layout";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskTable } from "@/components/tasks/task-table";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/session";
import { m } from "@/paraglide/messages";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin")({
  validateSearch: TableSearchSchema,
  ssr: false,
  beforeLoad: async () => {
    const session = await getCurrentSession();

    if (!session) {
      const result = await authClient.signIn.oauth2({
        providerId: "krakstack-auth",
        callbackURL: "/admin",
      });
      if (result.error) {
        throw result.error;
      }
      throw redirect({ href: result.data.url });
    }

    return { session };
  },
  component: Admin,
});

function Admin() {
  return (
    <SidebarLayout
      brand={{
        label: m.admin_brand,
        subtitle: m.admin_brand_subtitle,
        icon: LayoutDashboard,
        href: "/",
      }}
      groups={[
        {
          label: m.admin_sidebar_workspace,
          items: [{ label: m.admin_sidebar_tasks, href: "/admin", icon: CheckSquare }],
        },
      ]}
    >
      <SidebarPageHeader
        badge={{ label: m.admin_badge(), variant: "outline" }}
        title={m.admin_title()}
        description={m.admin_description()}
        actions={<TaskDialog trigger={<Button type="button">{m.tasks_create()}</Button>} />}
      />
      <TaskTable from="/admin" />
    </SidebarLayout>
  );
}
