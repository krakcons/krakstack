// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useAtomSet } from "@effect/atom-react";
import { Option } from "effect";
import { Atom, AsyncResult } from "effect/reactivity";
import { useNotificationQuery } from "./hooks.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("notification query lifecycle", () => {
  it("retains counts across pages but clears data and counts on failure or a new selection", () => {
    const success = AsyncResult.success<
      { total: number; email: string },
      string
    >({
      total: 80,
      email: "private@example.com",
    });
    const atom =
      Atom.make<AsyncResult.AsyncResult<typeof success.value, string>>(success);
    const resource = { atom, refresh: atom };
    const { result, rerender } = renderHook(
      ({ key }) => ({
        query: useNotificationQuery(resource, {
          retentionKey: key,
          total: (value) => value.total,
        }),
        set: useAtomSet(atom),
      }),
      { initialProps: { key: "session-1:all:activity" } },
    );
    expect(result.current.query.total).toBe(80);
    act(() => result.current.set(AsyncResult.initial(true)));
    expect(result.current.query.total).toBe(80);
    expect(result.current.query.pending).toBe(true);
    act(() =>
      result.current.set(
        AsyncResult.fail("Denied", {
          previousSuccess: Option.some(success),
        }),
      ),
    );
    expect(result.current.query.data).toBeUndefined();
    expect(result.current.query.total).toBe(0);
    expect(result.current.query.failed).toBe(true);
    act(() => result.current.set(AsyncResult.initial(true)));
    expect(result.current.query.total).toBe(0);
    act(() => result.current.set(success));
    act(() => result.current.set(AsyncResult.initial(true)));
    rerender({ key: "session-2:all:activity" });
    expect(result.current.query.total).toBe(0);
  });

  it("polls only while mounted and stops when polling is disabled", async () => {
    vi.useFakeTimers();
    let reads = 0;
    const atom = Atom.make(() => AsyncResult.success({ total: ++reads }));
    const { result, rerender, unmount } = renderHook(
      ({ interval }) =>
        useNotificationQuery(
          { atom, refresh: atom },
          {
            retentionKey: "session-1",
            total: (value) => value.total,
            refreshIntervalMillis: interval,
          },
        ),
      { initialProps: { interval: 1000 } },
    );
    expect(result.current.total).toBe(1);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(result.current.total).toBe(3);
    rerender({ interval: 0 });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(reads).toBe(3);
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(reads).toBe(3);
  });
});
