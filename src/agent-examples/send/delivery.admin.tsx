import { useState } from "react";
import type * as S from "@krak-stack/notifications/admin/delivery.schema";
import {
  initialTableState,
  type TableState,
} from "@krak-stack/notifications/admin/table.schema";
import {
  NotificationDeliveries,
  NotificationDeliveryDetails,
  type NotificationDeliveriesProps,
} from "@krak-stack/notifications-admin/deliveries";
import {
  makeNotificationDeliveryAtoms,
  deliveryQueryKey,
  deliveryInspectionKey,
} from "./delivery.atom";
import { sendOperationsMessages } from "./operations.messages";
import { useNotificationQuery } from "@krak-stack/notifications-admin/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const { data, total, refresh, pending, failed } = useNotificationQuery(
    resource,
    {
      retentionKey: JSON.stringify([
        atoms.authorizationKey,
        atoms.scope,
        source,
        view,
      ]),
      total: (data) => data.activity?.total,
      refreshIntervalMillis: 15_000,
    },
  );
  const overview = data?.overview;
  const activity = data?.activity;
  const messages = sendOperationsMessages(locale);
  const common: NotificationDeliveriesProps = {
    source,
    onSource,
    view,
    onView: setView,
    overview,
    activity,
    table,
    onTable: setTable,
    total,
    pending,
    error: failed ? messages.failed : undefined,
    inspecting: !!selected,
    onInspect: setSelected,
    onRefresh: refresh,
    onContact,
    onCampaign,
  };
  return (
    <>
      <NotificationDeliveries {...common} inspecting={false} />
      {selected && (
        <Inspection
          key={selected}
          atoms={atoms}
          id={selected}
          locale={locale}
          queryKey={key}
          common={common}
        />
      )}
    </>
  );
};
const Inspection = ({
  atoms,
  id,
  locale,
  queryKey,
  common,
}: {
  atoms: Atoms;
  id: string;
  locale: "en" | "fr";
  queryKey: string;
  common: NotificationDeliveriesProps;
}) => {
  const atom = atoms.inspection(deliveryInspectionKey({ id, queryKey }));
  const { data, failed, refresh } = useNotificationQuery(
    { atom, refresh: atom },
    {
      retentionKey: JSON.stringify([atoms.authorizationKey, atoms.scope, id]),
      refreshIntervalMillis: 15_000,
    },
  );
  const messages = sendOperationsMessages(locale);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) common.onInspect(undefined);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{messages.inspect}</DialogTitle>
        </DialogHeader>
        <NotificationDeliveryDetails
          inspection={data}
          error={common.error ?? (failed ? messages.failed : undefined)}
          onContact={common.onContact}
          onCampaign={common.onCampaign}
        />
        <Button
          variant="outline"
          onClick={() => {
            common.onRefresh();
            refresh();
          }}
        >
          {messages.refresh}
        </Button>
        <Button variant="outline" onClick={() => common.onInspect(undefined)}>
          {messages.close}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
