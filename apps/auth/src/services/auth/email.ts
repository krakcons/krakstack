import { Effect } from "effect";

import { m } from "@/paraglide/messages";
import { NotificationService } from "@/services/notification";
import { sesNotificationServiceLayer } from "@/services/notification/channels/ses";
import { testNotificationServiceLayer } from "@/services/notification/channels/test";
import type { NotificationEmailMessage } from "@/services/notification/schema";

const notificationLayer =
  process.env.NODE_ENV === "test"
    ? NotificationService.noopLayer
    : process.env.NODE_ENV === "development"
      ? testNotificationServiceLayer
      : sesNotificationServiceLayer;

const from =
  process.env.AUTH_EMAIL_FROM ??
  process.env.NOTIFICATION_EMAIL_FROM ??
  "Krakstack Auth <no-reply@krakstack.local>";

const localeFromRequest = (request?: Request | undefined) => {
  const language = request?.headers.get("accept-language") ?? "";
  return language.toLowerCase().startsWith("fr") ? "fr" : "en";
};

const sendAuthEmail = (message: NotificationEmailMessage) =>
  Effect.gen(function* () {
    const notifications = yield* NotificationService;
    yield* notifications.send(message);
  }).pipe(Effect.provide(notificationLayer), Effect.runPromise);

export const sendResetPasswordEmail = async ({
  request,
  to,
  url,
}: {
  readonly request?: Request | undefined;
  readonly to: string;
  readonly url: string;
}) => {
  const locale = localeFromRequest(request);
  await sendAuthEmail({
    from,
    to: [to],
    content: {
      subject: m.email_reset_password_subject({}, { locale }),
      text: m.email_reset_password_text({ url }, { locale }),
      html: m.email_reset_password_html({ url }, { locale }),
    },
  });
};

export const sendTwoFactorOtpEmail = async ({
  request,
  to,
  otp,
}: {
  readonly request?: Request | undefined;
  readonly to: string;
  readonly otp: string;
}) => {
  const locale = localeFromRequest(request);
  await sendAuthEmail({
    from,
    to: [to],
    content: {
      subject: m.email_two_factor_otp_subject({}, { locale }),
      text: m.email_two_factor_otp_text({ otp }, { locale }),
      html: m.email_two_factor_otp_html({ otp }, { locale }),
    },
  });
};

export const sendEmailVerificationOtpEmail = async ({
  request,
  to,
  otp,
  type,
}: {
  readonly request?: Request | undefined;
  readonly to: string;
  readonly otp: string;
  readonly type:
    | "sign-in"
    | "email-verification"
    | "forget-password"
    | "change-email";
}) => {
  const locale = localeFromRequest(request);
  const subject =
    type === "forget-password"
      ? m.email_otp_reset_password_subject({}, { locale })
      : m.email_otp_verification_subject({}, { locale });

  await sendAuthEmail({
    from,
    to: [to],
    content: {
      subject,
      text: m.email_otp_verification_text({ otp }, { locale }),
      html: m.email_otp_verification_html({ otp }, { locale }),
    },
  });
};
