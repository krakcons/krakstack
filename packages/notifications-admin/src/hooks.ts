import { useEffect, useState } from "react";
import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, type Atom } from "effect/reactivity";

export interface NotificationQueryResource<A, E> {
  readonly atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>;
  readonly refresh: Atom.Atom<unknown>;
}
export interface NotificationQueryOptions<A> {
  /** Include session/grants, scope, source and view; omit pagination/search. */
  readonly retentionKey: string;
  readonly total?: (data: A) => number | undefined;
  /** Poll only while mounted. Omit to refresh manually. */
  readonly refreshIntervalMillis?: number;
}

/** Retain pagination counts while loading, never across a failed protected read. */
export const useNotificationQuery = <A, E>(
  resource: NotificationQueryResource<A, E>,
  options: NotificationQueryOptions<A>,
) => {
  const result = useAtomValue(resource.atom);
  const failed = AsyncResult.isFailure(result);
  const data = failed
    ? undefined
    : Option.getOrUndefined(AsyncResult.value(result));
  const total = data === undefined ? undefined : options.total?.(data);
  const [previous, setPrevious] = useState({
    key: options.retentionKey,
    total: total ?? 0,
  });
  const retainedTotal = failed
    ? 0
    : (total ?? (previous.key === options.retentionKey ? previous.total : 0));
  if (
    previous.key !== options.retentionKey ||
    previous.total !== retainedTotal
  ) {
    setPrevious({ key: options.retentionKey, total: retainedTotal });
  }
  const refresh = useAtomRefresh(resource.refresh);
  useEffect(() => {
    const interval = options.refreshIntervalMillis;
    if (interval === undefined || interval <= 0) return;
    const timer = setInterval(refresh, interval);
    return () => clearInterval(timer);
  }, [refresh, options.refreshIntervalMillis]);
  return {
    result,
    data,
    total: retainedTotal,
    failed,
    refresh,
    pending: AsyncResult.isInitial(result) || AsyncResult.isWaiting(result),
  };
};
