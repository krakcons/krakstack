import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { Ban, Loader2, RefreshCw, ShieldOff, UserIcon } from "lucide-react";
import { useState } from "react";

import {
  createDataTableActionsColumn,
  DataTable,
  TableSearchSchema,
} from "@/components/data-table";
import { ErrorMessage } from "@/components/form";
import { SidebarPageHeader } from "@/components/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/admin/users")({
  validateSearch: TableSearchSchema,
  component: UsersPage,
});

type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
};

function useUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: { limit: 100 },
      });
      if (result.error) throw new Error(result.error.message ?? m.admin_error_access_required());
      const data = result.data as { users: User[]; total: number } | undefined;
      return { users: data?.users ?? [], total: data?.total ?? 0 };
    },
  });
}

function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await authClient.admin.banUser({ userId });
      if (result.error) throw new Error(result.error.message ?? m.admin_error_ban());
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

function useUnbanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await authClient.admin.unbanUser({ userId });
      if (result.error) throw new Error(result.error.message ?? m.admin_error_unban());
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

function UsersPage() {
  const { data, isLoading, error, refetch } = useUsers();
  const [banningUser, setBanningUser] = useState<User | null>(null);
  const [unbanningUser, setUnbanningUser] = useState<User | null>(null);

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <SidebarPageHeader
        title={m.admin_users_title()}
        description={`${m.admin_users_description()} ${total === 1 ? m.admin_users_count_single() : m.admin_users_count({ count: total.toString() })}`}
        badge={{ label: m.admin_badge_admin() }}
        actions={
          <Button disabled={isLoading} onClick={() => void refetch()} variant="outline">
            {isLoading ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            {m.admin_refresh()}
          </Button>
        }
      />

      {error ? <ErrorMessage text={error.message} /> : null}
      <DataTable
        columns={userColumns({ onBan: setBanningUser, onUnban: setUnbanningUser })}
        data={users}
        exportFileName="users.csv"
        features={{ gallery: false }}
        from="/admin/users"
      />
      {banningUser ? (
        <BanUserDialog user={banningUser} onClose={() => setBanningUser(null)} />
      ) : null}
      {unbanningUser ? (
        <UnbanUserDialog user={unbanningUser} onClose={() => setUnbanningUser(null)} />
      ) : null}
    </>
  );
}

const userColumns = ({
  onBan,
  onUnban,
}: {
  onBan: (user: User) => void;
  onUnban: (user: User) => void;
}): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: m.admin_column_user(),
    cell: ({ row }) => (
      <div className="flex min-w-48 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          {row.original.image ? (
            <img alt={row.original.name} className="size-8 rounded-full" src={row.original.image} />
          ) : (
            <UserIcon className="size-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.original.name}</span>
          <span className="truncate text-xs text-muted-foreground">{row.original.email}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "emailVerified",
    header: m.admin_column_verified(),
    cell: ({ row }) =>
      row.original.emailVerified ? (
        <Badge variant="outline">{m.admin_column_verified()}</Badge>
      ) : (
        <Badge variant="secondary">{m.admin_column_unverified()}</Badge>
      ),
  },
  {
    accessorKey: "role",
    header: m.admin_column_role(),
    cell: ({ row }) => {
      const role = row.original.role;
      if (!role) return <span className="text-muted-foreground">{m.admin_column_role_none()}</span>;
      return (
        <div className="flex flex-wrap gap-1.5">
          {role.split(",").map((r) => (
            <Badge key={r.trim()} variant={r.trim() === "admin" ? "default" : "outline"}>
              {r.trim()}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "banned",
    header: m.admin_column_status(),
    cell: ({ row }) =>
      row.original.banned ? (
        <Badge variant="destructive">{m.admin_status_banned()}</Badge>
      ) : (
        <Badge variant="outline">{m.admin_status_active()}</Badge>
      ),
  },
  {
    accessorKey: "createdAt",
    header: m.admin_column_created(),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </span>
    ),
  },
  createDataTableActionsColumn<User>([
    {
      name: m.admin_action_ban(),
      icon: <Ban className="size-4" />,
      variant: "destructive",
      onClick: onBan,
      visible: (user) => !user.banned,
    },
    {
      name: m.admin_action_unban(),
      icon: <ShieldOff className="size-4" />,
      onClick: onUnban,
      visible: (user) => !!user.banned,
    },
  ]),
];

function BanUserDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const banUser = useBanUser();

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.admin_ban_title()}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.admin_ban_description({ name: user.name, email: user.email })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {banUser.error ? <ErrorMessage text={banUser.error.message} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={banUser.isPending}>
            {m.form_block_navigation_cancel()}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              banUser.mutate(user.id, { onSuccess: onClose });
            }}
            disabled={banUser.isPending}
          >
            {banUser.isPending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            {m.admin_action_ban()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function UnbanUserDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const unbanUser = useUnbanUser();

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.admin_unban_title()}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.admin_unban_description({ name: user.name, email: user.email })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {unbanUser.error ? <ErrorMessage text={unbanUser.error.message} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={unbanUser.isPending}>
            {m.form_block_navigation_cancel()}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              unbanUser.mutate(user.id, { onSuccess: onClose });
            }}
            disabled={unbanUser.isPending}
          >
            {unbanUser.isPending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            {m.admin_action_unban()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

