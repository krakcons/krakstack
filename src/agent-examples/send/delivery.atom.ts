import { Schema } from "effect";
import { Atom, AtomHttpApi, AsyncResult } from "effect/reactivity";
import { FetchHttpClient } from "effect/http";
import { DeliveryAdminApi } from "@krak-stack/notifications/admin/delivery.api";
import {
  DeliverySelection,
  type DeliveryOverview,
  type AdminDeliveryPage,
} from "@krak-stack/notifications/admin/delivery.schema";
import { NotificationScope } from "@krak-stack/notifications/schema";
import { TableState } from "@krak-stack/notifications/admin/table.schema";

const Key = Schema.Struct({
  view: Schema.Literals(["overview", "activity"]),
  source: DeliverySelection.fields.source,
  scope: Schema.optional(NotificationScope),
  table: TableState,
}).annotate({ identifier: "StaffDeliveryQueryKey" });
const Codec = Schema.fromJsonString(Key);
export const deliveryQueryKey = Schema.encodeSync(Codec);
const InspectionKey = Schema.fromJsonString(
  Schema.Struct({ id: Schema.String, queryKey: Schema.String }).annotate({
    identifier: "StaffDeliveryInspectionKey",
  }),
);
export const deliveryInspectionKey = Schema.encodeSync(InspectionKey);
interface Data {
  readonly overview?: typeof DeliveryOverview.Type;
  readonly activity?: typeof AdminDeliveryPage.Type;
}
interface Resource {
  readonly atom: Atom.Atom<AsyncResult.AsyncResult<Data, unknown>>;
  readonly refresh: Atom.Atom<unknown>;
}

// Recreate with a new non-secret authorizationKey whenever the host session or
// grants change. It partitions cached data; it is NOT authorization evidence.
export const makeNotificationDeliveryAtoms = (options: {
  baseUrl: string;
  authorizationKey: string;
  scope?: NotificationScope;
}) => {
  class Client extends AtomHttpApi.Service<Client>()(
    `host/NotificationDeliveryAdmin/${options.authorizationKey}`,
    {
      api: DeliveryAdminApi,
      baseUrl: options.baseUrl,
      httpClient: FetchHttpClient.layer,
    },
  ) {}
  const reactivityKeys = [`notification.staff.${options.authorizationKey}`];
  const query = Atom.family((key: string): Resource => {
    const { table, view, ...selection } = Schema.decodeSync(Codec)(key);
    const common = { reactivityKeys, timeToLive: "10 seconds" as const };
    if (view === "overview") {
      const atom = Client.query("notificationDeliveries", "overview", {
        query: selection,
        ...common,
      });
      return {
        atom: Atom.map(Atom.optimistic(atom), (result) =>
          AsyncResult.map(result, (overview): Data => ({ overview })),
        ),
        refresh: atom,
      };
    }
    const atom = Client.query("notificationDeliveries", "activityTable", {
      query: { ...selection, table },
      ...common,
    });
    return {
      atom: Atom.map(Atom.optimistic(atom), (result) =>
        AsyncResult.map(result, (activity): Data => ({ activity })),
      ),
      refresh: atom,
    };
  });
  const inspection = Atom.family((key: string) => {
    const { id, queryKey } = Schema.decodeSync(InspectionKey)(key);
    const selection = Schema.decodeSync(Codec)(queryKey);
    return Atom.optimistic(
      Client.query("notificationDeliveries", "inspect", {
        params: { id },
        query: { source: selection.source, scope: selection.scope },
        reactivityKeys,
        timeToLive: "10 seconds",
      }),
    );
  });
  return {
    query,
    inspection,
    authorizationKey: options.authorizationKey,
    scope: options.scope,
  };
};
