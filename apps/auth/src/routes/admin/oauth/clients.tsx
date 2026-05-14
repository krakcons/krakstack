import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Check,
  Copy,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  createDataTableActionsColumn,
  DataTable,
  TableSearchSchema,
} from "@/components/data-table";
import { ErrorMessage, useAppForm } from "@/components/form";
import { SidebarPageHeader } from "@/components/sidebar-layout";
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
import { authClient } from "@/services/auth/client";
import { m } from "@/paraglide/messages";

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

const SCOPE_OPTIONS = [
  { label: "openid", value: "openid" },
  { label: "profile", value: "profile" },
  { label: "email", value: "email" },
  { label: "offline_access", value: "offline_access" },
];

type ClientFormValues = {
  clientName: string;
  redirectUris: string;
  scopes: string[];
};

type ClientUpdateFormValues = {
  clientName: string;
  redirectUris: string;
  scopes: string[];
};

function useOAuthClients() {
  return useQuery({
    queryKey: ["admin", "oauth", "clients"],
    queryFn: async () => {
      const result = await authClient.oauth2.getClients();
      if (result.error)
        throw new Error(result.error.message ?? m.admin_error_fetch_clients());
      return (result.data ?? []) as OAuthClient[];
    },
  });
}

function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      const result = await authClient.oauth2.deleteClient({
        client_id: clientId,
      });
      if (result.error)
        throw new Error(result.error.message ?? m.admin_error_delete_client());
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "oauth", "clients"],
      });
      toast.success(m.admin_client_deleted_toast());
    },
  });
}

function ClientsPage() {
  const { data: clients = [], isLoading, error, refetch } = useOAuthClients();
  const [editingClient, setEditingClient] = useState<OAuthClient | null>(null);
  const [deletingClient, setDeletingClient] = useState<OAuthClient | null>(
    null,
  );

  return (
    <>
      <SidebarPageHeader
        title={m.admin_clients_title()}
        description={m.admin_clients_description()}
        badge={{ label: m.admin_badge_oauth() }}
        actions={
          <>
            <Button
              disabled={isLoading}
              onClick={() => void refetch()}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <RefreshCw data-icon="inline-start" />
              )}
              {m.admin_refresh()}
            </Button>
            <CreateClientDialog />
          </>
        }
      />

      {error ? <ErrorMessage text={error.message} /> : null}
      <DataTable
        columns={clientColumns({
          onEdit: setEditingClient,
          onDelete: setDeletingClient,
        })}
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
    </>
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
    header: m.admin_column_client(),
    cell: ({ row }) => (
      <div className="flex min-w-48 flex-col gap-1">
        <span className="font-medium">
          {row.original.client_name ?? row.original.client_id}
        </span>
        <code className="text-muted-foreground truncate text-xs">
          {row.original.client_id}
        </code>
      </div>
    ),
  },
  {
    accessorKey: "redirect_uris",
    header: m.admin_column_redirect_uris(),
    cell: ({ row }) => <ListCell items={row.original.redirect_uris} />,
  },
  {
    accessorKey: "scope",
    header: m.admin_column_scopes(),
    cell: ({ row }) => (
      <ListCell items={row.original.scope?.split(" ").filter(Boolean) ?? []} />
    ),
  },
  {
    id: "flags",
    header: m.admin_column_flags(),
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">
          {row.original.token_endpoint_auth_method ?? m.admin_flag_default()}
        </Badge>
        {row.original.skip_consent ? (
          <Badge variant="secondary">{m.admin_flag_skip_consent()}</Badge>
        ) : null}
        {row.original.require_pkce ? (
          <Badge variant="secondary">PKCE</Badge>
        ) : null}
        {row.original.disabled ? (
          <Badge variant="destructive">{m.admin_flag_disabled()}</Badge>
        ) : null}
      </div>
    ),
  },
  createDataTableActionsColumn<OAuthClient>([
    {
      name: m.admin_action_edit(),
      icon: <Pencil className="size-4" />,
      onClick: onEdit,
    },
    {
      name: m.actions_delete(),
      icon: <Trash className="size-4" />,
      variant: "destructive",
      onClick: onDelete,
    },
  ]),
];

