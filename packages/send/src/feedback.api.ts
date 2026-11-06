import { Context } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  HttpApiMiddleware,
} from "effect/http-api";
import {
  FeedbackPayload,
  FeedbackProvider,
  FeedbackReceipt,
  SendConflict,
  SendValidationError,
} from "./schema.js";

export class CurrentFeedbackSource extends Context.Service<
  CurrentFeedbackSource,
  { readonly provider: typeof FeedbackProvider.Type }
>()("@krak-stack/send/CurrentFeedbackSource") {}

// The host must authenticate the provider or its trusted ingestion worker and
// bind it to this installation. This is NOT an unsigned SNS/webhook endpoint.
export class SendFeedbackAccess extends HttpApiMiddleware.Service<
  SendFeedbackAccess,
  { provides: CurrentFeedbackSource }
>()("@krak-stack/send/SendFeedbackAccess", {
  error: [HttpApiError.Unauthorized, HttpApiError.Forbidden],
}) {}

export const SendFeedbackGroup = HttpApiGroup.make("sendFeedback")
  .add(
    HttpApiEndpoint.post("record", "/send/feedback", {
      payload: FeedbackPayload,
      success: FeedbackReceipt,
      error: [
        SendConflict,
        SendValidationError,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .middleware(SendFeedbackAccess);
export const SendFeedbackApi = HttpApi.make("SendFeedbackApi")
  .add(SendFeedbackGroup)
  .prefix("/api");
