import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useState } from "react";

import { FieldError, useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { m } from "@/paraglide/messages";
import { authClient } from "@/services/auth/client";

export const Route = createFileRoute("/_auth/verify-email")({
  validateSearch: (search) => ({
    email: typeof search.email === "string" ? search.email : "",
  }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const navigate = useNavigate();
  const [resent, setResent] = useState(false);
  const { email } = Route.useSearch();
  const form = useAppForm({
    defaultValues: {
      email,
      otp: "",
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });

      const result = await authClient.emailOtp.verifyEmail({
        email: value.email.trim(),
        otp: value.otp.trim(),
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.verify_email_error(),
            fields: {},
          },
        });
        return;
      }

      navigate({ to: "/sign-in" });
    },
  });

  const resendCode = async () => {
    form.setErrorMap({ onSubmit: undefined });
    const result = await authClient.emailOtp.sendVerificationOtp({
      email: form.state.values.email.trim(),
      type: "email-verification",
    });

    if (result.error) {
      form.setErrorMap({
        onSubmit: {
          form: result.error.message ?? m.verify_email_resend_error(),
          fields: {},
        },
      });
      return;
    }

    setResent(true);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl">{m.verify_email_title()}</CardTitle>
        <CardDescription>{m.verify_email_description()}</CardDescription>
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
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  label={m.field_email()}
                  type="email"
                  autoComplete="email"
                  required
                />
              )}
            </form.AppField>
            <form.AppField name="otp">
              {(field) => {
                const invalid = !field.state.meta.isValid;
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>
                      {m.verify_email_code()}
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
            <form.FormError />
            {resent ? (
              <p className="text-muted-foreground text-sm">
                {m.verify_email_resent()}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <form.SubmitButton />
              <Button type="button" variant="ghost" onClick={resendCode}>
                {m.verify_email_resend()}
              </Button>
            </div>
          </form>
        </form.AppForm>
        <p className="text-muted-foreground mt-6 text-center text-sm">
          <Link
            className="text-foreground font-medium underline-offset-4 hover:underline"
            to="/sign-in"
          >
            {m.forgot_password_back_to_sign_in()}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
