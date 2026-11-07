// Host-authorized notification campaigns.
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
} from "effect/http-api";
import { SendAdmin } from "./api.js";
import { TableQuery, tablePage } from "./table.schema.js";
import {
  Campaign,
  CampaignAction,
  CampaignPage,
  CampaignReport,
  CampaignSafetyError,
  CampaignSchedulePayload,
  ContactListQuery,
  ContactParams,
  CreateCampaign,
  SendConflict,
  SendNotFound,
  SendValidationError,
} from "./schema.js";

const errors = [
  SendConflict,
  SendNotFound,
  SendValidationError,
  CampaignSafetyError,
  HttpApiError.InternalServerError,
];
export const SendCampaignGroup = HttpApiGroup.make("sendCampaigns")
  .add(
    HttpApiEndpoint.get("table", "/tables/campaigns", {
      query: TableQuery,
      success: tablePage(Campaign, "NotificationCampaignTablePage"),
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.get("list", "/campaigns", {
      query: ContactListQuery,
      success: CampaignPage,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.post("create", "/campaigns", {
      payload: CreateCampaign,
      success: Campaign,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.get("get", "/campaigns/:id", {
      params: ContactParams,
      success: Campaign,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.get("report", "/campaigns/:id/report", {
      params: ContactParams,
      success: CampaignReport,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.post("schedule", "/campaigns/:id/schedule", {
      params: ContactParams,
      payload: CampaignSchedulePayload,
      success: Campaign,
      error: errors,
    }),
  )
  .add(
    HttpApiEndpoint.post("transition", "/campaigns/:id/transition", {
      params: ContactParams,
      payload: CampaignAction,
      success: Campaign,
      error: errors,
    }),
  )
  .prefix("/send")
  .middleware(SendAdmin);
export const SendCampaignApi = HttpApi.make("SendCampaignApi")
  .add(SendCampaignGroup)
  .prefix("/api");
