import { useState } from "react";
import { useAtomSet } from "@effect/atom-react";
import type * as S from "@krak-stack/notifications/admin/operations.schema";
import {
  initialTableState,
  type TableState,
} from "@krak-stack/notifications/admin/table.schema";
import {
  SendOperationsAdmin,
  type SendOperationsProps,
} from "@krak-stack/notifications-admin/operations";
import { makeSendOperationsAtoms, operationsQueryKey } from "./operations.atom";
import { sendOperationsMessages } from "./operations.messages";
import { useNotificationQuery } from "@krak-stack/notifications-admin/hooks";

type Atoms = ReturnType<typeof makeSendOperationsAtoms>;
export const SendOperationsPanel = ({
  atoms,
  locale,
  initialView = "overview",
  initialFilters = {},
  onCampaign,
  onContact,
}: {
  atoms: Atoms;
  locale: "en" | "fr";
  initialView?: typeof S.OperationsView.Type;
  initialFilters?: typeof S.OperationsFilters.Type;
  onCampaign?: (id: string) => void;
  onContact?: (id: string) => void;
}) => {
  const [view, setView] = useState(initialView);
  const [filters, setFilters] = useState(initialFilters);
  const [table, setTable] = useState<typeof TableState.Type>(initialTableState);
  const [selected, setSelected] = useState<string>();
  const resource = atoms.query(operationsQueryKey({ view, filters, table }));
  const { data, total, refresh, pending, failed } = useNotificationQuery(
    resource,
    {
      retentionKey: JSON.stringify([atoms.authorizationKey, view]),
      total: (data) => data.total,
      refreshIntervalMillis: 15_000,
    },
  );
  const add = useAtomSet(atoms.add, { mode: "promise" });
  const remove = useAtomSet(atoms.remove, { mode: "promise" });
  const m = sendOperationsMessages(locale);
  const common: SendOperationsProps = {
    view,
    filters,
    messages: m,
    ...data,
    total,
    tableState: table,
    onTableStateChange: setTable,
    pending,
    error: failed ? m.failed : undefined,
    onView: (v) => {
      setView(v);
      setTable(initialTableState);
      setFilters((f) => ({
        ...f,
        deliveryId: undefined,
      }));
    },
    onFilters: (f) => {
      setFilters(f);
      setTable(initialTableState);
    },
    onRefresh: refresh,
    onInspect: setSelected,
    onCloseInspection: () => setSelected(undefined),
    onCampaign,
    onContact,
    onDeliveryFeedback: (id) => {
      setSelected(undefined);
      setView("feedback");
      setTable(initialTableState);
      setFilters({ deliveryId: id });
    },
    onAddSuppression: add,
    onRemoveSuppression: remove,
  };
  return selected ? (
    <Inspection key={selected} atoms={atoms} id={selected} common={common} />
  ) : (
    <SendOperationsAdmin {...common} />
  );
};
const Inspection = ({
  atoms,
  id,
  common,
}: {
  atoms: Atoms;
  id: string;
  common: SendOperationsProps;
}) => {
  const query = atoms.inspection(id);
  const { data, failed, refresh } = useNotificationQuery(
    { atom: query, refresh: query },
    {
      retentionKey: JSON.stringify([atoms.authorizationKey, id]),
      refreshIntervalMillis: 15_000,
    },
  );
  return (
    <SendOperationsAdmin
      {...common}
      inspecting
      inspection={data}
      error={common.error || (failed ? common.messages.failed : undefined)}
      onRefresh={() => {
        common.onRefresh();
        refresh();
      }}
    />
  );
};
