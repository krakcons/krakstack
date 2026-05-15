import type { ApiKey } from "@better-auth/api-key/client";
import { type ColumnDef } from "@tanstack/react-table";
import { Building2, KeyRound, PencilIcon, Trash2 } from "lucide-react";
import {
  type ComponentProps,
  useEffect,
  useEffectEvent,
  useState,
} from "react";

import {
  createDataTableActionsColumn,
  DataTable,
} from "@/components/data-table";
import { useAppForm } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { m } from "@/paraglide/messages";
import { authClient } from "@/services/auth/client";

type OrganizationSwitcherProps = {
  side?: ComponentProps<typeof DropdownMenuContent>["side"];
};

type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
};

type OrganizationDialog = "create" | "manage" | "apiKeys";
type ApiKeySummary = Omit<ApiKey, "key">;

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function OrganizationSwitcher({
  side = "bottom",
}: OrganizationSwitcherProps) {
  const organizations = authClient.useListOrganizations();
  const activeOrganization = authClient.useActiveOrganization();
  const [dialog, setDialog] = useState<OrganizationDialog | null>(null);

  const active = activeOrganization.data;
  const activeName = active?.name;
  const selectableOrganizations =
    organizations.data?.filter(
      (organization) => organization.id !== active?.id,
    ) ?? [];

  const refresh = async () => {
    await organizations.refetch();
    await activeOrganization.refetch();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="max-w-48 justify-start">
              <Building2 data-icon="inline-start" />
              <span className="truncate">
                {activeName ?? m.organization_switcher_label()}
              </span>
            </Button>
          }
        />
        <DropdownMenuContent
          className="min-w-64 rounded-lg"
          side={side}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Building2 className="size-4.5" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {active ? (
                    <>
                      <span className="text-foreground truncate font-medium">
                        {active.name}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {active.slug}
                      </span>
                    </>
                  ) : (
                    <span className="text-foreground truncate font-medium">
                      {m.organization_switcher_label()}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.isPending ? (
              <DropdownMenuItem disabled>
                {m.organization_loading()}
              </DropdownMenuItem>
            ) : null}
            {organizations.error ? (
              <DropdownMenuItem disabled>
                {organizations.error.message}
              </DropdownMenuItem>
            ) : null}
            {selectableOrganizations.length ? (
              selectableOrganizations.map((organization) => (
                <DropdownMenuItem
                  key={organization.id}
                  onClick={async () => {
                    const result = await authClient.organization.setActive({
                      organizationId: organization.id,
                    });
                    if (!result.error) await refresh();
                  }}
                >
                  <Building2 />
                  <span className="truncate">{organization.name}</span>
                </DropdownMenuItem>
              ))
            ) : !organizations.isPending ? (
              <DropdownMenuItem disabled>
                {active
                  ? m.organization_switcher_no_other_organizations()
                  : m.organization_switcher_empty()}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDialog("create")}>
              <Building2 />
              {m.organization_create_title()}
            </DropdownMenuItem>
            {activeOrganization.data ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDialog("manage")}>
                  <PencilIcon />
                  {m.organization_switcher_manage()}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog("apiKeys")}>
                  <KeyRound />
                  {m.user_button_api_keys()}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {dialog === "create"
                ? m.organization_create_title()
                : dialog === "apiKeys"
                  ? m.user_api_keys_title()
                  : m.organization_switcher_manage()}
            </DialogTitle>
            <DialogDescription>
              {dialog === "create"
                ? m.organization_create_description()
                : dialog === "apiKeys"
                  ? activeOrganization.data?.name
                  : m.organization_edit_description()}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          {dialog === "create" ? (
            <CreateOrganizationSection
              onCreated={async () => {
                await refresh();
                setDialog(null);
              }}
            />
          ) : null}
          {dialog === "manage" && activeOrganization.data ? (
            <EditOrganizationSection
              organization={activeOrganization.data}
              onUpdated={refresh}
            />
          ) : null}
          {dialog === "apiKeys" && activeOrganization.data ? (
            <OrganizationApiKeyManager organization={activeOrganization.data} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditOrganizationSection({
  organization,
  onUpdated,
}: {
  organization: OrganizationSummary;
  onUpdated: () => Promise<void>;
}) {
  const form = useAppForm({
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      const name = value.name.trim();
      const slug = value.slug.trim().toLowerCase();

      const result = await authClient.organization.update({
        organizationId: organization.id,
        data: { name, slug },
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.organization_update_error(),
            fields: {},
          },
        });
        return;
      }

      await onUpdated();
    },
  });

  return (
    <section className="flex flex-col gap-4">
      <form.AppForm>
        <form
          className="flex max-w-xl flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.AppField name="name">
            {(field) => (
              <field.TextField label={m.organization_name()} required />
            )}
          </form.AppField>
          <form.AppField name="slug">
            {(field) => (
              <field.TextField label={m.organization_slug()} required />
            )}
          </form.AppField>
          <form.FormError />
          <form.SubmitButton />
        </form>
      </form.AppForm>
    </section>
  );
}

function CreateOrganizationSection({
  onCreated,
}: {
  onCreated: () => Promise<void>;
}) {
  const form = useAppForm({
    defaultValues: { name: "", slug: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      const name = value.name.trim();
      const slug = (value.slug.trim() || slugify(name)).toLowerCase();

      const result = await authClient.organization.create({
        name,
        slug,
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.organization_create_error(),
            fields: {},
          },
        });
        return;
      }

      form.reset();
      await onCreated();
    },
  });

  return (
    <section className="flex flex-col gap-4">
      <form.AppForm>
        <form
          className="flex max-w-xl flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.AppField name="name">
            {(field) => (
              <field.TextField label={m.organization_name()} required />
            )}
          </form.AppField>
          <form.AppField name="slug">
            {(field) => (
              <field.TextField
                label={m.organization_slug()}
                description={m.organization_slug_description()}
              />
            )}
          </form.AppField>
          <form.FormError />
          <form.SubmitButton />
        </form>
      </form.AppForm>
    </section>
  );
}

