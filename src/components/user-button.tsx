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
import { QRCode } from "react-qr-code";
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
import { centralAuthClient } from "@/services/auth/client/central";

type UserFormType = {
  name: string;
  image: string;
};

type TotpSetup = {
  totpURI: string;
  backupCodes: string[];
};

type ApiKeySummary = Omit<ApiKey, "key">;

type LinkedAccount = {
  id: string;
  providerId: string;
  accountId: string;
};

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
  const centralSession = centralAuthClient.useSession();
  const [settingsDialog, setSettingsDialog] = useState<SettingsDialog | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [centralAuthError, setCentralAuthError] = useState<string | null>(null);

  if (!session) {
    return <>{renderUnauthenticated?.()}</>;
  }

  const displayName = session.user.name.trim();
  const displayEmail = session.user.email.trim();
  const displayImage = session.user.image?.trim() ?? "";

  const signOut = async () => {
    const redirectUrl = new URL(signOutRedirect, window.location.origin);

    await Promise.allSettled([
      authClient.signOut(),
      centralAuthClient.signOut(),
    ]);
    window.location.assign(redirectUrl.href);
  };

  const updateUser = async (values: UserFormType) => {
    setFormError(null);
    const result = await centralAuthClient.updateUser({
      name: values.name.trim(),
      image: values.image.trim(),
    });

    if (isAuthErrorResult(result)) {
      throw new Error(result.error.message || m.user_form_update_error());
    }

    await centralSession.refetch();
    await refetch();

    setSettingsDialog(null);
  };

  const reconnectCentralAuth = async () => {
    setCentralAuthError(null);
    const result = await authClient.signIn.oauth2({
      providerId: "krakstack-auth",
      callbackURL: window.location.href,
    });

    if (result.error) {
      setCentralAuthError(
        result.error.message ?? m.user_central_auth_reconnect_error(),
      );
      return;
    }

    if (result.data?.url) window.location.assign(result.data.url);
  };

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
        open={settingsDialog === "account"}
        onOpenChange={(open) => {
          setSettingsDialog((current) =>
            open ? "account" : current === "account" ? null : current,
          );
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{m.user_form_title()}</DialogTitle>
            <DialogDescription>{m.user_form_description()}</DialogDescription>
          </DialogHeader>
          <Separator />
          {centralSession.isPending ? (
            <p className="text-muted-foreground text-sm">{m.user_loading()}</p>
          ) : !centralSession.data ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                {m.user_central_auth_required()}
              </p>
              {centralAuthError ? (
                <p className="text-destructive text-sm">{centralAuthError}</p>
              ) : null}
              <Button
                type="button"
                className="self-start"
                onClick={reconnectCentralAuth}
              >
                {m.user_central_auth_reconnect()}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <UserForm
                defaultValues={{
                  name: displayName ?? "",
                  image: displayImage,
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
              <Separator />
              <ConnectedAccounts />
              <Separator />
              <PasswordSettings />
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={settingsDialog === "security"}
        onOpenChange={(open) => {
          setSettingsDialog((current) =>
            open ? "security" : current === "security" ? null : current,
          );
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {m.user_security_title()}
            </DialogTitle>
            <DialogDescription>{m.user_security_description()}</DialogDescription>
          </DialogHeader>
          <Separator />
          <AccountSecuritySettings />
        </DialogContent>
      </Dialog>
      <Dialog
        open={settingsDialog === "apiKeys"}
        onOpenChange={(open) => {
          setSettingsDialog((current) =>
            open ? "apiKeys" : current === "apiKeys" ? null : current,
          );
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {m.user_api_keys_title()}
            </DialogTitle>
            <DialogDescription>{m.user_api_keys_description()}</DialogDescription>
          </DialogHeader>
          <Separator />
          <ApiKeyManager />
        </DialogContent>
      </Dialog>
    </>
  );
};

function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [revokingAccount, setRevokingAccount] = useState<LinkedAccount | null>(
    null,
  );

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    const result = await centralAuthClient.listAccounts();

    if (result.error) {
      setError(result.error.message ?? m.user_accounts_load_error());
      setLoading(false);
      return;
    }

    setAccounts(result.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const googleAccount = accounts.find(
    (account) => account.providerId === "google",
  );
  const hasPassword = accounts.some(
    (account) => account.providerId === "credential",
  );
  const canRevokeAccount = accounts.length > 1;

  const linkGoogle = async () => {
    setError(null);
    setIsLinking(true);

    const result = await centralAuthClient.linkSocial({
      provider: "google",
      callbackURL: window.location.href,
    });

    if (result.error) {
      setError(result.error.message ?? m.user_account_google_link_error());
      setIsLinking(false);
      return;
    }

    if (result.data?.url) {
      window.location.assign(result.data.url);
      return;
    }

    setIsLinking(false);
  };

  const revokeAccount = async (account: LinkedAccount) => {
    setError(null);
    const result = await centralAuthClient.unlinkAccount({
      providerId: account.providerId,
      accountId: account.accountId,
    });

    if (result.error) {
      setError(result.error.message ?? m.user_account_revoke_error());
      return;
    }

    setRevokingAccount(null);
    await loadAccounts();
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-sm leading-none font-medium">
          {m.user_accounts_title()}
        </h2>
        <p className="text-muted-foreground text-sm">
          {m.user_accounts_description()}
        </p>
      </div>
      {loading ? (
        <p className="text-muted-foreground text-sm">{m.user_loading()}</p>
      ) : null}
      <AccountProviderRow
        initial="G"
        title={m.user_account_google_title()}
        description={m.user_account_google_description()}
        account={googleAccount}
        connected={Boolean(googleAccount)}
        canRevoke={canRevokeAccount}
        connectLabel={m.user_account_google_connect()}
        revokeLabel={m.user_account_revoke()}
        onlyMethodLabel={m.user_account_only_method()}
        isConnecting={isLinking}
        renderDisconnected={undefined}
        onConnect={linkGoogle}
        onRevoke={(account) => setRevokingAccount(account)}
      />
      {revokingAccount ? (
        <RevokeAccountForm
          account={revokingAccount}
          requirePassword={hasPassword}
          onCancel={() => setRevokingAccount(null)}
          onRevoke={revokeAccount}
        />
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </section>
  );
}

function AccountProviderRow({
  initial,
  title,
  description,
  account,
  connected,
  canRevoke,
  connectLabel,
  revokeLabel,
  onlyMethodLabel,
  isConnecting,
  renderDisconnected,
  onConnect,
  onRevoke,
}: {
  initial: string;
  title: ReactNode;
  description: ReactNode;
  account: LinkedAccount | undefined;
  connected: boolean;
  canRevoke: boolean;
  connectLabel: ReactNode;
  revokeLabel: ReactNode;
  onlyMethodLabel: ReactNode;
  isConnecting?: boolean;
  renderDisconnected: ReactNode | undefined;
  onConnect: () => void;
  onRevoke: (account: LinkedAccount) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-background flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold">
            {initial}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{title}</p>
              <Badge variant={connected ? "default" : "secondary"}>
                {connected
                  ? m.user_account_connected()
                  : m.user_account_not_connected()}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </div>
        {connected && account ? (
          <Button
            type="button"
            variant="outline"
            disabled={!canRevoke}
            onClick={() => onRevoke(account)}
          >
            {canRevoke ? revokeLabel : onlyMethodLabel}
          </Button>
        ) : renderDisconnected ? (
          renderDisconnected
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={isConnecting}
            onClick={onConnect}
          >
            {connectLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function PasswordSettings() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingAccount, setRevokingAccount] = useState<LinkedAccount | null>(
    null,
  );

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    const result = await centralAuthClient.listAccounts();

    if (result.error) {
      setError(result.error.message ?? m.user_accounts_load_error());
      setLoading(false);
      return;
    }

    setAccounts(result.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const passwordAccount = accounts.find(
    (account) => account.providerId === "credential",
  );
  const hasPassword = Boolean(passwordAccount);
  const canRevokeAccount = accounts.length > 1;

  const revokePassword = async (account: LinkedAccount) => {
    setError(null);
    const result = await centralAuthClient.unlinkAccount({
      providerId: account.providerId,
      accountId: account.accountId,
    });

    if (result.error) {
      setError(result.error.message ?? m.user_account_revoke_error());
      return;
    }

    setRevokingAccount(null);
    await loadAccounts();
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-sm leading-none font-medium">
          {m.user_account_password_title()}
        </h2>
        <p className="text-muted-foreground text-sm">
          {m.user_account_password_description()}
        </p>
      </div>
      {loading ? (
        <p className="text-muted-foreground text-sm">{m.user_loading()}</p>
      ) : null}
      {hasPassword && passwordAccount ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{m.user_account_password_title()}</p>
                <Badge>{m.user_account_connected()}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {m.user_account_password_connected_description()}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!canRevokeAccount}
              onClick={() => setRevokingAccount(passwordAccount)}
            >
              {canRevokeAccount
                ? m.user_account_revoke()
                : m.user_account_only_method()}
            </Button>
          </div>
          {revokingAccount ? (
            <RevokeAccountForm
              account={revokingAccount}
              requirePassword
              onCancel={() => setRevokingAccount(null)}
              onRevoke={revokePassword}
            />
          ) : null}
          <Separator />
          <ChangePasswordForm />
        </div>
      ) : (
        <SetPasswordForm onSaved={loadAccounts} />
      )}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </section>
  );
}

function ChangePasswordForm() {
  const [saved, setSaved] = useState(false);
  const form = useAppForm({
    defaultValues: { currentPassword: "", newPassword: "" },
    onSubmit: async ({ value, formApi }) => {
      setSaved(false);
      formApi.setErrorMap({ onSubmit: undefined });
      const result = await centralAuthClient.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form:
              result.error.message ?? m.user_account_password_change_error(),
            fields: {},
          },
        });
        return;
      }

      form.reset();
      setSaved(true);
    },
  });

  return (
    <form.AppForm>
      <form
        className="flex w-full flex-col gap-3 sm:max-w-md"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">
            {m.user_account_password_change_title()}
          </h3>
          <p className="text-muted-foreground text-sm">
            {m.user_account_password_change_description()}
          </p>
        </div>
        <form.AppField name="currentPassword">
          {(field) => (
            <field.TextField
              label={m.user_account_current_password()}
              type="password"
              autoComplete="current-password"
              required
            />
          )}
        </form.AppField>
        <form.AppField name="newPassword">
          {(field) => (
            <field.TextField
              label={m.user_account_new_password()}
              type="password"
              autoComplete="new-password"
              required
            />
          )}
        </form.AppField>
        <form.FormError />
        {saved ? (
          <p className="text-sm text-green-600">
            {m.user_account_password_change_success()}
          </p>
        ) : null}
        <Button type="submit" className="self-start">
          {m.user_account_password_change_submit()}
        </Button>
      </form>
    </form.AppForm>
  );
}

function SetPasswordForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const form = useAppForm({
    defaultValues: { password: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      const result = await centralAuthClient.$fetch("/set-password", {
        method: "POST",
        body: { newPassword: value.password },
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.user_account_password_set_error(),
            fields: {},
          },
        });
        return;
      }

      form.reset();
      await onSaved();
    },
  });

  return (
    <form.AppForm>
      <form
        className="flex w-full flex-col gap-3 sm:max-w-sm"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label={m.user_account_new_password()}
              type="password"
              autoComplete="new-password"
              required
            />
          )}
        </form.AppField>
        <form.FormError />
        <Button type="submit" className="self-start">
          {m.user_account_password_set()}
        </Button>
      </form>
    </form.AppForm>
  );
}

function RevokeAccountForm({
  account,
  requirePassword,
  onCancel,
  onRevoke,
}: {
  account: LinkedAccount;
  requirePassword: boolean;
  onCancel: () => void;
  onRevoke: (account: LinkedAccount) => Promise<void>;
}) {
  const form = useAppForm({
    defaultValues: { password: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });

      if (requirePassword) {
        const verified = await centralAuthClient.$fetch("/verify-password", {
          method: "POST",
          body: { password: value.password },
        });

        if (verified.error) {
          formApi.setErrorMap({
            onSubmit: {
              form: m.user_account_password_verify_error(),
              fields: {},
            },
          });
          return;
        }
      }

      await onRevoke(account);
    },
  });

  return (
    <form.AppForm>
      <form
        className="bg-muted/40 flex flex-col gap-3 rounded-lg border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">{m.user_account_revoke()}</h3>
          <p className="text-muted-foreground text-sm">
            {m.user_account_revoke_description({
              provider: providerName(account.providerId),
            })}
          </p>
        </div>
        {requirePassword ? (
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
        ) : null}
        <form.FormError />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {m.user_account_cancel()}
          </Button>
          <Button type="submit">{m.user_account_confirm_revoke()}</Button>
        </div>
      </form>
    </form.AppForm>
  );
}

