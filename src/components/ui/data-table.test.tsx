// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, vi } from "vitest";

import {
  DataTable,
  DataTableListSummary,
  buildDataTableRows,
  filterDataTableRows,
  getDataTableWidth,
  getDataTableSelectableRows,
  mergeDataTableState,
  normalizeDataTableColumns,
  paginateDataTableRows,
  reorderDataTableRows,
  sortDataTableRows,
  type DataTableCellRendererParams,
  type DataTableColDef,
  type DataTableModel,
  type DataTablePublicState,
} from "./data-table";

afterEach(cleanup);

type Row = {
  id: string;
  name: string;
  score: number;
};

const columns: DataTableColDef<Row>[] = [
  { field: "name", headerName: "Name" },
  { field: "score", headerName: "Score" },
];

const data: Row[] = [
  { id: "one", name: "Alpha", score: 30 },
  { id: "two", name: "Beta", score: 10 },
  { id: "three", name: "Gamma", score: 20 },
];

const HookCell = ({ value }: DataTableCellRendererParams<Row>) => {
  const [initialValue] = useState(value);
  return String(initialValue);
};

const state: DataTablePublicState = {
  globalFilter: "",
  sorting: [],
  pagination: { pageIndex: 0, pageSize: 2 },
  columnVisibility: {},
  columnSizing: {},
  rowSelection: {},
  grouping: [],
  collapsedGroups: {},
  view: "table",
};

