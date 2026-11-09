import { Context } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  HttpApiMiddleware,
} from "effect/http-api";
import { ContactParams, SendNotFound, SendValidationError } from "./schema.js";
import * as S from "./delivery.schema.js";

export class CurrentDeliveryAdmin extends Context.Service<
  CurrentDeliveryAdmin,
  {
    readonly reference: string;
    readonly access: typeof S.DeliveryAdminAccess.Type;
  }
>()("@krak-stack/notifications/CurrentDeliveryAdmin") {}

// No default or SendAdmin fallback. Hosts must explicitly grant staff scope.
export class DeliveryAdmin extends HttpApiMiddleware.Service<
  DeliveryAdmin,
  { provides: CurrentDeliveryAdmin }
>()("@krak-stack/notifications/DeliveryAdmin", {
  error: [HttpApiError.Unauthorized, HttpApiError.Forbidden],
}) {}
const errors = [
  SendNotFound,
  SendValidationError,
  HttpApiError.InternalServerError,
];
export const DeliveryAdminGroup = HttpApiGroup.make("notificationDeliveries")
  .add(
    HttpApiEndpoint.get("overview", "/overview", {
      query: S.DeliveryOverviewQuery,
      success: S.DeliveryOverview,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.get("activityTable", "/activity", {
      query: S.DeliveryTableQuery,
      success: S.AdminDeliveryPage,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.get("inspect", "/:id", {
      params: ContactParams,
      query: S.DeliverySelection,
      success: S.AdminDeliveryInspection,
      error: errors,
    }),
  )
  .prefix("/send/staff/deliveries")
  .middleware(DeliveryAdmin);
export const DeliveryAdminApi = HttpApi.make("NotificationDeliveryAdminApi")
  .add(DeliveryAdminGroup)
  .prefix("/api");
