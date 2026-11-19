// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  stripSearchParams,
} from "@tanstack/react-router";
import { afterEach, vi } from "vitest";

import { DataTablePreview } from "./data-table-preview";
import { QueryStandard } from "@/lib/query";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

const renderPreview = async (url: string) => {
  const root = createRootRoute({
    search: {
      middlewares: [
        stripSearchParams<{ page?: number; pageSize?: number }>({
          page: 0,
          pageSize: 20,
        }),
      ],
    },
  });
  const docs = createRoute({
    getParentRoute: () => root,
    path: "/docs/{-$slug}",
    validateSearch: QueryStandard,
    component: DataTablePreview,
  });
  const router = createRouter({
    routeTree: root.addChildren([docs]),
    history: createMemoryHistory({
      initialEntries: [url],
    }),
  });
  await act(() => router.load());
  render(<RouterProvider router={router} />);
  return router;
};

describe("DataTable preview", () => {
  it("shows loading in the table until the project rows arrive", async () => {
    await renderPreview("/docs/data-table");

    const table = await screen.findByRole("table");
    expect(within(table).getByText("Loading...")).toBeTruthy();
    expect(within(table).queryByText("Signup funnel")).toBeNull();
    expect(await within(table).findByText("Signup funnel")).toBeTruthy();
    expect(within(table).queryByText("Loading...")).toBeNull();
  });

  it("shows the name of the group whose action was selected", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    await renderPreview("/docs/data-table");

    const backlog = await screen.findByRole("button", { name: "Backlog" });
    fireEvent.click(
      within(backlog.closest("tr")!).getByRole("button", {
        name: "Group actions",
      }),
    );
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Show group name" }),
    );
    expect(alert).toHaveBeenCalledWith("Group: Backlog");
  });

  it("loads, clears, and navigates filters without adding pagination defaults to the URL", async () => {
    const router = await renderPreview("/docs/data-table?globalFilter=Signup");

    expect(await screen.findByDisplayValue("Signup")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Filter results..." }));

    await waitFor(() => {
      expect(router.state.location.search.globalFilter).toBeUndefined();
      expect(screen.queryByDisplayValue("Signup")).toBeNull();
    });
    expect(router.state.location.searchStr).toBe("");
    expect(
      screen.queryByRole("button", { name: "Filter results..." }),
    ).toBeNull();

    fireEvent.change(screen.getAllByRole("textbox")[0]!, {
      target: { value: "Billing" },
    });
    await waitFor(() =>
      expect(router.state.location.search.globalFilter).toBe("Billing"),
    );
    expect(router.state.location.search).toEqual({ globalFilter: "Billing" });
    await act(() =>
      router.navigate({
        href: "/docs/data-table?globalFilter=Release",
        resetScroll: false,
      }),
    );
    expect(await screen.findByDisplayValue("Release")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("menuitem", { name: "Filters" })[0]!);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Project" }));
    fireEvent.change(await screen.findByLabelText("Value"), {
      target: { value: "Release" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        globalFilter: "Release",
        filters: [
          { id: "name", kind: "text", operator: "contains", value: "Release" },
        ],
      }),
    );
    fireEvent.keyDown(screen.getByLabelText("Value"), { key: "Escape" });
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Clear all filters" }),
    );
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ globalFilter: "Release" }),
    );
  });
});