describe("DataTable model", () => {
  it("requires stable row IDs for stateful row features", () => {
    expect(() =>
      render(
        <DataTable
          columnDefs={columns}
          features={{ selection: {} }}
          rowData={data}
        />,
      ),
    ).toThrow("requires getRowId");
  });

  it("renders cell renderers as components and preserves intentional null", () => {
    const { rerender } = render(
      <DataTable
        columnDefs={[
          { field: "name", headerName: "Name" },
          { field: "score", headerName: "Score", cellRenderer: HookCell },
        ]}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Score" }));
    fireEvent.click(screen.getByText("Hide column"));
    expect(screen.queryByRole("button", { name: "Score" })).toBeNull();

    rerender(
      <DataTable
        columnDefs={[
          {
            field: "name",
            headerName: "Name",
            cellRenderer: () => null,
            valueFormatter: () => "unexpected fallback",
          },
        ]}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );
    expect(screen.queryByText("unexpected fallback")).toBeNull();
    expect(screen.queryByText("Alpha")).toBeNull();
  });

  it("opens grouped Menubar controls within a menu group", async () => {
    render(
      <DataTable
        columnDefs={columns}
        features={{
          grouping: {
            fields: [
              {
                id: "name",
                label: "Name group",
                getGroupId: (row) => row.name,
              },
            ],
          },
        }}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Group by" }));

    expect(await screen.findByText("Name group")).toBeTruthy();
  });

  it("opens nested column sorting controls", async () => {
    render(
      <DataTable
        columnDefs={columns}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Sort by" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Name" }));

    expect(await screen.findByText("Ascending")).toBeTruthy();
    expect(await screen.findByText("Descending")).toBeTruthy();
  });

  it("opens column header sorting and visibility controls", async () => {
    render(
      <DataTable
        columnDefs={columns}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Name" }));

    expect(await screen.findByText("Ascending")).toBeTruthy();
    expect(await screen.findByText("Descending")).toBeTruthy();
    fireEvent.click(await screen.findByText("Hide column"));

    expect(screen.queryByRole("button", { name: "Name" })).toBeNull();
  });

  it("opens row actions within a menu group", async () => {
    render(
      <DataTable
        columnDefs={columns}
        features={{
          rowActions: {
            items: [{ name: "Open row", onClick: vi.fn() }],
          },
        }}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );

    const actionButton = screen.getAllByRole("button", { name: "Actions" })[0]!;
    expect(actionButton.className).toContain("focus-visible:ring-inset");
    expect(actionButton.closest("td")?.className).toContain("bg-background");
    expect(actionButton.closest("td")?.className).toContain(
      "group-hover/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--background))]",
    );
    fireEvent.click(actionButton);

    expect(await screen.findByText("Open row")).toBeTruthy();
  });

  it("controls request state with Query and emits API-ready query changes", () => {
    const onQueryChange = vi.fn();
    render(
      <DataTable
        columnDefs={columns}
        features={{ pagination: false, selection: {} }}
        getRowId={(row) => row.id}
        onQueryChange={onQueryChange}
        query={{
          page: 0,
          pageSize: 10,
          globalFilter: "Alpha",
          sort: "-name",
        }}
        rowData={data}
      />,
    );

    expect(screen.getByDisplayValue("Alpha")).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("checkbox", { name: "Select row" })[0]!,
    );
    expect(onQueryChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByDisplayValue("Alpha"), {
      target: { value: "Beta" },
    });
    expect(onQueryChange).toHaveBeenCalledWith({
      page: 0,
      pageSize: 10,
      globalFilter: "Beta",
      sort: "-name",
    });
  });

  it("highlights group drop targets and moves the dropped row", () => {
    const onMoveToGroup = vi.fn();
    render(
      <DataTable
        columnDefs={columns}
        features={{
          rowActions: { items: [{ name: "Open", onClick: vi.fn() }] },
          grouping: {
            initial: ["name"],
            fields: [
              {
                id: "name",
                label: "Name group",
                getGroupId: (row) => row.name,
                onMoveToGroup,
              },
            ],
          },
        }}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );

    const handle = screen.getAllByRole("button", {
      name: "Drag to reorder",
    })[0];
    const target = document.querySelector<HTMLElement>(
      '[data-table-group="name:Beta"]',
    );
    expect(handle).toBeTruthy();
    expect(target).toBeTruthy();
    if (!handle || !target) return;

    let hitElements: Element[] = [target];
    Object.defineProperty(handle, "setPointerCapture", { value: vi.fn() });
    Object.defineProperty(document, "elementsFromPoint", {
      configurable: true,
      value: () => hitElements,
    });
    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 16, clientY: 0, pointerId: 1 });

    expect(target.dataset.dropTarget).toBe("true");
    expect(target.className).toContain("outline-primary");
    expect(target.className).toContain("-outline-offset-2");
    expect(target.className).toContain("[&>tr>td:last-child]:z-0");
    expect(
      target.querySelector<HTMLElement>('[data-table-row="two"]')?.dataset
        .dropTarget,
    ).toBeUndefined();

    hitElements = [];
    fireEvent.pointerUp(handle, { clientX: 16, clientY: 0, pointerId: 1 });
    expect(onMoveToGroup).not.toHaveBeenCalled();
    expect(target.dataset.dropTarget).toBeUndefined();

    hitElements = [target];
    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 2 });
    fireEvent.pointerMove(handle, { clientX: 16, clientY: 0, pointerId: 2 });
    fireEvent.pointerUp(handle, { clientX: 16, clientY: 0, pointerId: 2 });
    expect(onMoveToGroup).toHaveBeenCalledWith(data[0], "Beta");
  });

  it("hides reorder handles when displayed order is transformed", () => {
    const reordering = { onReorder: vi.fn() };
    const { rerender } = render(
      <DataTable
        columnDefs={columns}
        features={{ reordering }}
        getRowId={(row) => row.id}
        initialState={{ sorting: [{ id: "name", desc: false }] }}
        rowData={data}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Drag to reorder" }),
    ).toBeNull();

    rerender(
      <DataTable
        columnDefs={columns}
        features={{
          grouping: {
            initial: ["name"],
            fields: [
              { id: "name", label: "Name", getGroupId: (row) => row.name },
            ],
          },
          reordering,
        }}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Drag to reorder" }),
    ).toBeNull();
  });

  it("shows an insertion line and reorders sortable rows", () => {
    const onReorder = vi.fn();
    render(
      <DataTable
        columnDefs={columns}
        features={{ pagination: false, reordering: { onReorder } }}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );
    const handle = screen.getAllByRole("button", {
      name: "Drag to reorder",
    })[0];
    const target = document.querySelector<HTMLElement>(
      '[data-table-row="two"]',
    );
    expect(handle).toBeTruthy();
    expect(target).toBeTruthy();
    if (!handle || !target) return;

    Object.defineProperty(handle, "setPointerCapture", { value: vi.fn() });
    Object.defineProperty(document, "elementsFromPoint", {
      configurable: true,
      value: () => [target],
    });
    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 3 });
    fireEvent.pointerMove(handle, { clientX: 16, clientY: 0, pointerId: 3 });

    expect(target.dataset.dropPosition).toBe("after");
    const overlay = document.body.querySelector<HTMLElement>(
      '[aria-hidden="true"].fixed',
    );
    expect(overlay?.style.left).toBe("28px");
    expect(overlay?.style.top).toBe("12px");

    fireEvent.pointerUp(handle, { clientX: 16, clientY: 0, pointerId: 3 });
    expect(onReorder).toHaveBeenCalledWith([data[1], data[0], data[2]]);
    expect(target.dataset.dropPosition).toBeUndefined();
    expect(document.body.contains(overlay)).toBe(false);
  });

  it("includes move up and move down actions for reorderable rows", async () => {
    const onReorder = vi.fn();
    render(
      <DataTable
        columnDefs={columns}
        features={{ pagination: false, reordering: { onReorder } }}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );

    const actionButtons = screen.getAllByRole("button", { name: "Actions" });
    expect(actionButtons).toHaveLength(3);

    fireEvent.click(actionButtons[0]!);
    expect(screen.queryByText("Move up")).toBeNull();
    fireEvent.click(await screen.findByText("Move down"));
    expect(onReorder).toHaveBeenLastCalledWith([data[1], data[0], data[2]]);

    fireEvent.click(actionButtons[1]!);
    expect(await screen.findByText("Move up")).toBeTruthy();
    expect(screen.getByText("Move down")).toBeTruthy();
  });

  it("reconciles an out-of-range controlled page", async () => {
    const onStateChange = vi.fn();
    render(
      <DataTable
        columnDefs={columns}
        features={{ pagination: { mode: "server", rowCount: 3 } }}
        getRowId={(row) => row.id}
        onStateChange={onStateChange}
        rowData={data}
        state={{ pagination: { pageIndex: 9, pageSize: 2 } }}
      />,
    );

    await waitFor(() =>
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ pagination: { pageIndex: 1, pageSize: 2 } }),
      ),
    );
  });

  it("uses visible columns in gallery mode and includes utility widths", () => {
    const { unmount } = render(
      <DataTable
        columnDefs={columns}
        features={{ gallery: { name: "name" } }}
        getRowId={(row) => row.id}
        initialState={{ columnVisibility: { name: false }, view: "gallery" }}
        rowData={data}
      />,
    );
    expect(screen.queryByText("Alpha")).toBeNull();
    unmount();

    render(
      <DataTable
        columnDefs={columns}
        features={{
          pagination: false,
          reordering: { onReorder: vi.fn() },
          rowActions: { items: [{ name: "Open", onClick: vi.fn() }] },
          selection: {},
        }}
        getRowId={(row) => row.id}
        initialState={{ view: "table" }}
        rowData={data}
      />,
    );
    expect(getDataTableWidth(normalizeDataTableColumns(columns), 3)).toBe(536);
  });

  it("exposes group expansion and expandable icon overflow", async () => {
    const { rerender } = render(
      <DataTable
        columnDefs={columns}
        features={{
          grouping: {
            initial: ["name"],
            fields: [
              { id: "name", label: "Name", getGroupId: (row) => row.name },
            ],
          },
        }}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: /Alpha/ })
        .getAttribute("aria-expanded"),
    ).toBe("true");

    rerender(
      <DataTableListSummary
        emptyLabel="Empty"
        items={["Alpha", "Beta", "Gamma", "Delta"]}
        variant="icon"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "and 1 other" }));
    expect(await screen.findByText("Delta")).toBeTruthy();
  });

  it("builds stable rows and calculated values", () => {
    const resolvedColumns = normalizeDataTableColumns([
      ...columns,
      {
        colId: "label",
        headerName: "Label",
        valueGetter: ({ data }) => `${data.name}:${data.score}`,
      },
    ]);
    const rows = buildDataTableRows(data, resolvedColumns, (row) => row.id);

    expect(rows.map((row) => row.id)).toEqual(["one", "two", "three"]);
    expect(rows[0]?.values.get("label")).toBe("Alpha:30");
  });

  it("filters, stably sorts, and paginates rows", () => {
    const resolvedColumns = normalizeDataTableColumns(columns);
    const rows = buildDataTableRows(data, resolvedColumns, (row) => row.id);
    const filtered = filterDataTableRows(rows, resolvedColumns, "a");
    const sorted = sortDataTableRows(filtered, resolvedColumns, [
      { id: "score", desc: false },
    ]);
    const page = paginateDataTableRows(sorted, {
      pageIndex: 1,
      pageSize: 2,
    });

    expect(sorted.map((row) => row.id)).toEqual(["two", "three", "one"]);
    expect(page.map((row) => row.id)).toEqual(["one"]);
  });

  it("clamps an invalid client page to the last page", () => {
    const resolvedColumns = normalizeDataTableColumns(columns);
    const rows = buildDataTableRows(data, resolvedColumns, (row) => row.id);

    expect(
      paginateDataTableRows(rows, { pageIndex: 4, pageSize: 2 }).map(
        (row) => row.id,
      ),
    ).toEqual(["three"]);
  });

  it("reorders the complete underlying data by stable row IDs", () => {
    const resolvedColumns = normalizeDataTableColumns(columns);
    const rows = buildDataTableRows(data, resolvedColumns, (row) => row.id);

    expect(
      reorderDataTableRows(rows, "three", "one").map((row) => row.id),
    ).toEqual(["three", "one", "two"]);
  });

  it("overlays only supplied controlled state fields", () => {
    const proposed = {
      ...state,
      globalFilter: "proposed",
      pagination: { pageIndex: 1, pageSize: 2 },
    };
    const merged = mergeDataTableState(proposed, { globalFilter: "accepted" });

    expect(merged.globalFilter).toBe("accepted");
    expect(merged.pagination).toEqual({ pageIndex: 1, pageSize: 2 });
  });

  it("uses all grouped rows and honors row selectability", () => {
    const resolvedColumns = normalizeDataTableColumns(columns);
    const rows = buildDataTableRows(data, resolvedColumns, (row) => row.id);
    const model: DataTableModel<Row> = {
      columns: resolvedColumns,
      visibleColumns: resolvedColumns,
      rows,
      filteredRows: rows,
      sortedRows: rows,
      pageRows: rows.slice(0, 2),
      pageCount: 2,
      totalRows: rows.length,
    };

    expect(
      getDataTableSelectableRows(model, true, (row) => row.id !== "two").map(
        (row) => row.id,
      ),
    ).toEqual(["one", "three"]);
    expect(
      getDataTableSelectableRows(model, false).map((row) => row.id),
    ).toEqual(["one", "two"]);
  });

  it("rejects duplicate column and row IDs", () => {
    expect(() =>
      normalizeDataTableColumns([
        { colId: "same", headerName: "One" },
        { colId: "same", headerName: "Two" },
      ]),
    ).toThrow("DataTable column IDs must be unique");

    const resolvedColumns = normalizeDataTableColumns(columns);
    expect(() =>
      buildDataTableRows(data, resolvedColumns, () => "same"),
    ).toThrow("DataTable row IDs must be unique");
  });
});
