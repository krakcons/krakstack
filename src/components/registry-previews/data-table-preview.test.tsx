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
  stripSearchParams,
} from "@tanstack/react-router";
import { afterEach } from "vitest";

import { DataTablePreview } from "./data-table-preview";
import { QueryStandard } from "@/lib/query";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("DataTable preview URL state", () => {
  it("loads, clears, and navigates filters without adding pagination defaults to the URL", async () => {
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
        initialEntries: ["/docs/data-table?globalFilter=Signup"],
      }),
    });
    await act(() => router.load());
    render(<RouterProvider router={router} />);

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
  });
});
