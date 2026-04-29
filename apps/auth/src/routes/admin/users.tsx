import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { Ban, Loader2, RefreshCw, ShieldOff, UserIcon } from "lucide-react";
import { useState } from "react";

import { createDataTableActionsColumn, DataTable, TableSearchSchema } from "@/components/data-table";
import { ErrorMessage } from "@/components/form/form";
import { AuthSidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
      if (result.error) throw new Error(result.error.message ?? "Admin access is required.");
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
      if (result.error) throw new Error(result.error.message ?? "Unable to ban user.");
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
      if (result.error) throw new Error(result.error.message ?? "Unable to unban user.");
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
    <SidebarProvider>
      <AuthSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
        </header>
        <div className="flex flex-col gap-6 px-5 py-6 md:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <Badge className="w-fit" variant="secondary">
                Admin
              </Badge>
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Manage registered users and their access. {total} user{total !== 1 ? "s" : ""} total.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button disabled={isLoading} onClick={() => void refetch()} variant="outline">
                {isLoading ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <RefreshCw data-icon="inline-start" />
                )}
                Refresh
              </Button>
            </div>
          </header>

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
        </div>
      </SidebarInset>
    </SidebarProvider>
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
    header: "User",
    cell: ({ row }) => (
      <div className="flex min-w-48 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          {row.original.image ? (
            <img
              alt={row.original.name}
              className="size-8 rounded-full"
              src={row.original.image}
            />
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
    header: "Verified",
    cell: ({ row }) =>
      row.original.emailVerified ? (
        <Badge variant="outline">Verified</Badge>
      ) : (
        <Badge variant="secondary">Unverified</Badge>
      ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role;
      if (!role) return <span className="text-muted-foreground">None</span>;
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
    header: "Status",
    cell: ({ row }) =>
      row.original.banned ? (
        <Badge variant="destructive">Banned</Badge>
      ) : (
        <Badge variant="outline">Active</Badge>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </span>
    ),
  },
  createDataTableActionsColumn<User>([
    {
      name: "Ban",
      icon: <Ban className="size-4" />,
      variant: "destructive",
      onClick: onBan,
      visible: (user) => !user.banned,
    },
    {
      name: "Unban",
      icon: <ShieldOff className="size-4" />,
      onClick: onUnban,
      visible: (user) => !!user.banned,
    },
  ]),
];

function BanUserDialog({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const banUser = useBanUser();

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ban user</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to ban <strong>{user.name}</strong> ({user.email})? They will not
            be able to sign in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {banUser.error ? <ErrorMessage text={banUser.error.message} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={banUser.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              banUser.mutate(user.id, { onSuccess: onClose });
            }}
            disabled={banUser.isPending}
          >
            {banUser.isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
            Ban
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function UnbanUserDialog({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const unbanUser = useUnbanUser();

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unban user</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unban <strong>{user.name}</strong> ({user.email})? They will be
            able to sign in again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {unbanUser.error ? <ErrorMessage text={unbanUser.error.message} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={unbanUser.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              unbanUser.mutate(user.id, { onSuccess: onClose });
            }}
            disabled={unbanUser.isPending}
          >
            {unbanUser.isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
            Unban
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
