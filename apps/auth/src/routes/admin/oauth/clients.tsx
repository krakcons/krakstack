import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, Pencil, Plus, RefreshCw, Trash } from "lucide-react";
import { useState } from "react";

import { createDataTableActionsColumn, DataTable, TableSearchSchema } from "@/components/data-table";
import { ErrorMessage, useAppForm } from "@/components/form/form";
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
import { AuthSidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin/oauth/clients")({
  validateSearch: TableSearchSchema,
  component: ClientsPage,
});

type OAuthClient = {
  client_id: string;
  client_secret?: string;
  client_name?: string;
  redirect_uris: string[];
  token_endpoint_auth_method?: string;
  scope?: string;
  skip_consent?: boolean;
  require_pkce?: boolean;
  type: string | null;
  disabled?: boolean;
};

type ClientFormValues = {
  clientName: string;
  redirectUris: string;
  scopes: string;
};

type ClientUpdateFormValues = {
  clientName: string;
  redirectUris: string;
  scopes: string;
};

function useOAuthClients() {
  return useQuery({
    queryKey: ["admin", "oauth", "clients"],
    queryFn: async () => {
      const result = await authClient.oauth2.getClients();
      if (result.error) throw new Error(result.error.message ?? "Admin access is required.");
      return (result.data ?? []) as OAuthClient[];
    },
  });
}

function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      const result = await authClient.oauth2.deleteClient({ client_id: clientId });
      if (result.error) throw new Error(result.error.message ?? "Unable to delete OAuth client.");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "oauth", "clients"] });
    },
  });
}

