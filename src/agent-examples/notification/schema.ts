import { Schema } from "effect";

import { EmailUnsubscribeTokenInput } from "../../../packages/notifications/src/unsubscribe";

export const UnsubscribeSearch = Schema.Struct({
  token: EmailUnsubscribeTokenInput.fields.token,
  locale: Schema.optional(Schema.Literals(["en", "fr"])),
}).annotate({ identifier: "NotificationUnsubscribeSearch" });
