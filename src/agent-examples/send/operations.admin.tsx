import { useEffect, useState } from "react";
import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import type * as S from "@krak-stack/send/operations.schema";
import {
  SendOperationsAdmin,
  type SendOperationsProps,
} from "@/services/send/client/operations";
import { makeSendOperationsAtoms, operationsQueryKey } from "./operations.atom";
import { sendOperationsMessages } from "./operations.messages";

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
  const [cursors, setCursors] = useState([""]);
  const [selected, setSelected] = useState<string>();
  const resource = atoms.query(
    operationsQueryKey({ view, filters, before: cursors.at(-1) || undefined }),
  );
  const result = useAtomValue(resource.atom);
  const data = Option.getOrUndefined(AsyncResult.value(result));
  const refresh = useAtomRefresh(resource.refresh);
  const add = useAtomSet(atoms.add, { mode: "promise" });
  const remove = useAtomSet(atoms.remove, { mode: "promise" });
  // Refresh only the mounted view. Query retention leaves prior successful data
  // visible while workers and provider feedback advance the authoritative state.
  useEffect(() => {
    const timer = setInterval(refresh, 15_000);
    return () => clearInterval(timer);
  }, [refresh]);
  const m = sendOperationsMessages(locale);
  const common: SendOperationsProps = {
    view,
    filters,
    messages: m,
    ...data,
    pending: AsyncResult.isInitial(result) || AsyncResult.isWaiting(result),
    error: AsyncResult.isFailure(result) ? m.failed : undefined,
    onView: (v) => {
      setView(v);
      setCursors([""]);
      setFilters((f) => ({
        ...f,
        kind: v === "feedback" ? "bounces" : f.kind,
        deliveryId: undefined,
      }));
    },
    onFilters: (f) => {
      setFilters(f);
      setCursors([""]);
    },
    onRefresh: refresh,
    onInspect: setSelected,
    onCloseInspection: () => setSelected(undefined),
    onCampaign,
    onContact,
    onDeliveryFeedback: (id) => {
      setSelected(undefined);
      setView("feedback");
      setCursors([""]);
      setFilters({ deliveryId: id });
    },
    onAddSuppression: add,
    onRemoveSuppression: remove,
    onNext: () => {
      const cursor =
        data?.activity?.nextCursor ??
        data?.feedback?.nextCursor ??
        data?.suppressions?.nextCursor ??
        data?.audit?.nextCursor ??
        data?.recipients?.nextCursor;
      if (cursor) setCursors([...cursors, cursor]);
    },
    onPrevious:
      cursors.length > 1 ? () => setCursors(cursors.slice(0, -1)) : undefined,
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
  const result = useAtomValue(query);
  const refresh = useAtomRefresh(query);
  useEffect(() => {
    const timer = setInterval(refresh, 15_000);
    return () => clearInterval(timer);
  }, [refresh]);
  return (
    <SendOperationsAdmin
      {...common}
      inspecting
      inspection={Option.getOrUndefined(AsyncResult.value(result))}
      error={
        common.error ||
        (AsyncResult.isFailure(result) ? common.messages.failed : undefined)
      }
      onRefresh={() => {
        common.onRefresh();
        refresh();
      }}
    />
  );
};