function ListCell({ items }: { items: string[] }) {
  if (items.length === 0)
    return <span className="text-muted-foreground">{m.admin_none()}</span>;

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
  const [createdClientSecret, setCreatedClientSecret] = useState<string | null>(
    null,
  );
  const form = useAppForm({
    defaultValues: {
      clientName: "",
      redirectUris: "https://www.example.com/api/auth/callback/krakstack-auth",
      scopes: ["openid", "profile", "email", "offline_access"],
    } satisfies ClientFormValues,
    onSubmit: async ({ value, formApi }) => {
      setCreatedClientId(null);
      setCreatedClientSecret(null);
      formApi.setErrorMap({ onSubmit: undefined });

      const result = await authClient.oauth2.createClient({
        client_name: value.clientName,
        redirect_uris: parseListInput(value.redirectUris),
        scope: value.scopes.join(" "),
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        type: "web",
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.admin_error_create_client(),
            fields: {},
          },
        });
        return;
      }

      setCreatedClientId(result.data.client_id);
      setCreatedClientSecret(result.data.client_secret ?? null);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "oauth", "clients"],
      });
      toast.success(m.admin_client_created_toast());
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        {m.admin_create_client()}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{m.admin_create_client_title()}</DialogTitle>
          <DialogDescription>
            {m.admin_create_client_description()}
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
              {(field) => (
                <field.TextField
                  label={m.admin_field_display_name()}
                  required
                />
              )}
            </form.AppField>
            <form.AppField name="redirectUris">
              {(field) => (
                <field.TextAreaField
                  description={m.admin_field_redirect_uris_description()}
                  label={m.admin_field_redirect_uris()}
                  required
                  rows={3}
                />
              )}
            </form.AppField>
            <form.AppField name="scopes">
              {(field) => (
                <field.MultiSelectField
                  label={m.admin_column_scopes()}
                  options={SCOPE_OPTIONS}
                />
              )}
            </form.AppField>
            <form.FormError />
            {createdClientId ? (
              <CredentialCard
                clientId={createdClientId}
                clientSecret={createdClientSecret}
              />
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
      scopes: client.scope?.split(" ").filter(Boolean) ?? [],
    } satisfies ClientUpdateFormValues,
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });

      const result = await authClient.oauth2.updateClient({
        client_id: client.client_id,
        update: {
          client_name: value.clientName || undefined,
          redirect_uris: parseListInput(value.redirectUris),
          scope: value.scopes.join(" "),
        },
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.admin_error_update_client(),
            fields: {},
          },
        });
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ["admin", "oauth", "clients"],
      });
      toast.success(m.admin_client_updated_toast());
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{m.admin_edit_client_title()}</DialogTitle>
          <DialogDescription>
            {m.admin_edit_client_description({ id: client.client_id })}
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
              {(field) => (
                <field.TextField label={m.admin_field_display_name()} />
              )}
            </form.AppField>
            <form.AppField name="redirectUris">
              {(field) => (
                <field.TextAreaField
                  description={m.admin_field_redirect_uris_description()}
                  label={m.admin_field_redirect_uris()}
                  rows={3}
                />
              )}
            </form.AppField>
            <form.AppField name="scopes">
              {(field) => (
                <field.MultiSelectField
                  label={m.admin_column_scopes()}
                  options={SCOPE_OPTIONS}
                />
              )}
            </form.AppField>
            <form.FormError />
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
          <AlertDialogTitle>{m.admin_delete_client_title()}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.admin_delete_client_description({
              name: client.client_name ?? client.client_id,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteClient.error ? (
          <ErrorMessage text={deleteClient.error.message} />
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteClient.isPending}>
            {m.form_block_navigation_cancel()}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              deleteClient.mutate(client.client_id, { onSuccess: onClose });
            }}
            disabled={deleteClient.isPending}
          >
            {deleteClient.isPending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            {m.actions_delete()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(m.admin_client_copied());
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 shrink-0"
      onClick={handleCopy}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

function CredentialCard({
  clientId,
  clientSecret,
}: {
  clientId: string;
  clientSecret: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          {m.admin_client_credentials_title()}
        </span>
        <span className="text-muted-foreground text-xs">
          {m.admin_client_credentials_description()}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2">
          <span className="text-muted-foreground shrink-0 text-xs font-medium">
            {m.admin_client_id_label()}
          </span>
          <code className="min-w-0 flex-1 truncate text-xs">{clientId}</code>
          <CopyButton value={clientId} />
        </div>
        {clientSecret ? (
          <div className="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2">
            <span className="text-muted-foreground shrink-0 text-xs font-medium">
              {m.admin_client_secret_label()}
            </span>
            <code className="min-w-0 flex-1 truncate text-xs">
              {clientSecret}
            </code>
            <CopyButton value={clientSecret} />
          </div>
        ) : null}
      </div>
      <div className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
        <span className="text-xs text-amber-700 dark:text-amber-400">
          {m.admin_client_secret_warning()}
        </span>
      </div>
    </div>
  );
}

const parseListInput = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
