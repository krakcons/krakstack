// Host-authorized notification campaign handlers.
import { Effect, Layer } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/http-api";
import { CurrentSendAdmin } from "./api.js";
import { SendCampaignApi } from "./campaign.api.js";
import { SendCampaigns } from "./campaign.js";
import { SendStorageError } from "./schema.js";
const redact = <A, E, R>(effect: Effect.Effect<A, E | SendStorageError, R>) =>
  Effect.catchTag(effect, "SendStorageError", () =>
    Effect.fail(new HttpApiError.InternalServerError({})),
  );
export const sendCampaignHandlers = HttpApiBuilder.group(
  SendCampaignApi,
  "sendCampaigns",
  Effect.fn(function* (handlers) {
    const campaigns = yield* SendCampaigns;
    return handlers
      .handle("table", ({ query }) => campaigns.table(query.table).pipe(redact))
      .handle("list", ({ query }) => campaigns.list(query).pipe(redact))
      .handle("get", ({ params }) => campaigns.get(params).pipe(redact))
      .handle("report", ({ params }) => campaigns.report(params).pipe(redact))
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const admin = yield* CurrentSendAdmin;
          return yield* campaigns.create({ payload, actor: admin.reference });
        }).pipe(redact),
      )
      .handle("schedule", ({ params, payload }) =>
        campaigns.schedule({ id: params.id, ...payload }).pipe(redact),
      )
      .handle("transition", ({ params, payload }) =>
        campaigns.transition({ id: params.id, ...payload }).pipe(redact),
      );
  }),
);
export const sendCampaignRoutes = HttpApiBuilder.layer(SendCampaignApi).pipe(
  Layer.provide(sendCampaignHandlers),
);
