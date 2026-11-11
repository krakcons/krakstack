import type { Body, SendEmailCommandInput } from "@aws-sdk/client-sesv2";
import { Buffer } from "node:buffer";
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

// SES requires MIME encoded words for non-ASCII display names. Encoding every
// name also keeps quotes and address-like text from changing the mailbox.
// Limit each word to 72 characters (RFC 2047 permits at most 75), without
// splitting a UTF-8 code point across words.
const encodeSenderName = (name: string): string => {
  const chunks: string[] = [];
  let chunk = "";
  for (const character of name) {
    if (Buffer.byteLength(chunk + character, "utf8") > 45) {
      chunks.push(chunk);
      chunk = "";
    }
    chunk += character;
  }
  if (chunk) chunks.push(chunk);
  return chunks
    .map(
      (value) => `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`,
    )
    .join(" ");
};

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
    FromEmailAddress:
      email.fromName === undefined
        ? from
        : `${encodeSenderName(email.fromName)} <${from}>`,
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
  from:
    email.fromName === undefined
      ? from
      : { address: from, name: email.fromName },
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
