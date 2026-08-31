import { Schema } from "effect";

import {
  EmailAddress,
  EmailDisplayName,
  EmailPayloadV1,
  EmailRecipient,
  type EmailRecipient as EmailRecipientType,
} from "../schema.js";

export const decodeEmailPayloadV1 = Schema.decodeUnknownEffect(EmailPayloadV1);
export const decodeEmailAddress = Schema.decodeUnknownEffect(EmailAddress);
export const decodeEmailDisplayName =
  Schema.decodeUnknownEffect(EmailDisplayName);
export const decodeEmailRecipient = Schema.decodeUnknownEffect(EmailRecipient);

export const formatEmailRecipient = (recipient: EmailRecipientType): string =>
  recipient.name === null
    ? recipient.address
    : `"${recipient.name
        .replaceAll("\\", "\\\\")
        .replaceAll('"', '\\"')}" <${recipient.address}>`;

export {
  EmailAddress,
  EmailDisplayName,
  EmailPayloadV1,
  EmailRecipient,
} from "../schema.js";
