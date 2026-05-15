import type { ApiKey } from "@better-auth/api-key/client";
import { type ColumnDef } from "@tanstack/react-table";
import {
  KeyRound,
  LogOutIcon,
  ShieldCheck,
  Trash2,
  UserCircleIcon,
  UserIcon,
} from "lucide-react";
import QRCode from "react-qr-code";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
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
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { authClient } from "@/services/auth/client";

type UserFormType = {
  name: string;
};

type TotpSetup = {
  totpURI: string;
  backupCodes: string[];
};

type ApiKeySummary = Omit<ApiKey, "key">;

type UserDropdownProps = {
  signOutRedirect?: string;
  side?: ComponentProps<typeof DropdownMenuContent>["side"];
  renderUnauthenticated?: () => ReactNode;
};

type SettingsDialog = "account" | "security" | "apiKeys";

export const UserButton = ({
  signOutRedirect = "/",
  side = "bottom",
  renderUnauthenticated,
}: UserDropdownProps) => {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [settingsDialog, setSettingsDialog] = useState<SettingsDialog | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);

  if (!session) {
    return <>{renderUnauthenticated?.()}</>;
  }

  const displayName = session.user.name.trim();
  const displayEmail = session.user.email.trim();

  const signOut = async () => {
    await authClient.signOut();
    window.location.assign(signOutRedirect);
  };

  const updateUser = async (values: UserFormType) => {
    setFormError(null);
    const result = await authClient.updateUser(values);

    if (isAuthErrorResult(result)) {
      throw new Error(result.error.message || m.user_form_update_error());
    }

    await refetch();

    setSettingsDialog(null);
  };

  const dialogTitle =
    settingsDialog === "account"
      ? m.user_form_title()
      : settingsDialog === "security"
        ? m.user_security_title()
        : m.user_api_keys_title();

  const dialogDescription =
    settingsDialog === "account"
      ? m.user_form_description()
      : settingsDialog === "security"
        ? m.user_security_description()
        : m.user_api_keys_description();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="icon">
              <UserIcon className="size-4.5" />
              <span className="sr-only">{m.user_button_aria_label()}</span>
            </Button>
          }
        />
        <DropdownMenuContent
          className="min-w-56 rounded-lg"
          side={side}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserIcon className="size-4.5" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {displayName && (
                    <span className="text-foreground truncate font-medium">
                      {displayName}
                    </span>
                  )}
                  {displayEmail && (
                    <span
                      className={cn(
                        "truncate text-xs",
                        displayName && "text-muted-foreground",
                      )}
                    >
                      {displayEmail}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => setSettingsDialog("account")}
            >
              <UserCircleIcon />
              {m.user_button_account()}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettingsDialog("security")}>
              <ShieldCheck />
              {m.user_button_security()}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettingsDialog("apiKeys")}>
              <KeyRound />
              {m.user_button_api_keys()}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOutIcon />
              {m.user_button_logout()}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={settingsDialog !== null}
        onOpenChange={(open) => {
          if (!open) setSettingsDialog(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <Separator />
          {settingsDialog === "account" ? (
            <UserForm
              defaultValues={{
                name: displayName ?? "",
              }}
              error={formError}
              onSubmit={async (data) => {
                try {
                  await updateUser(data);
                } catch (error) {
                  setFormError(
                    error instanceof Error
                      ? error.message
                      : m.user_form_update_error(),
                  );
                }
              }}
            />
          ) : null}
          {settingsDialog === "security" ? <AccountSecuritySettings /> : null}
          {settingsDialog === "apiKeys" ? <ApiKeyManager /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

const UserForm = ({
  defaultValues,
  error,
  onSubmit,
}: {
  defaultValues: UserFormType;
  error?: string | null;
  onSubmit: (values: UserFormType) => Promise<void>;
}) => {
  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.AppForm>
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label={m.user_form_name_label()}
              autoComplete="name"
              required
            />
          )}
        </form.AppField>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <form.SubmitButton />
      </form.AppForm>
    </form>
  );
};

function AccountSecuritySettings() {
  const session = authClient.useSession();
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const twoFactorEnabled = hasTwoFactorEnabled(session.data?.user);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm leading-none font-medium">
            {m.user_two_factor_title()}
          </h2>
          <p className="text-muted-foreground text-xs">
            {m.user_two_factor_description()}
          </p>
        </div>
        <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
          {twoFactorEnabled
            ? m.user_two_factor_enabled()
            : m.user_two_factor_disabled()}
        </Badge>
      </div>
      {twoFactorEnabled ? (
        <DisableTotpForm
          onDisabled={async () => {
            setMessage(m.user_two_factor_disabled_message());
            await session.refetch();
          }}
        />
      ) : setup ? (
        <VerifyTotpSetup
          setup={setup}
          onVerified={async () => {
            setSetup(null);
            setMessage(m.user_two_factor_enabled_message());
            await session.refetch();
          }}
        />
      ) : (
        <EnableTotpForm onEnabled={setSetup} />
      )}
      {message ? (
        <p className="text-muted-foreground text-sm">{message}</p>
      ) : null}
    </div>
  );
}