function ClientsPage() {
  const { data: clients = [], isLoading, error, refetch } = useOAuthClients();
  const [editingClient, setEditingClient] = useState<OAuthClient | null>(null);
  const [deletingClient, setDeletingClient] = useState<OAuthClient | null>(null);

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
                OAuth
              </Badge>
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Manage applications that can authenticate through Krakstack Auth.
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
              <CreateClientDialog />
            </div>
          </header>

          {error ? <ErrorMessage text={error.message} /> : null}
          <DataTable
            columns={clientColumns({ onEdit: setEditingClient, onDelete: setDeletingClient })}
            data={clients}
            exportFileName="oauth-clients.csv"
            features={{ gallery: false }}
            from="/admin/oauth/clients"
          />
          {editingClient ? (
            <UpdateClientDialog
              client={editingClient}
              onClose={() => setEditingClient(null)}
            />
          ) : null}
          {deletingClient ? (
            <DeleteClientDialog
              client={deletingClient}
              onClose={() => setDeletingClient(null)}
            />
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const clientColumns = ({
  onEdit,
  onDelete,
}: {
  onEdit: (client: OAuthClient) => void;
  onDelete: (client: OAuthClient) => void;
}): ColumnDef<OAuthClient>[] => [
  {
    accessorKey: "client_name",
    header: "Client",
    cell: ({ row }) => (
      <div className="flex min-w-48 flex-col gap-1">
        <span className="font-medium">{row.original.client_name ?? row.original.client_id}</span>
        <code className="truncate text-xs text-muted-foreground">{row.original.client_id}</code>
      </div>
    ),
  },
  {
    accessorKey: "redirect_uris",
    header: "Redirect URIs",
    cell: ({ row }) => <ListCell items={row.original.redirect_uris} />,
  },
  {
    accessorKey: "scope",
    header: "Scopes",
    cell: ({ row }) => <ListCell items={row.original.scope?.split(" ").filter(Boolean) ?? []} />,
  },
  {
    id: "flags",
    header: "Flags",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">{row.original.token_endpoint_auth_method ?? "default"}</Badge>
        {row.original.skip_consent ? <Badge variant="secondary">skip consent</Badge> : null}
        {row.original.require_pkce ? <Badge variant="secondary">PKCE</Badge> : null}
        {row.original.disabled ? <Badge variant="destructive">disabled</Badge> : null}
      </div>
    ),
  },
  createDataTableActionsColumn<OAuthClient>([
    { name: "Edit", icon: <Pencil className="size-4" />, onClick: onEdit },
    { name: "Delete", icon: <Trash className="size-4" />, variant: "destructive", onClick: onDelete },
  ]),
];

function ListCell({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-muted-foreground">None</span>;

  return (
    <div className="flex max-w-md flex-col gap-1">
      {items.map((item) => (
        <code className="truncate text-xs" key={item}>
          {item}
        </code>
      ))}
    </div>
  );
}

function CreateClientDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [createdClientSecret, setCreatedClientSecret] = useState<string | null>(null);
  const form = useAppForm({
    defaultValues: {
      clientName: "",
      redirectUris: "http://localhost:3000/api/auth/oauth2/callback/krakstack-auth",
      scopes: "openid, profile, email, offline_access",
    } satisfies ClientFormValues,
    onSubmit: async ({ value, formApi }) => {
      setCreatedClientId(null);
      setCreatedClientSecret(null);
      formApi.setErrorMap({});

      const result = await authClient.oauth2.createClient({
        client_name: value.clientName,
        redirect_uris: parseListInput(value.redirectUris),
        scope: parseListInput(value.scopes).join(" "),
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        type: "web",
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: { form: result.error.message ?? "Unable to create OAuth client.", fields: {} },
        });
        return;
      }

      setCreatedClientId(result.data.client_id);
      setCreatedClientSecret(result.data.client_secret ?? null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "oauth", "clients"] });
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Create client
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create OAuth client</DialogTitle>
          <DialogDescription>Register an application for OAuth authorization code flow.</DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.AppField name="clientName">
              {(field) => <field.TextField label="Display name" required />}
            </form.AppField>
            <form.AppField name="redirectUris">
              {(field) => (
                <field.TextAreaField
                  description="Separate multiple redirect URIs with commas or new lines."
                  label="Redirect URIs"
                  required
                  rows={3}
                />
              )}
            </form.AppField>
            <form.AppField name="scopes">
              {(field) => <field.TextField label="Scopes" required />}
            </form.AppField>
            <form.Subscribe
              selector={(formState) =>
                (formState.errorMap.onSubmit as { form?: unknown } | undefined)?.form
              }
            >
              {(submitError) => (submitError ? <ErrorMessage text={String(submitError)} /> : null)}
            </form.Subscribe>
            {createdClientId ? (
              <div className="flex flex-col gap-1 rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
                <p>Created client {createdClientId}.</p>
                {createdClientSecret ? <code className="break-all">{createdClientSecret}</code> : null}
              </div>
            ) : null}
            <form.SubmitButton />
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}

function UpdateClientDialog({
  client,
  onClose,
}: {
  client: OAuthClient;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useAppForm({
    defaultValues: {
      clientName: client.client_name ?? "",
      redirectUris: client.redirect_uris.join("\n"),
      scopes: client.scope?.replace(/ /g, ", ") ?? "",
    } satisfies ClientUpdateFormValues,
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({});

      const result = await authClient.oauth2.updateClient({
        client_id: client.client_id,
        update: {
          client_name: value.clientName || undefined,
          redirect_uris: parseListInput(value.redirectUris),
          scope: parseListInput(value.scopes).join(" "),
        },
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: { form: result.error.message ?? "Unable to update OAuth client.", fields: {} },
        });
        return;
      }

      void queryClient.invalidateQueries({ queryKey: ["admin", "oauth", "clients"] });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit OAuth client</DialogTitle>
          <DialogDescription>
            Update settings for <code className="text-xs">{client.client_id}</code>.
          </DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.AppField name="clientName">
              {(field) => <field.TextField label="Display name" />}
            </form.AppField>
            <form.AppField name="redirectUris">
              {(field) => (
                <field.TextAreaField
                  description="Separate multiple redirect URIs with commas or new lines."
                  label="Redirect URIs"
                  rows={3}
                />
              )}
            </form.AppField>
            <form.AppField name="scopes">
              {(field) => <field.TextField label="Scopes" />}
            </form.AppField>
            <form.Subscribe
              selector={(formState) =>
                (formState.errorMap.onSubmit as { form?: unknown } | undefined)?.form
              }
            >
              {(submitError) => (submitError ? <ErrorMessage text={String(submitError)} /> : null)}
            </form.Subscribe>
            <form.SubmitButton />
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}

function DeleteClientDialog({
  client,
  onClose,
}: {
  client: OAuthClient;
  onClose: () => void;
}) {
  const deleteClient = useDeleteClient();

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete OAuth client</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{client.client_name ?? client.client_id}</strong>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteClient.error ? <ErrorMessage text={deleteClient.error.message} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteClient.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              deleteClient.mutate(client.client_id, { onSuccess: onClose });
            }}
            disabled={deleteClient.isPending}
          >
            {deleteClient.isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const parseListInput = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