const providerName = (providerId: string) => {
  if (providerId === "google") return m.user_account_google_title();
  if (providerId === "credential") return m.user_account_password_title();
  return providerId;
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
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-sm leading-none font-medium">
          {m.user_profile_title()}
        </h2>
        <p className="text-muted-foreground text-sm">
          {m.user_profile_description()}
        </p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppForm>
          <div className="flex flex-wrap items-center gap-4">
            {defaultValues.image ? (
              <img
                src={defaultValues.image}
                alt=""
                className="size-16 rounded-full border object-cover"
              />
            ) : (
              <span className="bg-muted flex size-16 items-center justify-center rounded-full border">
                <UserIcon className="size-7" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <form.AppField name="image">
                {(field) => (
                  <field.TextField
                    label={m.user_profile_photo_label()}
                    type="url"
                    autoComplete="photo"
                    placeholder="https://example.com/avatar.png"
                  />
                )}
              </form.AppField>
            </div>
          </div>
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
    </section>
  );
};

function AccountSecuritySettings() {
  const session = centralAuthClient.useSession();
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
      const result = await centralAuthClient.twoFactor.enable({
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
      const result = await centralAuthClient.twoFactor.verifyTotp({
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-4 rounded-lg border p-4 text-center sm:p-6">
        <div className="rounded-xl border bg-white p-3">
          <QRCode
            value={setup.totpURI}
            title={m.user_two_factor_scan_title()}
            className="size-44 max-w-full"
          />
        </div>
        <p className="text-muted-foreground max-w-md text-sm">
          {m.user_two_factor_scan_description()}
        </p>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="bg-muted/40 grid gap-2 rounded-md p-3 font-mono text-sm sm:grid-cols-2">
          {setup.backupCodes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          {m.user_two_factor_backup_codes_warning()}
        </p>
      </div>
      <form.AppForm>
        <form
          className="flex w-full max-w-sm flex-col gap-4"
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
      const result = await centralAuthClient.twoFactor.disable({
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
    const result = await centralAuthClient.apiKey.list({
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
      const result = await centralAuthClient.apiKey.create({
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
    const result = await centralAuthClient.apiKey.delete({
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
        from="/"
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
