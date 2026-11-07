import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option, Schema } from "effect";
import {
  TableState,
  initialTableState,
} from "@krak-stack/notifications/admin/table.schema";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useState } from "react";
import { SendCampaignAdmin } from "@/services/send/client/campaigns";
import { sendCampaignMessages } from "./campaign.messages";
import type { makeSendCampaignAtoms } from "./campaign.atom";
import { useTableTotal } from "./table";

type Atoms = ReturnType<typeof makeSendCampaignAtoms>;
// Deliberately not mounted on the documentation site. The host must protect
// both this panel's route and every SendAdmin endpoint.
export const SendCampaignPanel = ({
  atoms,
  locale,
  initialSelected,
  onRecipients,
}: {
  atoms: Atoms;
  locale: "en" | "fr";
  initialSelected?: string;
  onRecipients?: (id: string) => void;
}) => {
  const [table, setTable] = useState<typeof TableState.Type>(initialTableState);
  const tableKey = Schema.encodeSync(Schema.fromJsonString(TableState))(table);
  const [selected, setSelected] = useState(initialSelected);
  const result = useAtomValue(atoms.campaigns(tableKey));
  const refresh = useAtomRefresh(atoms.campaigns(tableKey));
  useEffect(() => {
    const timer = setInterval(refresh, 15_000);
    return () => clearInterval(timer);
  }, [refresh]);
  const page = Option.getOrUndefined(AsyncResult.value(result));
  const total = useTableTotal(page?.total);
  const create = useAtomSet(atoms.create, { mode: "promise" });
  const messages = sendCampaignMessages(locale);
  const common = {
    page,
    table: {
      state: table,
      onStateChange: setTable,
      features: {
        pagination: { mode: "server" as const, rowCount: total },
        refresh,
      },
    },
    messages,
    pending: AsyncResult.isInitial(result) || AsyncResult.isWaiting(result),
    error: AsyncResult.isFailure(result) ? messages.failed : undefined,
    onCreate: create,
    onSelect: (value: { id: string }) => setSelected(value.id),
    onClose: () => setSelected(undefined),
    onRecipients,
  };
  return selected ? (
    <CampaignDetail
      key={selected}
      atoms={atoms}
      id={selected}
      common={common}
    />
  ) : (
    <SendCampaignAdmin
      {...common}
      onSchedule={async () => {}}
      onTransition={async () => {}}
    />
  );
};

const CampaignDetail = ({
  atoms,
  id,
  common,
}: {
  atoms: Atoms;
  id: string;
  common: Omit<
    React.ComponentProps<typeof SendCampaignAdmin>,
    "onSchedule" | "onTransition"
  >;
}) => {
  const result = useAtomValue(atoms.campaign(id));
  const report = useAtomValue(atoms.report(id));
  const refresh = useAtomRefresh(atoms.campaign(id));
  const refreshReport = useAtomRefresh(atoms.report(id));
  useEffect(() => {
    const timer = setInterval(() => {
      refresh();
      refreshReport();
    }, 15_000);
    return () => clearInterval(timer);
  }, [refresh, refreshReport]);
  const schedule = useAtomSet(atoms.schedule, { mode: "promise" });
  const transition = useAtomSet(atoms.transition(id), { mode: "promise" });
  const cancel = useAtomSet(atoms.cancel, { mode: "promise" });
  return (
    <SendCampaignAdmin
      {...common}
      selected={Option.getOrUndefined(AsyncResult.value(result))}
      report={Option.getOrUndefined(AsyncResult.value(report))}
      error={
        common.error ||
        (AsyncResult.isFailure(result) || AsyncResult.isFailure(report)
          ? common.messages.failed
          : undefined)
      }
      pending={common.pending || AsyncResult.isWaiting(result)}
      onSchedule={schedule}
      onTransition={(input) =>
        input.action === "cancel" ? cancel(id) : transition(input.action)
      }
    />
  );
};
