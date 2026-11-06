import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { SendCampaignAdmin } from "@/services/send/client/campaigns";
import { sendCampaignMessages } from "./campaign.messages";
import type { makeSendCampaignAtoms } from "./campaign.atom";

type Atoms = ReturnType<typeof makeSendCampaignAtoms>;
// Deliberately not mounted on the documentation site. The host must protect
// both this panel's route and every SendAdmin endpoint.
export const SendCampaignPanel = ({
  atoms,
  locale,
}: {
  atoms: Atoms;
  locale: "en" | "fr";
}) => {
  const [cursors, setCursors] = useState([""]);
  const [selected, setSelected] = useState<string>();
  const result = useAtomValue(atoms.campaigns(cursors.at(-1) ?? ""));
  const page = Option.getOrUndefined(AsyncResult.value(result));
  const create = useAtomSet(atoms.create, { mode: "promise" });
  const messages = sendCampaignMessages(locale);
  const common = {
    page,
    messages,
    pending: AsyncResult.isInitial(result) || AsyncResult.isWaiting(result),
    error: AsyncResult.isFailure(result) ? messages.failed : undefined,
    onCreate: create,
    onSelect: (value: { id: string }) => setSelected(value.id),
    onClose: () => setSelected(undefined),
    onNext: () => {
      if (page?.nextCursor) setCursors([...cursors, page.nextCursor]);
    },
    onPrevious:
      cursors.length > 1 ? () => setCursors(cursors.slice(0, -1)) : undefined,
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
