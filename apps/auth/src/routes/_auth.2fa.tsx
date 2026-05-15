import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useState } from "react";

import { FieldError, useAppForm } from "@/components/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { m } from "@/paraglide/messages";
import { authClient } from "@/services/auth/client";

export const Route = createFileRoute("/_auth/2fa")({
  component: TwoFactorVerify,
});

function TwoFactorVerify() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"totp" | "email" | "backup">("totp");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const redirectTarget = getRedirectTarget();
  const form = useAppForm({
    defaultValues: {
      code: "",
      trustDevice: true,
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });

      const code = value.code.trim();
      const result =
        mode === "backup"
          ? await authClient.twoFactor.verifyBackupCode({
              code,
              trustDevice: value.trustDevice,
            })
          : mode === "email"
            ? await authClient.twoFactor.verifyOtp({
                code,
                trustDevice: value.trustDevice,
              })
            : await authClient.twoFactor.verifyTotp({
                code,
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

      const target = getResultRedirectUrl(result.data) ?? redirectTarget;
      if (shouldUseDocumentRedirect(target)) {
        window.location.assign(target);
      } else {
        navigate({ to: target });
      }
    },
  });

  const sendEmailCode = async () => {
    form.setErrorMap({ onSubmit: undefined });
    const result = await authClient.twoFactor.sendOtp();
    if (result.error) {
      form.setErrorMap({
        onSubmit: {
          form: result.error.message ?? m.two_factor_send_email_code_error(),
          fields: {},
        },
      });
      return;
    }

    setEmailCodeSent(true);
    setMode("email");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl">
          {m.two_factor_verify_title()}
        </CardTitle>
        <CardDescription>
          {mode === "backup"
            ? m.two_factor_verify_backup_description()
            : mode === "email"
              ? m.two_factor_verify_email_description()
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
              {(field) => {
                const invalid = !field.state.meta.isValid;

                if (mode === "backup") {
                  return (
                    <field.TextField
                      label={m.two_factor_backup_code()}
                      autoComplete="one-time-code"
                      required
                    />
                  );
                }

                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>
                      {mode === "email"
                        ? m.two_factor_email_code()
                        : m.two_factor_code()}
                    </FieldLabel>
                    <InputOTP
                      id={field.name}
                      name={field.name}
                      maxLength={6}
                      value={field.state.value ?? ""}
                      onChange={(value) => field.handleChange(value)}
                      onBlur={field.handleBlur}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern={REGEXP_ONLY_DIGITS}
                      required
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} aria-invalid={invalid} />
                        <InputOTPSlot index={1} aria-invalid={invalid} />
                        <InputOTPSlot index={2} aria-invalid={invalid} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} aria-invalid={invalid} />
                        <InputOTPSlot index={4} aria-invalid={invalid} />
                        <InputOTPSlot index={5} aria-invalid={invalid} />
                      </InputOTPGroup>
                    </InputOTP>
                    <FieldError errors={field.getMeta().errors} />
                  </Field>
                );
              }}
            </form.AppField>
            <form.AppField name="trustDevice">
              {(field) => (
                <field.CheckboxField label={m.two_factor_trust_device()} />
              )}
            </form.AppField>
            <form.FormError />
            {emailCodeSent && mode === "email" ? (
              <p className="text-muted-foreground text-sm">
                {m.two_factor_email_code_sent()}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <form.SubmitButton />
              <Button type="button" variant="ghost" onClick={sendEmailCode}>
                {m.two_factor_send_email_code()}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode(mode === "backup" ? "totp" : "backup")}
              >
                {mode === "backup"
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
  const oauthTarget = getOAuthAuthorizeTarget();
  if (oauthTarget) return oauthTarget;

  const search = new URLSearchParams(window.location.search);
  return (
    search.get("callbackURL") ??
    search.get("redirectTo") ??
    search.get("returnTo") ??
    "/admin"
  );
};

const getOAuthAuthorizeTarget = () => {
  if (!window.location.search) return null;

  const search = new URLSearchParams(window.location.search);
  if (!search.has("sig")) return null;

  return `/api/auth/oauth2/authorize${window.location.search}`;
};

const getResultRedirectUrl = (data: unknown) => {
  if (typeof data !== "object" || data === null || !("url" in data))
    return null;

  const url = data.url;
  return typeof url === "string" ? url : null;
};

const shouldUseDocumentRedirect = (target: string) => {
  if (!URL.canParse(target, window.location.origin)) return false;

  const url = new URL(target, window.location.origin);
  return (
    url.origin !== window.location.origin || url.pathname.startsWith("/api/")
  );
};
