import { Schema } from "effect";
import { Atom, AtomHttpApi, AsyncResult } from "effect/reactivity";
import { FetchHttpClient } from "effect/http";
import { SendOperationsApi } from "@krak-stack/send/operations.api";
import * as S from "@krak-stack/send/operations.schema";

export const OperationsQueryKey = Schema.Struct({
  view: S.OperationsView,
  filters: S.OperationsFilters,
  before: Schema.optional(Schema.String),
}).annotate({ identifier: "SendOperationsQueryKey" });
const KeyCodec = Schema.fromJsonString(OperationsQueryKey);
export const operationsQueryKey = Schema.encodeSync(KeyCodec);
export interface OperationsData {
  readonly overview?: typeof S.SendingOverview.Type;
  readonly activity?: typeof S.ActivityPage.Type;
  readonly feedback?: typeof S.FeedbackPage.Type;
  readonly suppressions?: typeof S.SuppressionPage.Type;
  readonly audit?: typeof S.SuppressionAuditPage.Type;
  readonly recipients?: typeof S.RecipientPage.Type;
}
interface Resource {
  readonly atom: Atom.Atom<AsyncResult.AsyncResult<OperationsData, unknown>>;
  readonly refresh: Atom.Atom<unknown>;
}
const retain = <A, E>(
  source: Atom.Atom<AsyncResult.AsyncResult<A, E>>,
  map: (value: A) => OperationsData,
): Resource => ({
  atom: Atom.map(Atom.optimistic(source), (result) =>
    AsyncResult.map(result, map),
  ),
  refresh: source,
});

// Construct once per host with its trusted origin and authenticated/CSRF-aware
// HttpClient. No host credentials are stored in component props or URL filters.
export const makeSendOperationsAtoms = (baseUrl: string) => {
  class Client extends AtomHttpApi.Service<Client>()(
    "example/SendOperationsClient",
    { api: SendOperationsApi, baseUrl, httpClient: FetchHttpClient.layer },
  ) {}
  const reactivityKeys = ["kraksend.operations"];
  const query = Atom.family((key: string): Resource => {
    const { view, filters: f, before } = Schema.decodeSync(KeyCodec)(key);
    const common = {
      search: f.search,
      since: f.since,
      until: f.until,
      before,
      limit: 25,
    };
    switch (view) {
      case "overview":
        return retain(
          Client.query("sendOperations", "overview", {
            query: { since: f.since, until: f.until },
            reactivityKeys,
            timeToLive: "10 seconds",
          }),
          (overview) => ({ overview }),
        );
      case "activity":
        return retain(
          Client.query("sendOperations", "activity", {
            query: {
              ...common,
              status: f.status,
              campaignId: f.campaignId,
              contactId: f.contactId,
            },
            reactivityKeys,
            timeToLive: "10 seconds",
          }),
          (activity) => ({ activity }),
        );
      case "feedback":
        return retain(
          Client.query("sendOperations", "feedback", {
            query: {
              ...common,
              kind: f.kind,
              correlation: f.correlation,
              deliveryId: f.deliveryId,
            },
            reactivityKeys,
            timeToLive: "10 seconds",
          }),
          (feedback) => ({ feedback }),
        );
      case "suppressions":
        return retain(
          Client.query("sendOperations", "suppressions", {
            query: { ...common, state: f.state },
            reactivityKeys,
            timeToLive: "10 seconds",
          }),
          (suppressions) => ({ suppressions }),
        );
      case "audit":
        return retain(
          Client.query("sendOperations", "audit", {
            query: common,
            reactivityKeys,
            timeToLive: "10 seconds",
          }),
          (audit) => ({ audit }),
        );
      case "recipients":
        return f.campaignId
          ? retain(
              Client.query("sendOperations", "recipients", {
                query: {
                  ...common,
                  campaignId: f.campaignId,
                  status: f.recipientStatus,
                },
                reactivityKeys,
                timeToLive: "10 seconds",
              }),
              (recipients) => ({ recipients }),
            )
          : {
              atom: Atom.make(AsyncResult.success({})),
              refresh: Atom.make(undefined),
            };
    }
  });
  const inspection = Atom.family((id: string) =>
    Atom.optimistic(
      Client.query("sendOperations", "inspect", {
        params: { id },
        reactivityKeys,
        timeToLive: "10 seconds",
      }),
    ),
  );
  const addMutation = Client.mutation("sendOperations", "addSuppression");
  const removeMutation = Client.mutation("sendOperations", "removeSuppression");
  // Safety-critical blocks/unblocks and server audit records are authoritative:
  // never optimistically claim success, restore consent, or retry a delivery.
  const add = Atom.fn((payload: typeof S.AddSuppression.Type, get) =>
    get.setResult(addMutation, {
      payload,
      reactivityKeys: [...reactivityKeys, "kraksend.campaigns"],
    }),
  );
  const remove = Atom.fn(
    (input: { id: string; payload: typeof S.RemoveSuppression.Type }, get) =>
      get.setResult(removeMutation, {
        params: { id: input.id },
        payload: input.payload,
        reactivityKeys: [...reactivityKeys, "kraksend.campaigns"],
      }),
  );
  return { query, inspection, add, remove };
};
