import { DeliveryAdmin } from "./delivery.api.js";
import { EmailAddress, EmailDisplayName } from "../schema.js";
import { ContactParams } from "./schema.js";
import { Schema } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  OpenApi,
} from "effect/http-api";

const EmailPreview = Schema.Struct({
  from: Schema.optional(EmailAddress),
  fromName: Schema.optional(EmailDisplayName),
  subject: Schema.NonEmptyString,
  text: Schema.NullOr(Schema.String),
  html: Schema.NullOr(Schema.String),
}).annotate({ identifier: "DeliveryEmailPreview" });

export const DeliveryPreviewGroup = HttpApiGroup.make("deliveryPreview")
  .add(
    HttpApiEndpoint.get("get", "/send/staff/deliveries/:id/preview", {
      params: ContactParams,
      success: Schema.NullOr(EmailPreview),
      error: [HttpApiError.NotFound, HttpApiError.InternalServerError],
    }),
  )
  .middleware(DeliveryAdmin)
  .annotate(OpenApi.Exclude, true);

export const DeliveryPreviewApi = HttpApi.make("NotificationDeliveryPreviewApi")
  .add(DeliveryPreviewGroup)
  .prefix("/api");
