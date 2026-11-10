// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { AsyncActionButton } from "./async-action-button";

afterEach(cleanup);

describe("AsyncActionButton", () => {
  it("locks immediately until the action settles and never submits a form", async () => {
    const task = Promise.withResolvers<void>();
    const action = vi.fn(() => task.promise);
    const pending = vi.fn();
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <AsyncActionButton onAction={action} onPendingChange={pending}>
          Save
        </AsyncActionButton>
      </form>,
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.getByRole("button").getAttribute("aria-busy")).toBe("true");
    await act(async () => task.resolve());
    expect(screen.getByRole("button", { name: "Completed" })).toBeTruthy();
    expect(pending.mock.calls).toEqual([[true], [false]]);
    expect(submit).not.toHaveBeenCalled();
  });

  it("keeps raw failures private and permits an explicit retry", async () => {
    const action = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("private signed URL"))
      .mockResolvedValue(undefined);
    render(
      <AsyncActionButton onAction={action} locale="fr-CA">
        Enregistrer
      </AsyncActionButton>,
    );
    fireEvent.click(screen.getByRole("button"));
    const retry = await screen.findByRole("button", { name: "Réessayer" });
    expect(screen.queryByText(/private signed URL/)).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("échoué");
    fireEvent.click(retry);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    await screen.findByRole("button", { name: "Terminé" });
  });

  it("pairs pending notifications even when the action unmounts its button", async () => {
    const task = Promise.withResolvers<void>();
    const pending = vi.fn();
    const { unmount } = render(
      <AsyncActionButton
        onAction={() => task.promise}
        onPendingChange={pending}
      >
        Run
      </AsyncActionButton>,
    );
    fireEvent.click(screen.getByRole("button"));
    unmount();
    await act(async () => task.resolve());
    expect(pending.mock.calls).toEqual([[true], [false]]);
  });
});
