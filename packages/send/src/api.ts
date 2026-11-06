import { Context } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  HttpApiMiddleware,
} from "effect/http-api";

import {
  Contact,
  ContactPage,
  ContactParams,
  ContactListQuery,
  CreateContact,
  UpdateContact,
  EmailConsentChange,
  EmailConsentEvent,
  ConsentEventPage,
  ConsentEventListQuery,
  SendNotFound,
  SendConflict,
  SendValidationError,
} from "./schema.js";

export class CurrentSendAdmin extends Context.Service<
  CurrentSendAdmin,
  { readonly reference: string }
>()("@krak-stack/send/CurrentSendAdmin") {}

// Deliberately no default implementation: the host must authorize every request.
export class SendAdmin extends HttpApiMiddleware.Service<
  SendAdmin,
  { provides: CurrentSendAdmin }
>()("@krak-stack/send/SendAdmin", {
  error: [HttpApiError.Unauthorized, HttpApiError.Forbidden],
}) {}

export const SendAdminGroup = HttpApiGroup.make("send")
  .add(
    HttpApiEndpoint.get("listContacts", "/contacts", {
      query: ContactListQuery,
      success: ContactPage,
      error: [SendValidationError, HttpApiError.InternalServerError],
    }),
  )
  .add(
    HttpApiEndpoint.post("createContact", "/contacts", {
      payload: CreateContact,
      success: Contact,
      error: [
        SendConflict,
        SendNotFound,
        SendValidationError,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.get("getContact", "/contacts/:id", {
      params: ContactParams,
      success: Contact,
      error: [
        SendNotFound,
        SendValidationError,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.put("updateContact", "/contacts/:id", {
      params: ContactParams,
      payload: UpdateContact,
      success: Contact,
      error: [
        SendNotFound,
        SendValidationError,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.post("recordEmailConsent", "/contacts/:id/email-consent", {
      params: ContactParams,
      payload: EmailConsentChange,
      success: EmailConsentEvent,
      error: [
        SendNotFound,
        SendConflict,
        SendValidationError,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.get(
      "listEmailConsentEvents",
      "/contacts/:id/email-consent",
      {
        params: ContactParams,
        query: ConsentEventListQuery,
        success: ConsentEventPage,
        error: [
          SendNotFound,
          SendValidationError,
          HttpApiError.InternalServerError,
        ],
      },
    ),
  )
  .prefix("/send")
  .middleware(SendAdmin);

export const SendAdminApi = HttpApi.make("SendAdminApi")
  .add(SendAdminGroup)
  .prefix("/api");
