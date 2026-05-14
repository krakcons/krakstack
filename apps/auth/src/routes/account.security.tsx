import { createFileRoute } from "@tanstack/react-router";
import QRCode from "react-qr-code";
import { useState } from "react";

import { useAppForm } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { m } from "@/paraglide/messages";
import { authClient } from "@/services/auth/client";

export const Route = createFileRoute("/account/security")({
  component: SecurityPage,
});

type TotpSetup = {
  totpURI: string;
  backupCodes: string[];
};

const hasTwoFactorEnabled = (user: unknown) => {
  if (
    typeof user !== "object" ||
    user === null ||
    !("twoFactorEnabled" in user)
  )
    return false;
  return user.twoFactorEnabled === true;
};

function SecurityPage() {
  const session = authClient.useSession();
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const twoFactorEnabled = hasTwoFactorEnabled(session.data?.user);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {m.security_title()}
        </h1>
        <p className="text-muted-foreground">{m.security_description()}</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{m.two_factor_title()}</CardTitle>
              <CardDescription>{m.two_factor_description()}</CardDescription>
            </div>
            <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
              {twoFactorEnabled
                ? m.two_factor_enabled()
                : m.two_factor_disabled()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {twoFactorEnabled ? (
            <DisableTotpForm
              onDisabled={async () => {
                setMessage(m.two_factor_disabled_message());
                await session.refetch();
              }}
            />
          ) : setup ? (
            <VerifyTotpSetup
              setup={setup}
              onVerified={async () => {
                setSetup(null);
                setMessage(m.two_factor_enabled_message());
                await session.refetch();
              }}
            />
          ) : (
            <EnableTotpForm onEnabled={setSetup} />
          )}
          {message ? (
            <p className="text-muted-foreground mt-4 text-sm">{message}</p>
          ) : null}
        </CardContent>
      </Card>
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
            form: result.error?.message ?? m.two_factor_enable_error(),
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
              label={m.field_password()}
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
            form: result.error.message ?? m.two_factor_verify_error(),
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
          <h2 className="text-lg font-medium">{m.two_factor_scan_title()}</h2>
          <p className="text-muted-foreground text-sm">
            {m.two_factor_scan_description()}
          </p>
          <div className="grid gap-2 rounded-lg border p-3 font-mono text-sm sm:grid-cols-2">
            {setup.backupCodes.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            {m.two_factor_backup_codes_warning()}
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
                label={m.two_factor_code()}
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
            form: result.error.message ?? m.two_factor_disable_error(),
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
              label={m.field_password()}
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
