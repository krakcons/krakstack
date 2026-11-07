import { useEffect, useState } from "react";
import { useAtomValue, useAtomRefresh } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { Option } from "effect";
import type * as S from "@krak-stack/notifications/admin/delivery.schema";
import {
  initialTableState,
  type TableState,
} from "@krak-stack/notifications/admin/table.schema";
import {
  NotificationDeliveries,
  type NotificationDeliveriesProps,
} from "@krak-stack/notifications-admin/deliveries";
import {
  makeNotificationDeliveryAtoms,
  deliveryQueryKey,
  deliveryInspectionKey,
} from "./delivery.atom";
import { notificationDeliveryMessages } from "./delivery.messages";
import { useTableTotal } from "./table";

type Atoms = ReturnType<typeof makeNotificationDeliveryAtoms>;
export const NotificationDeliveriesPanel = (props: {
  atoms: Atoms;
  locale: "en" | "fr";
  onContact?: (id: string) => void;
  onCampaign?: (id: string) => void;
}) => {
  const [source, setSource] = useState<typeof S.DeliverySource.Type>("all");
  // Never retain old totals, inspection, or rows across source/scope/session changes.
  return (
    <DeliverySelectionPanel
      key={JSON.stringify([
        props.atoms.authorizationKey,
        props.atoms.scope,
        source,
      ])}
      {...props}
      source={source}
      onSource={setSource}
    />
  );
};
const DeliverySelectionPanel = ({
  atoms,
  locale,
  source,
  onSource,
  onContact,
  onCampaign,
}: {
  atoms: Atoms;
  locale: "en" | "fr";
  source: typeof S.DeliverySource.Type;
  onSource: (source: typeof S.DeliverySource.Type) => void;
  onContact?: (id: string) => void;
  onCampaign?: (id: string) => void;
}) => {
  const [view, setView] = useState<"overview" | "activity">("overview");
  const [table, setTable] = useState<typeof TableState.Type>(initialTableState);
  const [selected, setSelected] = useState<string>();
  const key = deliveryQueryKey({ view, source, scope: atoms.scope, table });
  const resource = atoms.query(key);
  // Only the mounted view is subscribed and refreshed.
  const result = useAtomValue(resource.atom);
  const data = AsyncResult.isFailure(result)
    ? undefined
    : Option.getOrUndefined(AsyncResult.value(result));
  const overview = data?.overview;
  const activity = data?.activity;
  const total = useTableTotal(activity?.total);
  const refresh = useAtomRefresh(resource.refresh);
  useEffect(() => {
    const timer = setInterval(refresh, 15_000);
    return () => clearInterval(timer);
  }, [refresh]);
  const messages = notificationDeliveryMessages(locale);
  const common: NotificationDeliveriesProps = {
    messages,
    source,
    onSource,
    view,
    onView: setView,
    overview,
    activity,
    table,
    onTable: setTable,
    total: AsyncResult.isFailure(result) ? 0 : total,
    pending: AsyncResult.isInitial(result) || AsyncResult.isWaiting(result),
    error: AsyncResult.isFailure(result) ? messages.common.failed : undefined,
    inspecting: !!selected,
    onInspect: setSelected,
    onRefresh: refresh,
    onContact,
    onCampaign,
  };
  return selected ? (
    <Inspection
      key={selected}
      atoms={atoms}
      id={selected}
      queryKey={key}
      common={common}
    />
  ) : (
    <NotificationDeliveries {...common} />
  );
};
const Inspection = ({
  atoms,
  id,
  queryKey,
  common,
}: {
  atoms: Atoms;
  id: string;
  queryKey: string;
  common: NotificationDeliveriesProps;
}) => {
  const atom = atoms.inspection(deliveryInspectionKey({ id, queryKey }));
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  useEffect(() => {
    const timer = setInterval(refresh, 15_000);
    return () => clearInterval(timer);
  }, [refresh]);
  return (
    <NotificationDeliveries
      {...common}
      inspection={
        common.error || AsyncResult.isFailure(result)
          ? undefined
          : Option.getOrUndefined(AsyncResult.value(result))
      }
      inspectionError={
        common.error ??
        (AsyncResult.isFailure(result)
          ? common.messages.common.failed
          : undefined)
      }
      onRefresh={() => {
        common.onRefresh();
        refresh();
      }}
    />
  );
};
