import type { Body, SendEmailCommandInput } from "@aws-sdk/client-sesv2";
import type { SendMailOptions } from "nodemailer";

import type { EmailPayloadV1, EmailRecipient } from "../schema.js";
import {
  emailUnsubscribeHeaders,
  formatEmailRecipient,
} from "../transport/email.js";

interface EmailRequestInput {
  readonly email: EmailPayloadV1;
  readonly recipient: EmailRecipient;
  readonly from: string;
}

export const sesEmailRequest = ({
  email,
  recipient,
  from,
}: EmailRequestInput): SendEmailCommandInput => {
  const body: Body = {};
  if (email.text !== undefined)
    body.Text = { Data: email.text, Charset: "UTF-8" };
  if (email.html !== undefined)
    body.Html = { Data: email.html, Charset: "UTF-8" };
  return {
    FromEmailAddress: from,
    Destination: { ToAddresses: [formatEmailRecipient(recipient)] },
    Content: {
      Simple: {
        Subject: { Data: email.subject, Charset: "UTF-8" },
        Body: body,
        Headers:
          email.unsubscribeUrl === undefined
            ? undefined
            : emailUnsubscribeHeaders(email).map(({ name, value }) => ({
                Name: name,
                Value: value,
              })),
      },
    },
    ReplyToAddresses: email.replyTo === undefined ? undefined : [email.replyTo],
  };
};

export const smtpEmailRequest = ({
  email,
  recipient,
  from,
}: EmailRequestInput): SendMailOptions => ({
  from,
  to: { address: recipient.address, name: recipient.name ?? undefined },
  replyTo: email.replyTo,
  subject: email.subject,
  text: email.text,
  html: email.html,
  headers:
    email.unsubscribeUrl === undefined
      ? undefined
      : emailUnsubscribeHeaders(email).map(({ name, value }) => ({
          key: name,
          value,
        })),
  disableFileAccess: true,
  disableUrlAccess: true,
});
