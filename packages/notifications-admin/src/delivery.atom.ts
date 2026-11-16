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
import type { NotificationAdminClientOptions } from "./client-options.js";

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

// Recreate with a new non-secret authorizationKey whenever the host session or
// grants change. It partitions cached data; it is NOT authorization evidence.
export interface NotificationDeliveryAtomOptions extends NotificationAdminClientOptions {
  readonly scope?: NotificationScope;
}
export const makeNotificationDeliveryAtoms = (
  options: NotificationDeliveryAtomOptions,
) => {
  const scope =
    options.scope === undefined
      ? undefined
      : Schema.decodeSync(NotificationScope)(options.scope);
  const authorizationKey = Schema.decodeSync(Schema.NonEmptyString)(
    options.authorizationKey,
  );
  const identity = JSON.stringify([
    options.baseUrl,
    authorizationKey,
    scope ?? null,
  ]);
  const selection = (key: string) => {
    const selected = Schema.decodeSync(
      Key.check(
        Schema.makeFilter(
          (selected) =>
            scope === undefined ||
            selected.scope === undefined ||
            (scope.recipientUserId === selected.scope.recipientUserId &&
              scope.organizationId === selected.scope.organizationId &&
              scope.workspaceId === selected.scope.workspaceId) ||
            "Query scope conflicts with the configured delivery scope",
        ),
      ).annotate({ identifier: "ScopedStaffDeliveryQueryKey" }),
    )(Schema.decodeSync(Codec)(key));
    return { source: selected.source, scope: scope ?? selected.scope };
  };
  class Client extends AtomHttpApi.Service<Client>()(
    `host/NotificationDeliveryAdmin/${identity}`,
    {
      api: DeliveryAdminApi,
      baseUrl: options.baseUrl,
      httpClient: options.httpClient ?? FetchHttpClient.layer,
    },
  ) {}
  const reactivityKeys = [`notification.staff.${identity}`];
  const query = Atom.family((key: string) => {
    const { table, view } = Schema.decodeSync(Codec)(key);
    const selected = selection(key);
    const common = { reactivityKeys, timeToLive: "10 seconds" as const };
    if (view === "overview") {
      const atom = Client.query("notificationDeliveries", "overview", {
        query: selected,
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
      query: { ...selected, table },
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
    const selected = selection(queryKey);
    return Atom.optimistic(
      Client.query("notificationDeliveries", "inspect", {
        params: { id },
        query: selected,
        reactivityKeys,
        timeToLive: "10 seconds",
      }),
    );
  });
  return {
    query,
    inspection,
    authorizationKey,
    scope,
  };
};