function OrganizationApiKeyManager({
  organization,
}: {
  organization: OrganizationSummary;
}) {
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadKeys = useEffectEvent(async () => {
    setLoading(true);
    setError(null);
    const result = await authClient.apiKey.list({
      query: { configId: "organization", organizationId: organization.id },
    });

    if (result.error) {
      setError(result.error.message ?? m.user_api_keys_load_error());
      setLoading(false);
      return;
    }

    setKeys(result.data?.apiKeys ?? []);
    setLoading(false);
  });

  useEffect(() => {
    void loadKeys();
  }, [organization.id]);

  const createForm = useAppForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      setCreatedKey(null);
      const result = await authClient.apiKey.create({
        configId: "organization",
        organizationId: organization.id,
        name: value.name.trim(),
      });

      if (result.error || !result.data) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error?.message ?? m.user_api_key_create_error(),
            fields: {},
          },
        });
        return;
      }

      setCreatedKey(result.data.key);
      createForm.reset();
      await loadKeys();
    },
  });

  const deleteKey = async (key: ApiKeySummary) => {
    const result = await authClient.apiKey.delete({
      configId: "organization",
      keyId: key.id,
    });

    if (result.error) {
      setError(result.error.message ?? m.user_api_key_delete_error());
      return;
    }

    await loadKeys();
  };

  return (
    <div className="flex flex-col gap-5">
      <createForm.AppForm>
        <form
          className="flex max-w-xl flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            createForm.handleSubmit();
          }}
        >
          <createForm.AppField name="name">
            {(field) => (
              <field.TextField label={m.user_api_key_name()} required />
            )}
          </createForm.AppField>
          <createForm.FormError />
          <createForm.SubmitButton />
        </form>
      </createForm.AppForm>
      {createdKey ? (
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex items-center gap-2 font-medium">
            <KeyRound />
            {m.user_api_key_created_title()}
          </div>
          <p className="text-muted-foreground text-sm">
            {m.user_api_key_created_description()}
          </p>
          <code className="bg-muted overflow-x-auto rounded-md p-3 text-sm">
            {createdKey}
          </code>
        </div>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {loading ? (
        <p className="text-muted-foreground text-sm">{m.user_loading()}</p>
      ) : null}
      <Separator />
      <DataTable
        columns={apiKeyColumns({ onDelete: deleteKey })}
        data={keys}
        exportFileName={`${organization.slug}-api-keys.csv`}
        features={{ gallery: false }}
      />
    </div>
  );
}

const apiKeyColumns = ({
  onDelete,
}: {
  onDelete: (key: ApiKeySummary) => void;
}): ColumnDef<ApiKeySummary>[] => [
  {
    accessorKey: "name",
    header: m.user_api_key_name(),
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="text-muted-foreground text-sm">
          {row.original.start
            ? m.user_api_key_starts_with({ start: row.original.start })
            : m.user_api_key_hidden()}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "enabled",
    header: m.user_api_key_status(),
    cell: ({ row }) => (
      <Badge variant={row.original.enabled ? "default" : "secondary"}>
        {row.original.enabled
          ? m.user_api_key_enabled()
          : m.user_api_key_disabled()}
      </Badge>
    ),
  },
  createDataTableActionsColumn<ApiKeySummary>([
    {
      name: m.user_delete(),
      icon: <Trash2 />,
      variant: "destructive",
      onClick: onDelete,
    },
  ]),
];
