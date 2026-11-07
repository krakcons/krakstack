import { Atom, AtomHttpApi, AsyncResult } from "effect/reactivity";
import { FetchHttpClient } from "effect/http";
import { SendCampaignApi } from "@krak-stack/notifications/admin/campaign.api";
import { Schema } from "effect";
import {
  TableState,
  initialTableState,
} from "@krak-stack/notifications/admin/table.schema";
import type {
  CampaignTransition,
  CreateCampaign,
  ScheduleCampaign,
} from "@krak-stack/notifications/admin/schema";

// Construct once inside the host's authenticated application. Add host-owned
// HttpClient authentication/CSRF middleware; no KrakAuth dependency is required.
export const makeSendCampaignAtoms = (baseUrl: string) => {
  class Client extends AtomHttpApi.Service<Client>()(
    "example/SendCampaignClient",
    {
      api: SendCampaignApi,
      baseUrl,
      httpClient: FetchHttpClient.layer,
    },
  ) {}
  const key = "kraksend.campaigns";
  const campaigns = Atom.family((after: string) =>
    Atom.optimistic(
      Atom.map(
        Client.query("sendCampaigns", "table", {
          query: {
            table: after
              ? Schema.decodeSync(Schema.fromJsonString(TableState))(after)
              : initialTableState,
          },
          timeToLive: "10 seconds",
          reactivityKeys: [key],
        }),
        (result) =>
          AsyncResult.map(result, (page) => ({ ...page, nextCursor: null })),
      ),
    ),
  );
  const campaign = Atom.family((id: string) =>
    Atom.optimistic(
      Client.query("sendCampaigns", "get", {
        params: { id },
        timeToLive: "10 seconds",
        reactivityKeys: [key],
      }),
    ),
  );
  const report = Atom.family((id: string) =>
    Atom.optimistic(
      Client.query("sendCampaigns", "report", {
        params: { id },
        timeToLive: "10 seconds",
        reactivityKeys: [key],
      }),
    ),
  );
  const createMutation = Client.mutation("sendCampaigns", "create");
  const scheduleMutation = Client.mutation("sendCampaigns", "schedule");
  const transitionMutation = Client.mutation("sendCampaigns", "transition");
  // Creation assigns IDs; scheduling snapshots the audience; cancellation has
  // worker-side effects. Wait for authoritative results for these operations.
  const create = Atom.fn((payload: typeof CreateCampaign.Type, get) =>
    get.setResult(createMutation, { payload, reactivityKeys: [key] }),
  );
  const schedule = Atom.fn((input: typeof ScheduleCampaign.Type, get) =>
    get.setResult(scheduleMutation, {
      params: { id: input.id },
      payload: { scheduledFor: input.scheduledFor },
      reactivityKeys: [key],
    }),
  );
  const cancel = Atom.fn((id: string, get) =>
    get.setResult(transitionMutation, {
      params: { id },
      payload: { action: "cancel" },
      reactivityKeys: [key],
    }),
  );
  // Scope optimism to one explicit detail query, never guessed paginated pages.
  const transition = Atom.family((id: string) =>
    Atom.optimisticFn(campaign(id), {
      reducer: (
        state,
        action: Exclude<(typeof CampaignTransition.Type)["action"], "cancel">,
      ) =>
        AsyncResult.map(state, (value) => ({
          ...value,
          status: action === "pause" ? "paused" : "scheduled",
        })),
      fn: Atom.fn(
        (
          action: Exclude<(typeof CampaignTransition.Type)["action"], "cancel">,
          get,
        ) =>
          get.setResult(transitionMutation, {
            params: { id },
            payload: { action },
            reactivityKeys: [key],
          }),
      ),
    }),
  );
  return { campaigns, campaign, report, create, schedule, cancel, transition };
};
