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
import { afterEach } from "vitest";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { UnsavedChangesGuard } from "./unsaved-changes-guard";

afterEach(cleanup);

const setup = async (dirty: boolean, enabled = true) => {
  const root = createRootRoute({ component: Outlet });
  const edit = createRoute({
    getParentRoute: () => root,
    path: "/edit",
    component: () => (
      <>
        <p>Editor</p>
        <UnsavedChangesGuard dirty={dirty} enabled={enabled} />
      </>
    ),
  });
  const next = createRoute({
    getParentRoute: () => root,
    path: "/next",
    component: () => <p>Destination</p>,
  });
  const router = createRouter({
    routeTree: root.addChildren([edit, next]),
    history: createMemoryHistory({ initialEntries: ["/edit"] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  await screen.findByText("Editor");
  return router;
};

describe("UnsavedChangesGuard", () => {
  it("does not block host-authorized navigation when disabled", async () => {
    const router = await setup(true, false);
    await act(async () => {
      await router.navigate({ href: "/next" });
    });
    expect(await screen.findByText("Destination")).toBeTruthy();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
  it("lets clean routes navigate without confirmation", async () => {
    const router = await setup(false);
    await act(async () => {
      await router.navigate({ href: "/next" });
    });
    expect(await screen.findByText("Destination")).toBeTruthy();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("can cancel a blocked navigation and then explicitly proceed", async () => {
    const router = await setup(true);
    act(() => {
      void router.navigate({ href: "/next" });
    });
    await screen.findByRole("alertdialog");
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(router.state.location.pathname).toBe("/edit");
    act(() => {
      void router.navigate({ href: "/next" });
    });
    await screen.findByRole("alertdialog");
    fireEvent.click(screen.getByRole("button", { name: "Leave page" }));
    expect(await screen.findByText("Destination")).toBeTruthy();
  });
});
