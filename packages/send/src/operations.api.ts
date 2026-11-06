import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
} from "effect/http-api";
import { SendAdmin } from "./api.js";
import {
  ContactParams,
  SendConflict,
  SendNotFound,
  SendValidationError,
} from "./schema.js";
import * as S from "./operations.schema.js";
const errors = [
  SendConflict,
  SendNotFound,
  SendValidationError,
  HttpApiError.InternalServerError,
];
export const SendOperationsGroup = HttpApiGroup.make("sendOperations")
  .add(
    HttpApiEndpoint.get("overview", "/operations/overview", {
      query: S.OperationWindow,
      success: S.SendingOverview,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.get("activity", "/operations/deliveries", {
      query: S.ActivityQuery,
      success: S.ActivityPage,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.get("inspect", "/operations/deliveries/:id", {
      params: ContactParams,
      success: S.DeliveryInspection,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.get("feedback", "/operations/feedback", {
      query: S.FeedbackQuery,
      success: S.FeedbackPage,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.get("suppressions", "/operations/suppressions", {
      query: S.SuppressionQuery,
      success: S.SuppressionPage,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.get("audit", "/operations/suppression-history", {
      query: S.OperationQuery,
      success: S.SuppressionAuditPage,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.get("recipients", "/operations/recipients", {
      query: S.RecipientQuery,
      success: S.RecipientPage,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.post("addSuppression", "/operations/suppressions", {
      payload: S.AddSuppression,
      success: S.SuppressionChange,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.post(
      "removeSuppression",
      "/operations/suppressions/:id/remove",
      {
        params: ContactParams,
        payload: S.RemoveSuppression,
        success: S.SuppressionChange,
        error: errors,
      },
    ),
  )
  .prefix("/send")
  .middleware(SendAdmin);
export const SendOperationsApi = HttpApi.make("SendOperationsApi")
  .add(SendOperationsGroup)
  .prefix("/api");