function EnableTotpForm({
  onEnabled,
}: {
  onEnabled: (setup: TotpSetup) => void;
}) {
  const form = useAppForm({
    defaultValues: { password: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      const result = await authClient.twoFactor.enable({
        password: value.password,
      });

      if (result.error || !result.data) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error?.message ?? m.user_two_factor_enable_error(),
            fields: {},
          },
        });
        return;
      }

      onEnabled({
        totpURI: result.data.totpURI,
        backupCodes: result.data.backupCodes,
      });
    },
  });

  return (
    <form.AppForm>
      <form
        className="flex max-w-md flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label={m.user_field_password()}
              type="password"
              autoComplete="current-password"
              required
            />
          )}
        </form.AppField>
        <form.FormError />
        <form.SubmitButton />
      </form>
    </form.AppForm>
  );
}

function VerifyTotpSetup({
  setup,
  onVerified,
}: {
  setup: TotpSetup;
  onVerified: () => Promise<void>;
}) {
  const form = useAppForm({
    defaultValues: { code: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      const result = await authClient.twoFactor.verifyTotp({
        code: value.code.trim(),
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.user_two_factor_verify_error(),
            fields: {},
          },
        });
        return;
      }

      await onVerified();
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <div className="rounded-lg bg-white p-4">
          <QRCode value={setup.totpURI} className="size-full" />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">
            {m.user_two_factor_scan_title()}
          </h2>
          <p className="text-muted-foreground text-sm">
            {m.user_two_factor_scan_description()}
          </p>
          <div className="grid gap-2 rounded-lg border p-3 font-mono text-sm sm:grid-cols-2">
            {setup.backupCodes.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            {m.user_two_factor_backup_codes_warning()}
          </p>
        </div>
      </div>
      <form.AppForm>
        <form
          className="flex max-w-md flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.AppField name="code">
            {(field) => (
              <field.TextField
                label={m.user_two_factor_code()}
                autoComplete="one-time-code"
                inputMode="numeric"
                required
              />
            )}
          </form.AppField>
          <form.FormError />
          <form.SubmitButton />
        </form>
      </form.AppForm>
    </div>
  );
}

function DisableTotpForm({ onDisabled }: { onDisabled: () => Promise<void> }) {
  const form = useAppForm({
    defaultValues: { password: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      const result = await authClient.twoFactor.disable({
        password: value.password,
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.user_two_factor_disable_error(),
            fields: {},
          },
        });
        return;
      }

      await onDisabled();
    },
  });

  return (
    <form.AppForm>
      <form
        className="flex max-w-md flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label={m.user_field_password()}
              type="password"
              autoComplete="current-password"
              required
            />
          )}
        </form.AppField>
        <form.FormError />
        <form.SubmitButton />
      </form>
    </form.AppForm>
  );
}

function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadKeys = async () => {
    setLoading(true);
    setError(null);
    const result = await authClient.apiKey.list({
      query: { configId: "user" },
    });

    if (result.error) {
      setError(result.error.message ?? m.user_api_keys_load_error());
      setLoading(false);
      return;
    }

    setKeys(result.data?.apiKeys ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadKeys();
  }, []);

  const createForm = useAppForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      setCreatedKey(null);
      const result = await authClient.apiKey.create({
        configId: "user",
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
      configId: "user",
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
        exportFileName="api-keys.csv"
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

const hasTwoFactorEnabled = (user: unknown) => {
  if (
    typeof user !== "object" ||
    user === null ||
    !("twoFactorEnabled" in user)
  )
    return false;
  return user.twoFactorEnabled === true;
};

const isAuthErrorResult = (
  result: unknown,
): result is { error: { message?: string } } => {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof result.error === "object" &&
    result.error !== null
  );
};
