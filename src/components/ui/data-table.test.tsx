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
  DataTableRelationshipCell,
  buildDataTableRows,
  filterDataTableRows,
  getDataTableWidth,
  getDataTableExportValue,
  getDataTableSelectableRows,
  normalizeDataTableColumns,
  paginateDataTableRows,
  reorderDataTableRows,
  sortDataTableRows,
  type DataTableCellRendererParams,
  type DataTableColDef,
  type DataTableModel,
  type DataTablePublicState,
} from "./data-table";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

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
  page: 0,
  pageSize: 2,
};

describe("DataTable model", () => {
  it("formats numbers as localized decimals, percentages, and currencies without losing zero", () => {
    render(
      <DataTable
        rowData={[{ amount: 1234.5, ratio: 0.125, zero: 0 }]}
        features={{
          search: false,
          sorting: false,
          columnVisibility: false,
          pagination: false,
        }}
        columnDefs={[
          {
            field: "amount",
            headerName: "Amount",
            type: "number",
            typeOptions: {
              locale: "en-US",
              style: "currency",
              currency: "USD",
            },
          },
          {
            field: "ratio",
            headerName: "Ratio",
            type: "number",
            typeOptions: {
              locale: "en-US",
              style: "percent",
              maximumFractionDigits: 1,
            },
          },
          {
            field: "zero",
            headerName: "Zero",
            type: "number",
            typeOptions: { locale: "fr", minimumFractionDigits: 2 },
          },
        ]}
      />,
    );
    expect(screen.getByText("$1,234.50")).toBeTruthy();
    expect(screen.getByText("12.5%")).toBeTruthy();
    expect(screen.getByText("0,00")).toBeTruthy();
  });

  it("sorts numbers numerically while treating coercible strings and non-finite inputs as empty", () => {
    const input = [
      { n: 10 },
      { n: -2 },
      { n: 0 },
      { n: 1.5 },
      { n: "2" },
      { n: Infinity },
      { n: NaN },
      { n: null },
    ];
    const columns = normalizeDataTableColumns<(typeof input)[number]>([
      { field: "n", headerName: "Number", type: "number" },
    ]);
    const rows = buildDataTableRows(input, columns);
    expect(
      sortDataTableRows(rows, columns, [{ id: "n", direction: "asc" }]).map(
        (row) => row.index,
      ),
    ).toEqual([1, 2, 3, 0, 4, 5, 6, 7]);
    expect(
      sortDataTableRows(rows, columns, [{ id: "n", direction: "desc" }]).map(
        (row) => row.index,
      ),
    ).toEqual([0, 3, 2, 1, 4, 5, 6, 7]);
    expect(getDataTableExportValue(rows[2], columns[0])).toBe(0);
    for (const row of rows.slice(4))
      expect(getDataTableExportValue(row, columns[0])).toBeNull();
    expect(filterDataTableRows(rows, columns, "Infinity")).toHaveLength(0);
  });

  it("searches formatted and raw numbers and keeps raw numbers in exports unless requested otherwise", () => {
    const input = [{ n: 0.125 }];
    const columns = normalizeDataTableColumns<(typeof input)[number]>([
      {
        field: "n",
        headerName: "Percent",
        type: "number",
        typeOptions: {
          locale: "en-US",
          style: "percent",
          maximumFractionDigits: 1,
        },
      },
    ]);
    const rows = buildDataTableRows(input, columns);
    expect(filterDataTableRows(rows, columns, "12.5%")).toHaveLength(1);
    expect(filterDataTableRows(rows, columns, "0.125")).toHaveLength(1);
    expect(getDataTableExportValue(rows[0], columns[0])).toBe(0.125);
    const formatted = normalizeDataTableColumns<(typeof input)[number]>([
      {
        field: "n",
        headerName: "Percent",
        type: "number",
        typeOptions: {
          locale: "en-US",
          style: "percent",
          maximumFractionDigits: 1,
          exportFormat: "formatted",
        },
      },
    ]);
    expect(getDataTableExportValue(rows[0], formatted[0])).toBe("12.5%");
  });

  it("renders read-only booleans and treats string booleans as empty", () => {
    render(
      <DataTable
        rowData={[{ flag: true }, { flag: false }, { flag: "false" }]}
        features={{
          search: false,
          sorting: false,
          columnVisibility: false,
          pagination: false,
        }}
        columnDefs={[
          {
            field: "flag",
            headerName: "Enabled",
            type: "boolean",
            typeOptions: {
              trueLabel: "Oui",
              falseLabel: "Non",
              emptyLabel: "Missing",
            },
          },
        ]}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox", { name: "Enabled" });
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0].getAttribute("aria-checked")).toBe("true");
    expect(checkboxes[1].getAttribute("aria-checked")).toBe("false");
    for (const checkbox of checkboxes)
      expect(checkbox.getAttribute("aria-readonly")).toBe("true");
    expect(screen.queryByText("Oui")).toBeNull();
    expect(screen.queryByText("Non")).toBeNull();
    expect(screen.getByText("Missing")).toBeTruthy();
  });

  it("keeps boolean editing controlled, passes row context, and respects disabled rows without triggering row clicks", () => {
    const onChange = vi.fn();
    const onRowClicked = vi.fn();
    const input = [
      { id: "editable", flag: false },
      { id: "locked", flag: true },
    ];
    const columns: DataTableColDef<(typeof input)[number]>[] = [
      {
        field: "flag",
        headerName: "Enabled",
        type: "boolean",
        typeOptions: {
          getAriaLabel: (row) => `Toggle ${row.id}`,
          onChange,
          disabled: (row) => row.id === "locked",
        },
      },
    ];
    const { rerender } = render(
      <DataTable
        columnDefs={columns}
        rowData={input}
        onRowClicked={onRowClicked}
      />,
    );
    const editable = screen.getByRole("checkbox", { name: "Toggle editable" });
    fireEvent.click(editable);
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      value: true,
      row: input[0],
    });
    expect(editable.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(screen.getByRole("checkbox", { name: "Toggle locked" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onRowClicked).not.toHaveBeenCalled();
    rerender(
      <DataTable
        columnDefs={columns}
        rowData={input.map((row) => ({ ...row, flag: true }))}
        onRowClicked={onRowClicked}
      />,
    );
    expect(
      screen
        .getByRole("checkbox", { name: "Toggle editable" })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("sorts and exports actual booleans, preserving false and searching localized labels", () => {
    const input = [
      { flag: true },
      { flag: false },
      { flag: null },
      { flag: "false" },
    ];
    const columns = normalizeDataTableColumns<(typeof input)[number]>([
      {
        field: "flag",
        headerName: "Enabled",
        type: "boolean",
        typeOptions: { trueLabel: "Oui", falseLabel: "Non" },
      },
    ]);
    const rows = buildDataTableRows(input, columns);
    expect(
      sortDataTableRows(rows, columns, [{ id: "flag", direction: "asc" }]).map(
        (row) => row.index,
      ),
    ).toEqual([1, 0, 2, 3]);
    expect(
      sortDataTableRows(rows, columns, [{ id: "flag", direction: "desc" }]).map(
        (row) => row.index,
      ),
    ).toEqual([0, 1, 2, 3]);
    expect(
      filterDataTableRows(rows, columns, "Non").map((row) => row.index),
    ).toEqual([1]);
    expect(
      filterDataTableRows(rows, columns, "false").map((row) => row.index),
    ).toEqual([1]);
    expect(getDataTableExportValue(rows[1], columns[0])).toBe(false);
    expect(getDataTableExportValue(rows[3], columns[0])).toBeNull();
    const formatted = normalizeDataTableColumns<(typeof input)[number]>([
      {
        field: "flag",
        headerName: "Enabled",
        type: "boolean",
        typeOptions: {
          falseLabel: "Non",
          exportFormat: "formatted",
          nulls: "first",
        },
      },
    ]);
    expect(getDataTableExportValue(rows[1], formatted[0])).toBe("Non");
    expect(
      sortDataTableRows(rows, formatted, [
        { id: "flag", direction: "asc" },
      ]).map((row) => row.index),
    ).toEqual([2, 3, 1, 0]);
  });

  it("formats calendar dates without shifting them and timestamps in the configured zone", () => {
    const { container } = render(
      <DataTable
        rowData={[{ day: "2026-09-23", instant: "2026-09-23T01:30:00Z" }]}
        features={{
          search: false,
          sorting: false,
          columnVisibility: false,
          pagination: false,
        }}
        columnDefs={[
          {
            field: "day",
            headerName: "Date",
            type: "date",
            typeOptions: {
              locale: "en-US",
              timeZone: "America/Los_Angeles",
              dateStyle: "long",
            },
          },
          {
            field: "instant",
            headerName: "Timestamp",
            type: "dateTime",
            typeOptions: {
              locale: "en-US",
              timeZone: "America/Los_Angeles",
              hour12: false,
            },
          },
        ]}
      />,
    );
    expect(screen.getByText("September 23, 2026")).toBeTruthy();
    const times = container.querySelectorAll("time");
    expect(times[0].dateTime).toBe("2026-09-23");
    expect(times[1].dateTime).toBe("2026-09-23T01:30:00.000Z");
    expect(times[1].textContent).toContain("Sep 22, 2026");
    expect(times[1].textContent).toContain("18:30");
  });

  it("sorts mixed timestamp inputs chronologically with invalid and missing values last in both directions", () => {
    const input = [
      { id: "late", at: "2026-09-23T01:00:00-04:00" },
      { id: "early", at: new Date("2026-09-23T03:00:00Z") },
      { id: "middle", at: "2026-09-23T04:00:00Z" },
      { id: "epoch", at: 0 },
      { id: "missing", at: null },
      { id: "invalid", at: "not a date" },
    ];
    const resolved = normalizeDataTableColumns<(typeof input)[number]>([
      { field: "at", headerName: "At", type: "dateTime" },
    ]);
    const rows = buildDataTableRows(input, resolved);
    expect(
      sortDataTableRows(rows, resolved, [{ id: "at", direction: "asc" }]).map(
        (row) => row.data.id,
      ),
    ).toEqual(["epoch", "early", "middle", "late", "missing", "invalid"]);
    expect(
      sortDataTableRows(rows, resolved, [{ id: "at", direction: "desc" }]).map(
        (row) => row.data.id,
      ),
    ).toEqual(["late", "middle", "early", "epoch", "missing", "invalid"]);
    const nullsFirst = normalizeDataTableColumns<(typeof input)[number]>([
      {
        field: "at",
        headerName: "At",
        type: "dateTime",
        typeOptions: { nulls: "first" },
      },
    ]);
    expect(
      sortDataTableRows(rows, nullsFirst, [{ id: "at", direction: "desc" }])
        .slice(0, 2)
        .map((row) => row.data.id),
    ).toEqual(["missing", "invalid"]);
  });

  it("searches localized date labels and ISO values and exports canonical or formatted dates", () => {
    const input = [{ at: "2026-09-23T01:30:00-04:00" }];
    const resolved = normalizeDataTableColumns<(typeof input)[number]>([
      {
        field: "at",
        headerName: "At",
        type: "dateTime",
        typeOptions: {
          locale: "fr",
          timeZone: "UTC",
          dateStyle: "long",
          hour12: false,
        },
      },
    ]);
    const rows = buildDataTableRows(input, resolved);
    expect(filterDataTableRows(rows, resolved, "septembre")).toHaveLength(1);
    expect(filterDataTableRows(rows, resolved, "2026-09-23")).toHaveLength(1);
    expect(filterDataTableRows(rows, resolved, "05:30")).toHaveLength(1);
    expect(getDataTableExportValue(rows[0], resolved[0])).toBe(
      "2026-09-23T05:30:00.000Z",
    );
    const formatted = normalizeDataTableColumns<(typeof input)[number]>([
      {
        field: "at",
        headerName: "At",
        type: "date",
        typeOptions: {
          locale: "fr",
          dateStyle: "long",
          exportFormat: "formatted",
        },
      },
    ]);
    expect(getDataTableExportValue(rows[0], formatted[0])).toBe(
      "23 septembre 2026",
    );
    expect(rows[0].values.get("at")).toBe(input[0].at);
  });

  it.each([
    ["date", "2026-02-30"],
    ["date", "2025-02-29"],
    ["date", new Date(NaN)],
    ["date", Infinity],
    ["date", "09/23/2026"],
    ["dateTime", "2026-09-23"],
    ["dateTime", "2026-09-23T12:00:00"],
    ["dateTime", "2026-02-30T12:00:00Z"],
    ["dateTime", "2026-09-23T25:00:00Z"],
  ] as const)(
    "treats invalid or ambiguous %s input %s as empty",
    (type, at) => {
      const input = [{ at }];
      const colDefs: DataTableColDef<(typeof input)[number]>[] = [
        {
          field: "at",
          headerName: "At",
          type,
          typeOptions: { emptyLabel: "No date" },
        },
      ];
      render(
        <DataTable
          rowData={input}
          columnDefs={colDefs}
          features={{
            search: false,
            sorting: false,
            columnVisibility: false,
            pagination: false,
          }}
        />,
      );
      expect(screen.getByText("No date")).toBeTruthy();
      const resolved = normalizeDataTableColumns(colDefs);
      expect(
        getDataTableExportValue(
          buildDataTableRows(input, resolved)[0],
          resolved[0],
        ),
      ).toBeNull();
    },
  );

  it("exports leap-day calendar values unchanged and preserves date display overrides", () => {
    const input = [{ at: "2024-02-29" }];
    const colDefs: DataTableColDef<(typeof input)[number]>[] = [
      {
        field: "at",
        headerName: "At",
        type: "date",
        valueFormatter: () => "Custom date",
      },
    ];
    const resolved = normalizeDataTableColumns(colDefs);
    expect(
      getDataTableExportValue(
        buildDataTableRows(input, resolved)[0],
        resolved[0],
      ),
    ).toBe("2024-02-29");
    const { rerender } = render(
      <DataTable columnDefs={colDefs} rowData={input} />,
    );
    expect(screen.getByText("Custom date")).toBeTruthy();
    rerender(
      <DataTable
        columnDefs={[{ ...colDefs[0], cellRenderer: () => "Custom cell" }]}
        rowData={input}
      />,
    );
    expect(screen.getByText("Custom cell")).toBeTruthy();
  });

  it("runs list actions with item and row context without activating the row", async () => {
    const onClick = vi.fn();
    const onRowClicked = vi.fn();
    const member = { value: "ada", label: "Ada", imageSrc: "/ada.png" };
    render(
      <DataTable
        columnDefs={[
          {
            colId: "members",
            headerName: "Members",
            type: "list",
            typeOptions: {
              emptyLabel: "No members",
              variant: "icon",
              getItems: () => [member],
              actions: [
                { name: "Impersonate", onClick },
                { name: "Hidden", onClick, visible: () => false },
                { name: "Unavailable", onClick, disabled: () => true },
              ],
            },
          },
        ]}
        rowData={[data[0]]}
        onRowClicked={onRowClicked}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ada" }));
    const action = await screen.findByRole("menuitem", { name: "Impersonate" });
    expect(screen.queryByRole("menuitem", { name: "Hidden" })).toBeNull();
    const disabled = screen.getByRole("menuitem", { name: "Unavailable" });
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(disabled);
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledWith({ item: member, row: data[0] });
    expect(onRowClicked).not.toHaveBeenCalled();
  });

  it("offers item actions in the overflow list", async () => {
    const onClick = vi.fn();
    render(
      <DataTableListSummary
        emptyLabel="Empty"
        variant="icon"
        visibleCount={1}
        items={[
          { value: "ada", label: "Ada" },
          { value: "grace", label: "Grace" },
        ]}
        itemActions={[{ name: "Open", onClick }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "and 1 other" }));
    fireEvent.click(await screen.findByRole("button", { name: "Grace" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Open" }));
    expect(onClick).toHaveBeenCalledWith({ value: "grace", label: "Grace" });
  });

  it("keeps relationship item actions separate from the relationship picker", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(288);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
    const onAdd = vi.fn();
    const onClick = vi.fn();
    const onRowClicked = vi.fn();
    const ada = { value: "ada", label: "Ada" };
    const grace = { value: "grace", label: "Grace" };
    render(
      <DataTable
        columnDefs={[
          {
            colId: "members",
            headerName: "Members",
            type: "relationship",
            typeOptions: {
              emptyLabel: "Empty",
              manageLabel: "Manage members",
              getItems: () => [ada],
              getOptions: () => [ada, grace],
              onAdd,
              actions: [{ name: "Open", onClick }],
            },
          },
        ]}
        rowData={[data[0]]}
        onRowClicked={onRowClicked}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ada" }));
    expect(screen.queryByRole("option")).toBeNull();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Open" }));
    expect(onClick).toHaveBeenCalledWith({ item: ada, row: data[0] });
    fireEvent.click(screen.getByRole("combobox", { name: "Manage members" }));
    fireEvent.click(await screen.findByRole("option", { name: "Grace" }));
    expect(onAdd).toHaveBeenCalledWith({ value: "grace", row: data[0] });
    expect(onRowClicked).not.toHaveBeenCalled();
  });

  it("uses list labels for searchable and sortable model values", () => {
    const resolved = normalizeDataTableColumns<Row>([
      {
        colId: "members",
        headerName: "Members",
        type: "list",
        typeOptions: {
          emptyLabel: "Empty",
          getItems: (row) => [
            { label: row.id === "one" ? "Grace" : "Ada", value: row.id },
          ],
        },
      },
    ]);
    const rows = buildDataTableRows(data.slice(0, 2), resolved);
    expect(rows[0].values.get("members")).toBe("Grace");
    expect(
      filterDataTableRows(rows, resolved, "ada").map((row) => row.data.id),
    ).toEqual(["two"]);
    expect(
      sortDataTableRows(rows, resolved, [
        { id: "members", direction: "asc" },
      ]).map((row) => row.data.id),
    ).toEqual(["two", "one"]);
  });
  it("edits relationships without activating the containing row", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(288);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
    const onRowClicked = vi.fn();
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    render(
      <DataTable
        columnDefs={[
          { field: "name", headerName: "Name" },
          {
            colId: "relationships",
            headerName: "Collections",
            cellRenderer: () => (
              <DataTableRelationshipCell
                emptyLabel="No collections"
                manageLabel="Manage collections"
                onAdd={onAdd}
                onRemove={onRemove}
                options={[{ value: "collection", label: "Collection" }]}
                value={[]}
              />
            ),
          },
        ]}
        rowData={[data[0]]}
        onRowClicked={onRowClicked}
      />,
    );

    fireEvent.click(
      screen.getByRole("combobox", { name: "Manage collections" }),
    );
    const option = await screen.findByRole("option", { name: "Collection" });
    expect(onRowClicked).not.toHaveBeenCalled();
    fireEvent.click(option);
    expect(onAdd).toHaveBeenCalledWith("collection");
    expect(onRowClicked).not.toHaveBeenCalled();
    fireEvent.click(option);
    expect(onRemove).toHaveBeenCalledWith("collection");
    expect(onRowClicked).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Alpha"));
    expect(onRowClicked).toHaveBeenCalledWith(data[0]);
  });

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

  it("controls API-ready query state while keeping UI state internal", () => {
    const onStateChange = vi.fn();
    render(
      <DataTable
        columnDefs={columns}
        features={{ pagination: false, selection: {} }}
        getRowId={(row) => row.id}
        onStateChange={onStateChange}
        state={{
          ...state,
          page: 0,
          pageSize: 10,
          globalFilter: "Alpha",
          sort: [{ id: "name", direction: "desc" }],
        }}
        rowData={data}
      />,
    );

    expect(screen.getByDisplayValue("Alpha")).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("checkbox", { name: "Select row" })[0]!,
    );
    expect(onStateChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByDisplayValue("Alpha"), {
      target: { value: "Beta" },
    });
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 0,
        pageSize: 10,
        globalFilter: "Beta",
        sort: [{ id: "name", direction: "desc" }],
      }),
    );
  });

  it("persists internal UI state by route and column identity", async () => {
    const storageKey = "data-table:/:name,score:table:ui";
    const { unmount } = render(
      <DataTable
        columnDefs={columns}
        features={{ pagination: false }}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Columns" }));
    fireEvent.click(
      await screen.findByRole("menuitemcheckbox", { name: "Name" }),
    );
    expect(screen.queryByText("Alpha")).toBeNull();
    await waitFor(() =>
      expect(localStorage.getItem(storageKey)).not.toBeNull(),
    );
    unmount();

    render(
      <DataTable
        columnDefs={columns}
        features={{ pagination: false }}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );
    await waitFor(() => expect(screen.queryByText("Alpha")).toBeNull());
  });

  it("hides default columns while persisted UI state hydrates", async () => {
    localStorage.setItem(
      "data-table:/:name,score:table:ui",
      JSON.stringify({
        columnVisibility: { name: false },
        columnSizing: {},
        view: "table",
      }),
    );

    render(
      <DataTable
        columnDefs={columns}
        features={{ pagination: false }}
        getRowId={(row) => row.id}
        rowData={data}
      />,
    );

    const root = document.querySelector<HTMLElement>("[data-table-root]");
    expect(
      root?.classList.contains("invisible") ||
        screen.queryByText("Alpha") === null,
    ).toBe(true);
    await waitFor(() => expect(root?.className).not.toContain("invisible"));
    expect(screen.queryByText("Alpha")).toBeNull();
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
        initialState={{ sort: [{ id: "name", direction: "asc" }] }}
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
        state={{ ...state, page: 9, pageSize: 2 }}
      />,
    );

    await waitFor(() =>
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 2 }),
      ),
    );
  });

  it("includes utility column widths", () => {
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
    const groupButton = screen.getByRole("button", { name: /Alpha/ });
    expect(groupButton.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(groupButton.closest("tr")!);
    expect(groupButton.getAttribute("aria-expanded")).toBe("false");

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
      { id: "score", direction: "asc" },
    ]);
    const page = paginateDataTableRows(sorted, {
      page: 1,
      pageSize: 2,
    });

    expect(sorted.map((row) => row.id)).toEqual(["two", "three", "one"]);
    expect(page.map((row) => row.id)).toEqual(["one"]);
  });

  it("clamps an invalid client page to the last page", () => {
    const resolvedColumns = normalizeDataTableColumns(columns);
    const rows = buildDataTableRows(data, resolvedColumns, (row) => row.id);

    expect(
      paginateDataTableRows(rows, { page: 4, pageSize: 2 }).map(
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
