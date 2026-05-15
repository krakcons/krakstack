import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useAppForm } from "@/components/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { authClient } from "@/services/auth/client";

export const Route = createFileRoute("/_auth/2fa")({
  component: TwoFactorVerify,
});

function TwoFactorVerify() {
  const navigate = useNavigate();
  const [useBackupCode, setUseBackupCode] = useState(false);
  const redirectTarget = getRedirectTarget();
  const form = useAppForm({
    defaultValues: {
      code: "",
      trustDevice: true,
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });

      const result = useBackupCode
        ? await authClient.twoFactor.verifyBackupCode({
            code: value.code.trim(),
            trustDevice: value.trustDevice,
          })
        : await authClient.twoFactor.verifyTotp({
            code: value.code.trim(),
            trustDevice: value.trustDevice,
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

      if (
        URL.canParse(redirectTarget, window.location.origin) &&
        new URL(redirectTarget, window.location.origin).origin !==
          window.location.origin
      ) {
        window.location.assign(redirectTarget);
      } else {
        navigate({ to: redirectTarget });
      }
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl">
          {m.two_factor_verify_title()}
        </CardTitle>
        <CardDescription>
          {useBackupCode
            ? m.two_factor_verify_backup_description()
            : m.two_factor_verify_description()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.AppField name="code">
              {(field) => (
                <field.TextField
                  label={
                    useBackupCode
                      ? m.two_factor_backup_code()
                      : m.two_factor_code()
                  }
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  required
                />
              )}
            </form.AppField>
            <form.AppField name="trustDevice">
              {(field) => (
                <field.CheckboxField label={m.two_factor_trust_device()} />
              )}
            </form.AppField>
            <form.FormError />
            <div className="flex flex-wrap items-center gap-3">
              <form.SubmitButton />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setUseBackupCode(!useBackupCode)}
              >
                {useBackupCode
                  ? m.two_factor_use_totp()
                  : m.two_factor_use_backup_code()}
              </Button>
            </div>
          </form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

const getRedirectTarget = () => {
  const search = new URLSearchParams(window.location.search);
  return (
    search.get("callbackURL") ??
    search.get("redirectTo") ??
    search.get("returnTo") ??
    "/admin"
  );
};
