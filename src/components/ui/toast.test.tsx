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
import { ToastProvider, createToastManager, useToast } from "./toast";

afterEach(cleanup);
describe("Toast", () => {
  it("adds from a hook, updates in place and dismisses accessibly", async () => {
    const Trigger = () => {
      const toast = useToast();
      return (
        <>
          <button
            onClick={() =>
              toast.add({
                id: "save",
                title: "Saving",
                type: "loading",
                timeout: 0,
              })
            }
          >
            Save
          </button>
          <button
            onClick={() =>
              toast.update("save", {
                title: "Saved",
                description: "Your changes are safe.",
                type: "success",
              })
            }
          >
            Complete
          </button>
        </>
      );
    };
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("dialog", { name: "Saving" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    expect(await screen.findByRole("dialog", { name: "Saved" })).toBeTruthy();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    fireEvent.focus(screen.getByRole("region", { name: "Notifications" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("localizes accessible controls and supports host message overrides", async () => {
    const manager = createToastManager();
    render(
      <ToastProvider
        toastManager={manager}
        locale="fr-CA"
        messages={{ "fr-CA": { notifications: "Messages de l’application" } }}
      />,
    );
    act(() => {
      manager.add({ title: "Enregistré", timeout: 0 });
    });
    expect(
      await screen.findByRole("dialog", { name: "Enregistré" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "Messages de l’application" }),
    ).toBeTruthy();
    fireEvent.focus(
      screen.getByRole("region", { name: "Messages de l’application" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Fermer la notification" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("keeps actions application-owned without rendering raw HTML", async () => {
    const manager = createToastManager();
    const undo = vi.fn(() => manager.close("undo"));
    render(<ToastProvider toastManager={manager} />);
    act(() => {
      manager.add({
        id: "undo",
        title: "<script>not markup</script>",
        timeout: 0,
        actionProps: { children: "Undo", onClick: undo },
      });
    });
    expect(await screen.findByText("<script>not markup</script>")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("isolates providers and closes only the selected manager’s toasts", async () => {
    const first = createToastManager();
    const second = createToastManager();
    render(
      <>
        <ToastProvider toastManager={first} />
        <ToastProvider toastManager={second} />
      </>,
    );
    act(() => {
      first.add({ title: "First", timeout: 0 });
      second.add({ title: "Second", timeout: 0 });
    });
    expect(await screen.findByRole("dialog", { name: "First" })).toBeTruthy();
    act(() => first.close());
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "First" })).toBeNull(),
    );
    expect(screen.getByRole("dialog", { name: "Second" })).toBeTruthy();
  });
  it("transitions promises to safe success and failure messages", async () => {
    const manager = createToastManager();
    render(<ToastProvider toastManager={manager} timeout={0} />);
    const success = Promise.withResolvers<string>();
    let result: Promise<string> | undefined;
    act(() => {
      result = manager.promise(success.promise, {
        loading: { title: "Working" },
        success: (value) => ({ title: `Done: ${value}` }),
        error: { title: "Failed safely" },
      });
    });
    expect(await screen.findByRole("dialog", { name: "Working" })).toBeTruthy();
    await act(async () => {
      success.resolve("export");
      await result;
    });
    expect(
      await screen.findByRole("dialog", { name: "Done: export" }),
    ).toBeTruthy();
    const failure = Promise.withResolvers<void>();
    let failed: Promise<void> | undefined;
    act(() => {
      failed = manager.promise(failure.promise, {
        loading: { title: "Trying" },
        success: { title: "Done" },
        error: { title: "Failed safely" },
      });
    });
    await act(async () => {
      failure.reject(new Error("secret backend detail"));
      await failed?.catch(() => undefined);
    });
    expect(
      await screen.findByRole("dialog", { name: "Failed safely" }),
    ).toBeTruthy();
    expect(screen.queryByText("secret backend detail")).toBeNull();
  });
});
