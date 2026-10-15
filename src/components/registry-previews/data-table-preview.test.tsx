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
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach } from "vitest";

import { DataTablePreview } from "./data-table-preview";
import { DataTablePreviewSearchStandard } from "./schema";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("DataTable preview URL state", () => {
  it("loads filters from the URL and clears each table in one click without clearing the other", async () => {
    const root = createRootRoute();
    const docs = createRoute({
      getParentRoute: () => root,
      path: "/docs/{-$slug}",
      validateSearch: DataTablePreviewSearchStandard,
      component: DataTablePreview,
    });
    const router = createRouter({
      routeTree: root.addChildren([docs]),
      history: createMemoryHistory({
        initialEntries: [
          "/docs/data-table?globalFilter=Signup&columnTypes=%7B%22globalFilter%22%3A%22Ada%22%7D",
        ],
      }),
    });
    await act(() => router.load());
    render(<RouterProvider router={router} />);

    expect(await screen.findByDisplayValue("Signup")).toBeTruthy();
    expect(screen.getByDisplayValue("Ada")).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Filter results..." })[0]!,
    );

    await waitFor(() => {
      expect(router.state.location.search.globalFilter).toBeUndefined();
      expect(screen.queryByDisplayValue("Signup")).toBeNull();
    });
    expect(screen.getByDisplayValue("Ada")).toBeTruthy();
    expect(router.state.location.search.columnTypes).toEqual({
      globalFilter: "Ada",
    });

    fireEvent.click(screen.getByRole("button", { name: "Filter results..." }));
    await waitFor(() => {
      expect(router.state.location.search.columnTypes).toEqual({});
      expect(screen.queryByDisplayValue("Ada")).toBeNull();
    });
    expect(
      screen.queryByRole("button", { name: "Filter results..." }),
    ).toBeNull();

    fireEvent.change(screen.getAllByRole("textbox")[0]!, {
      target: { value: "Billing" },
    });
    await waitFor(() =>
      expect(router.state.location.search.globalFilter).toBe("Billing"),
    );
    await act(() =>
      router.navigate({
        href: "/docs/data-table?globalFilter=Release",
        resetScroll: false,
      }),
    );
    expect(await screen.findByDisplayValue("Release")).toBeTruthy();
  });
});
