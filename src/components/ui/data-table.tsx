import { useAtom, useAtomSet } from "@effect/atom-react";
import { BrowserKeyValueStore } from "@effect/platform-browser";
import { Schema } from "effect";
import { AsyncResult, Atom } from "effect/unstable/reactivity";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Download,
  EyeOff,
  FileJson,
  FileText,
  GripVertical,
  LayoutGrid,
  MoreHorizontal,
  RefreshCw,
  Rows3,
  Search,
  Settings2,
  X,
} from "lucide-react";
import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Pagination,
  paginationMessages,
  type PaginationMessages,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VirtualizedCombobox } from "@/components/ui/virtualized-combobox";
import type { QueryType, SortDirection } from "@/lib/query";
import { cn } from "@/lib/utils";
import { getLocale } from "@/paraglide/runtime";

type RowData = object;

export type DataTableView = "table" | "gallery";

interface DataTableUiState {
  columnVisibility: Record<string, boolean>;
  columnSizing: Record<string, number>;
  rowSelection: Record<string, boolean>;
  grouping: readonly string[];
  collapsedGroups: Record<string, boolean>;
  view: DataTableView;
}

export type DataTablePublicState = QueryType;

type DataTableState = QueryType & DataTableUiState;

type DataTablePersistedUiState = Pick<
  DataTableUiState,
  "columnVisibility" | "columnSizing" | "view"
>;

type DataTableTransientUiState = Omit<
  DataTableUiState,
  keyof DataTablePersistedUiState
>;

const DataTablePersistedUiStateSchema = Schema.Struct({
  columnVisibility: Schema.Record(Schema.String, Schema.Boolean),
  columnSizing: Schema.Record(Schema.String, Schema.Number),
  view: Schema.Literals(["table", "gallery"]),
}).annotate({ identifier: "DataTablePersistedUiState" });

const dataTableStorageRuntime = Atom.runtime(
  BrowserKeyValueStore.layerLocalStorage,
);

export interface DataTableValueGetterParams<TData extends RowData> {
  data: TData;
  rowId: string;
  rowIndex: number;
  colDef: DataTableColDef<TData>;
}

export interface DataTableCellRendererParams<
  TData extends RowData,
> extends DataTableValueGetterParams<TData> {
  value: unknown;
}

export interface DataTableColDef<TData extends RowData> {
  field?: keyof TData & string;
  colId?: string;
  headerName: ReactNode;
  // Cell value types are intentionally owned and narrowed by each consumer.
  // oxlint-disable-next-line anti-slop/no-unknown-returns
  valueGetter?: (params: DataTableValueGetterParams<TData>) => unknown;
  valueFormatter?: (params: DataTableCellRendererParams<TData>) => ReactNode;
  cellRenderer?: (params: DataTableCellRendererParams<TData>) => ReactNode;
  sortable?: boolean;
  // oxlint-disable anti-slop/no-unknown-parameters
  comparator?: (
    left: unknown,
    right: unknown,
    leftData: TData,
    rightData: TData,
  ) => number;
  // oxlint-enable anti-slop/no-unknown-parameters
  searchable?: boolean;
  hideable?: boolean;
  resizable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  truncate?: boolean;
}

export interface DataTableStatus {
  loading?: boolean;
  error?: ReactNode;
  empty?: ReactNode;
}

export type DataTableRowAction<TData> = {
  id?: string;
  name: string;
  icon?: ReactNode;
  variant?: "default" | "destructive";
  onClick: (data: TData) => void;
  visible?: (data: TData) => boolean;
};

export type DataTableBulkAction<TData> = {
  id?: string;
  name: string;
  icon?: ReactNode;
  variant?: "default" | "destructive";
  onClick: (rows: TData[]) => void;
  visible?: (rows: TData[]) => boolean;
};

export type DataTableGroupAction = {
  name: string;
  icon?: ReactNode;
  variant?: "default" | "destructive";
  onClick: (groupId: string) => void;
  visible?: (groupId: string) => boolean;
};

export interface DataTableGroupingField<TData> {
  id: string;
  label: string;
  getGroupId: (row: TData) => string;
  getRowGroupIds?: (row: TData) => readonly string[];
  getGroupIds?: () => readonly string[];
  renderGroupLabel?: (groupId: string, rows: TData[]) => ReactNode;
  renderEmptyGroup?: (groupId: string) => ReactNode;
  onMoveToGroup?: (row: TData, groupId: string) => void;
  actionsLabel?: string;
  actions?: readonly DataTableGroupAction[];
}

export interface DataTableGroupingFeature<TData> {
  fields: readonly DataTableGroupingField<TData>[];
  initial?: readonly string[];
  getRowLabel?: (row: TData) => string;
}

export type DataTablePaginationFeature =
  | false
  | { mode: "client"; pageSizes?: readonly number[] }
  | { mode: "server"; rowCount: number; pageSizes?: readonly number[] };

export interface DataTableFeatures<TData> {
  search?: boolean;
  sorting?: boolean;
  pagination?: DataTablePaginationFeature;
  columnVisibility?: boolean;
  selection?:
    | false
    | {
        getRowId?: (row: TData) => string;
        isRowSelectable?: (row: TData) => boolean;
        onSelectionChange?: (rows: TData[]) => void;
        bulkActions?:
          | false
          | { label?: string; items: readonly DataTableBulkAction<TData>[] };
      };
  rowActions?:
    | false
    | { label?: string; items: readonly DataTableRowAction<TData>[] };
  export?: false | { baseName: string; scope?: "currentPage" | "filteredRows" };
  gallery?:
    | false
    | { name: string; description?: string; tag?: string; tagIcon?: ReactNode };
  grouping?: false | DataTableGroupingFeature<TData>;
  reordering?:
    | false
    | {
        onReorder: (rows: TData[]) => void;
        getRowLabel?: (row: TData) => string;
        handleLabel?: string;
      };
  refresh?: false | (() => void);
}

export type DataTableMessages = PaginationMessages & {
  actions: string;
  empty: string;
  loading: string;
  filter: string;
  export: string;
  exportCsv: string;
  exportJson: string;
  refresh: string;
  view: string;
  tableView: string;
  galleryView: string;
  columns: string;
  groupBy: string;
  sortAsc: string;
  sortDesc: string;
  sortClear: string;
  sortBy: string;
  hideColumn: string;
  reorder: string;
  moveUp: string;
  moveDown: string;
  resizeColumn: (column: string) => string;
  listOthers: (count: number) => string;
  selectAllRows: string;
  selectRow: string;
  selected: string;
};

export type DataTableMessageOverrides = Partial<DataTableMessages>;

const messages = {
  en: {
    ...paginationMessages("en"),
    actions: "Actions",
    empty: "No results.",
    loading: "Loading...",
    filter: "Filter results...",
    export: "Export",
    exportCsv: "CSV",
    exportJson: "JSON",
    refresh: "Refresh",
    view: "View",
    tableView: "Table",
    galleryView: "Gallery",
    columns: "Columns",
    groupBy: "Group by",
    sortAsc: "Ascending",
    sortDesc: "Descending",
    sortClear: "Clear sorting",
    sortBy: "Sort by",
    hideColumn: "Hide column",
    reorder: "Drag to reorder",
    moveUp: "Move up",
    moveDown: "Move down",
    resizeColumn: (column: string) => `Resize ${column} column`,
    listOthers: (count: number) =>
      count === 1 ? "and 1 other" : `and ${count} others`,
    selectAllRows: "Select all rows on this page",
    selectRow: "Select row",
    selected: "Selected",
  },
  fr: {
    ...paginationMessages("fr"),
    actions: "Actions",
    empty: "Aucun résultat.",
    loading: "Chargement...",
    filter: "Filtrer les résultats...",
    export: "Exporter",
    exportCsv: "CSV",
    exportJson: "JSON",
    refresh: "Rafraîchir",
    view: "Affichage",
    tableView: "Tableau",
    galleryView: "Galerie",
    columns: "Colonnes",
    groupBy: "Grouper par",
    sortAsc: "Croissant",
    sortDesc: "Décroissant",
    sortClear: "Effacer le tri",
    sortBy: "Trier par",
    hideColumn: "Masquer la colonne",
    reorder: "Glisser pour réordonner",
    moveUp: "Déplacer vers le haut",
    moveDown: "Déplacer vers le bas",
    resizeColumn: (column: string) => `Redimensionner la colonne ${column}`,
    listOthers: (count: number) =>
      count === 1 ? "et 1 autre" : `et ${count} autres`,
    selectAllRows: "Sélectionner toutes les lignes de cette page",
    selectRow: "Sélectionner la ligne",
    selected: "Sélectionnés",
  },
} as const satisfies Record<"en" | "fr", DataTableMessages>;

export const dataTableMessages = (overrides?: DataTableMessageOverrides) => ({
  ...(getLocale().startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

export interface DataTableProps<TData extends RowData> {
  rowData: readonly TData[];
  columnDefs: readonly DataTableColDef<TData>[];
  getRowId?: (row: TData) => string;
  state?: DataTablePublicState;
  initialState?: Partial<DataTablePublicState>;
  onStateChange?: (state: DataTablePublicState) => void;
  status?: DataTableStatus;
  features?: DataTableFeatures<TData>;
  onRowClicked?: (row: TData) => void;
  messages?: DataTableMessageOverrides;
}

export interface DataTableColumn<TData extends RowData> {
  id: string;
  colDef: DataTableColDef<TData>;
  width: number;
}

export interface DataTableModelRow<TData extends RowData> {
  id: string;
  data: TData;
  index: number;
  values: ReadonlyMap<string, unknown>;
}

export interface DataTableModel<TData extends RowData> {
  columns: readonly DataTableColumn<TData>[];
  visibleColumns: readonly DataTableColumn<TData>[];
  rows: readonly DataTableModelRow<TData>[];
  filteredRows: readonly DataTableModelRow<TData>[];
  sortedRows: readonly DataTableModelRow<TData>[];
  pageRows: readonly DataTableModelRow<TData>[];
  pageCount: number;
  totalRows: number;
}

const DEFAULT_MIN_WIDTH = 96;
const DEFAULT_WIDTH = 208;
const DEFAULT_MAX_WIDTH = 640;
const DEFAULT_QUERY: DataTablePublicState = {
  page: 0,
  pageSize: 10,
};

const DEFAULT_UI_STATE: DataTableUiState = {
  columnVisibility: {},
  columnSizing: {},
  rowSelection: {},
  grouping: [],
  collapsedGroups: {},
  view: "table",
};

const persistedUiFromState = (
  state: DataTableUiState,
): DataTablePersistedUiState => ({
  columnVisibility: state.columnVisibility,
  columnSizing: state.columnSizing,
  view: state.view,
});

const transientUiFromState = (
  state: DataTableUiState,
): DataTableTransientUiState => ({
  rowSelection: state.rowSelection,
  grouping: state.grouping,
  collapsedGroups: state.collapsedGroups,
});

const clampWidth = <TData extends RowData>(
  column: DataTableColDef<TData>,
  width: number,
) =>
  Math.min(
    column.maxWidth ?? DEFAULT_MAX_WIDTH,
    Math.max(column.minWidth ?? DEFAULT_MIN_WIDTH, width),
  );

export const normalizeDataTableColumns = <TData extends RowData>(
  columnDefs: readonly DataTableColDef<TData>[],
  columnSizing: Readonly<Record<string, number>> = {},
): DataTableColumn<TData>[] => {
  const ids = new Set<string>();
  return columnDefs.map((colDef) => {
    const id = colDef.field ?? colDef.colId;
    if (!id) {
      throw new Error("DataTable columns require a field or colId");
    }
    if (ids.has(id)) {
      throw new Error(`DataTable column IDs must be unique: ${id}`);
    }
    ids.add(id);
    return {
      id,
      colDef,
      width: clampWidth(
        colDef,
        columnSizing[id] ?? colDef.width ?? DEFAULT_WIDTH,
      ),
    };
  });
};

export const getDataTableWidth = <TData extends RowData>(
  columns: readonly DataTableColumn<TData>[],
  utilityColumns = 0,
) =>
  columns.reduce((total, column) => total + column.width, 0) +
  utilityColumns * 40;

export const buildDataTableRows = <TData extends RowData>(
  rowData: readonly TData[],
  columns: readonly DataTableColumn<TData>[],
  getRowId?: (row: TData) => string,
): DataTableModelRow<TData>[] => {
  const ids = new Set<string>();
  return rowData.map((data, index) => {
    const id = getRowId?.(data) ?? String(index);
    if (ids.has(id)) throw new Error(`DataTable row IDs must be unique: ${id}`);
    ids.add(id);
    return {
      id,
      data,
      index,
      values: new Map(
        columns.map((column) => {
          const { colDef } = column;
          const value = colDef.valueGetter
            ? colDef.valueGetter({ data, rowId: id, rowIndex: index, colDef })
            : colDef.field
              ? data[colDef.field]
              : undefined;
          return [column.id, value];
        }),
      ),
    };
  });
};

export const filterDataTableRows = <TData extends RowData>(
  rows: readonly DataTableModelRow<TData>[],
  columns: readonly DataTableColumn<TData>[],
  globalFilter: string,
): DataTableModelRow<TData>[] => {
  const query = globalFilter.trim().toLocaleLowerCase();
  if (!query) return [...rows];
  const searchable = columns.filter(
    ({ colDef }) => colDef.searchable !== false,
  );
  return rows.filter((row) =>
    searchable.some((column) =>
      String(row.values.get(column.id) ?? "")
        .toLocaleLowerCase()
        .includes(query),
    ),
  );
};

export const sortDataTableRows = <TData extends RowData>(
  rows: readonly DataTableModelRow<TData>[],
  columns: readonly DataTableColumn<TData>[],
  sorting: NonNullable<QueryType["sort"]>,
): DataTableModelRow<TData>[] => {
  const byId = new Map(columns.map((column) => [column.id, column]));
  return rows
    .map((row, stableIndex) => ({ row, stableIndex }))
    .sort((left, right) => {
      for (const sort of sorting) {
        const column = byId.get(sort.id);
        if (!column) continue;
        const leftValue = left.row.values.get(sort.id);
        const rightValue = right.row.values.get(sort.id);
        const comparison = column.colDef.comparator
          ? column.colDef.comparator(
              leftValue,
              rightValue,
              left.row.data,
              right.row.data,
            )
          : Object.is(leftValue, rightValue)
            ? 0
            : leftValue === null || leftValue === undefined
              ? 1
              : rightValue === null || rightValue === undefined
                ? -1
                : Schema.is(Schema.Number)(leftValue) &&
                    Schema.is(Schema.Number)(rightValue)
                  ? leftValue - rightValue
                  : String(leftValue).localeCompare(
                      String(rightValue),
                      undefined,
                      { numeric: true, sensitivity: "base" },
                    );
        if (comparison !== 0)
          return sort.direction === "desc" ? -comparison : comparison;
      }
      return left.stableIndex - right.stableIndex;
    })
    .map(({ row }) => row);
};

export const paginateDataTableRows = <TData extends RowData>(
  rows: readonly DataTableModelRow<TData>[],
  pagination: Pick<QueryType, "page" | "pageSize">,
): DataTableModelRow<TData>[] => {
  const pageSize = Math.max(1, pagination.pageSize);
  const lastPageIndex = Math.max(0, Math.ceil(rows.length / pageSize) - 1);
  const pageIndex = Math.min(lastPageIndex, Math.max(0, pagination.page));
  const start = pageIndex * pageSize;
  return rows.slice(start, start + pageSize);
};

const sameDataTableState = (left: DataTableState, right: DataTableState) =>
  left.page === right.page &&
  left.pageSize === right.pageSize &&
  left.globalFilter === right.globalFilter &&
  left.sort === right.sort &&
  left.columnVisibility === right.columnVisibility &&
  left.columnSizing === right.columnSizing &&
  left.rowSelection === right.rowSelection &&
  left.grouping === right.grouping &&
  left.collapsedGroups === right.collapsedGroups &&
  left.view === right.view;

export const reorderDataTableRows = <TData extends RowData>(
  rows: readonly DataTableModelRow<TData>[],
  sourceRowId: string,
  targetRowId: string,
): TData[] => {
  const sourceIndex = rows.findIndex((row) => row.id === sourceRowId);
  const targetIndex = rows.findIndex((row) => row.id === targetRowId);
  const reordered = rows.map((row) => row.data);
  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return reordered;
  }
  const [source] = reordered.splice(sourceIndex, 1);
  if (source) reordered.splice(targetIndex, 0, source);
  return reordered;
};

type ResolvedConfig<TData extends RowData> = {
  getRowId?: ((row: TData) => string) | undefined;
  onStateChange?: ((state: DataTablePublicState) => void) | undefined;
  onUiStateChange: (state: DataTableUiState) => void;
  status: DataTableStatus;
  features: DataTableFeatures<TData>;
  onRowClicked?: ((row: TData) => void) | undefined;
  labels: DataTableMessages;
};

type PointerDragState = {
  pointerId: number;
  rowId: string;
  label: string;
  startX: number;
  startY: number;
  active: boolean;
};

type DataTableStore<TData extends RowData> = {
  rowData: readonly TData[];
  columnDefs: readonly DataTableColDef<TData>[];
  config: ResolvedConfig<TData>;
  state: DataTableState;
  controlledState?: DataTablePublicState;
  model: DataTableModel<TData>;
};

type TableAtom<TData extends RowData> = Atom.Writable<DataTableStore<TData>>;

const RowIdContext = createContext<string | null>(null);
const ColumnIdContext = createContext<string | null>(null);

const useRequiredId = (
  context: typeof RowIdContext | typeof ColumnIdContext,
) => {
  const id = useContext(context);
  if (!id) throw new Error("DataTable internal ID context is missing");
  return id;
};

const getGroupDropKey = (fieldId: string, groupId: string) =>
  `${encodeURIComponent(fieldId)}:${encodeURIComponent(groupId)}`;

const parseGroupDropKey = (key: string) => {
  const separator = key.indexOf(":");
  if (separator === -1) return null;
  return {
    fieldId: decodeURIComponent(key.slice(0, separator)),
    groupId: decodeURIComponent(key.slice(separator + 1)),
  };
};

const findTableDragTarget = (
  elements: Element[],
  selector: "[data-table-group]" | "[data-table-row]",
  root: HTMLElement | null,
) => {
  for (const element of elements) {
    const target = element.closest(selector);
    if (target instanceof HTMLElement && root?.contains(target)) return target;
  }
  return null;
};

const clearDragPresentation = (root: HTMLElement | null) => {
  root
    ?.querySelectorAll<HTMLElement>(
      "[data-drag-source], [data-drop-target], [data-drop-position]",
    )
    .forEach((element) => {
      element.removeAttribute("data-drag-source");
      element.removeAttribute("data-drop-target");
      element.removeAttribute("data-drop-position");
    });
};

const resolveConfig = <TData extends RowData>(
  props: DataTableProps<TData>,
  onUiStateChange: (state: DataTableUiState) => void,
): ResolvedConfig<TData> => {
  const features = props.features ?? {};
  const selection = features.selection;
  const getRowId =
    (selection && selection.getRowId) || props.getRowId || undefined;
  if ((selection || features.reordering) && !getRowId) {
    throw new Error(
      "DataTable requires getRowId when selection or reordering is enabled",
    );
  }
  return {
    getRowId,
    onStateChange: props.onStateChange,
    onUiStateChange,
    status: props.status ?? {},
    features,
    onRowClicked: props.onRowClicked,
    labels: dataTableMessages(props.messages),
  };
};

const queryFromState = (state: DataTableState): DataTablePublicState => ({
  page: state.page,
  pageSize: state.pageSize,
  globalFilter: state.globalFilter,
  sort: state.sort,
});

const uiFromState = (state: DataTableState): DataTableUiState => ({
  columnVisibility: state.columnVisibility,
  columnSizing: state.columnSizing,
  rowSelection: state.rowSelection,
  grouping: state.grouping,
  collapsedGroups: state.collapsedGroups,
  view: state.view,
});

const sameUiState = (left: DataTableUiState, right: DataTableUiState) =>
  left.columnVisibility === right.columnVisibility &&
  left.columnSizing === right.columnSizing &&
  left.rowSelection === right.rowSelection &&
  left.grouping === right.grouping &&
  left.collapsedGroups === right.collapsedGroups &&
  left.view === right.view;

const sameQueryState = (left: QueryType, right: QueryType) =>
  left.page === right.page &&
  left.pageSize === right.pageSize &&
  left.globalFilter === right.globalFilter &&
  left.sort === right.sort;

const initialPublicState = <TData extends RowData>(
  props: DataTableProps<TData>,
  uiState: DataTableUiState,
): DataTableState => ({
  ...DEFAULT_QUERY,
  ...props.initialState,
  ...props.state,
  ...uiState,
});

type ModelSource<TData extends RowData> = Pick<
  DataTableStore<TData>,
  "columnDefs" | "config" | "rowData" | "state"
>;

const buildDataTableModel = <TData extends RowData>(
  store: ModelSource<TData>,
): DataTableModel<TData> => {
  const columns = normalizeDataTableColumns(
    store.columnDefs,
    store.state.columnSizing,
  );
  const selection = store.config.features.selection;
  const rowId =
    (selection && selection.getRowId) || store.config.getRowId || undefined;
  const rows = buildDataTableRows(store.rowData, columns, rowId);
  const pagination = store.config.features.pagination ?? { mode: "client" };
  const server = pagination !== false && pagination.mode === "server";
  const filteredRows = server
    ? [...rows]
    : filterDataTableRows(rows, columns, store.state.globalFilter ?? "");
  const sortedRows = server
    ? filteredRows
    : sortDataTableRows(filteredRows, columns, store.state.sort ?? []);
  const pageRows =
    pagination === false || server
      ? sortedRows
      : paginateDataTableRows(sortedRows, store.state);
  const totalRows = server ? pagination.rowCount : sortedRows.length;
  return {
    columns,
    visibleColumns: columns.filter(
      ({ id }) => store.state.columnVisibility[id] !== false,
    ),
    rows,
    filteredRows,
    sortedRows,
    pageRows,
    pageCount: Math.max(
      1,
      Math.ceil(totalRows / Math.max(1, store.state.pageSize)),
    ),
    totalRows,
  };
};

const useTableAtom = <TData extends RowData>(tableAtom: TableAtom<TData>) =>
  useAtom(tableAtom);

const changeState = <TData extends RowData>(
  setStore: (
    update: (store: DataTableStore<TData>) => DataTableStore<TData>,
  ) => void,
  update: (state: DataTableState) => DataTableState,
) => {
  setStore((store) => {
    const proposed = update(store.state);
    const query = queryFromState(proposed);
    if (!sameQueryState(query, store.state)) {
      store.config.onStateChange?.(query);
    }
    const uiState = uiFromState(proposed);
    if (!sameUiState(uiState, store.state)) {
      store.config.onUiStateChange(uiState);
    }
    const state = store.controlledState
      ? { ...proposed, ...store.controlledState }
      : proposed;
    if (sameDataTableState(state, store.state)) return store;
    const next = { ...store, state };
    return { ...next, model: buildDataTableModel(next) };
  });
};

const deriveModel = <TData extends RowData>(
  store: DataTableStore<TData>,
): DataTableModel<TData> => store.model;

type GroupSection<TData extends RowData> = {
  key: string;
  groupId: string;
  depth: number;
  field: DataTableGroupingField<TData>;
  rows: DataTableModelRow<TData>[];
  children: GroupSection<TData>[];
};

export const groupDataTableRows = <TData extends RowData>(
  rows: readonly DataTableModelRow<TData>[],
  fields: readonly DataTableGroupingField<TData>[],
  depth = 0,
  parentKey = "",
): GroupSection<TData>[] => {
  const field = fields[0];
  if (!field) return [];
  const groups = new Map<string, DataTableModelRow<TData>[]>();
  field.getGroupIds?.().forEach((id) => groups.set(id, []));
  rows.forEach((row) => {
    const ids = field.getRowGroupIds?.(row.data) ?? [
      field.getGroupId(row.data),
    ];
    ids.forEach((id) => groups.set(id, [...(groups.get(id) ?? []), row]));
  });
  return Array.from(groups, ([groupId, groupRows]) => {
    const segment = `${encodeURIComponent(field.id)}:${encodeURIComponent(groupId)}`;
    const key = `${parentKey}${parentKey ? "/" : ""}${segment}`;
    return {
      key,
      groupId,
      depth,
      field,
      rows: groupRows,
      children: groupDataTableRows(groupRows, fields.slice(1), depth + 1, key),
    };
  });
};

export const getDataTableSelectableRows = <TData extends RowData>(
  model: DataTableModel<TData>,
  grouped: boolean,
  isRowSelectable?: (row: TData) => boolean,
) =>
  (grouped ? model.sortedRows : model.pageRows).filter(
    (row) => isRowSelectable?.(row.data) ?? true,
  );

const getActiveGrouping = <TData extends RowData>(
  store: DataTableStore<TData>,
) => {
  const grouping = store.config.features.grouping;
  if (!grouping) return [];
  return store.state.grouping.flatMap((id) => {
    const field = grouping.fields.find((candidate) => candidate.id === id);
    return field ? [field] : [];
  });
};

const canReorderRows = <TData extends RowData>(
  store: DataTableStore<TData>,
) => {
  const pagination = store.config.features.pagination;
  return (
    !!store.config.features.reordering &&
    !getActiveGrouping(store).length &&
    !store.state.globalFilter &&
    !store.state.sort?.length &&
    !(pagination && pagination.mode === "server")
  );
};

const canMoveRowsToGroups = <TData extends RowData>(
  store: DataTableStore<TData>,
) => getActiveGrouping(store).some((field) => !!field.onMoveToGroup);

const canDragRows = <TData extends RowData>(store: DataTableStore<TData>) =>
  getActiveGrouping(store).length
    ? canMoveRowsToGroups(store)
    : canReorderRows(store);

const hasRowActionMenu = <TData extends RowData>(
  store: DataTableStore<TData>,
) => !!store.config.features.rowActions || canReorderRows(store);

const getSelectedRows = <TData extends RowData>(
  store: DataTableStore<TData>,
  model: DataTableModel<TData>,
) =>
  model.rows
    .filter((row) => store.state.rowSelection[row.id])
    .map((row) => row.data);

const renderCell = <TData extends RowData>(
  row: DataTableModelRow<TData>,
  column: DataTableColumn<TData>,
) => {
  const value = row.values.get(column.id);
  const params = {
    data: row.data,
    value,
    rowId: row.id,
    rowIndex: row.index,
    colDef: column.colDef,
  };
  const CellRenderer = column.colDef.cellRenderer;
  if (CellRenderer) return <CellRenderer {...params} />;
  return (
    column.colDef.valueFormatter?.(params) ??
    (value === null || value === undefined ? null : String(value))
  );
};

const nodeText = (node: ReactNode): string => {
  if (Schema.is(Schema.String)(node) || Schema.is(Schema.Number)(node))
    return String(node);
  if (!isValidElement<{ children?: ReactNode; title?: ReactNode }>(node))
    return "";
  if (Schema.is(Schema.String)(node.props.title)) return node.props.title;
  return nodeText(node.props.children);
};

const columnLabel = <TData extends RowData>(column: DataTableColumn<TData>) =>
  nodeText(column.colDef.headerName) || column.id;

export type CsvValue = string | number | boolean | null | undefined;

const withExtension = (fileName: string, extension: string) =>
  fileName.includes(".")
    ? fileName.replace(/\.[^/.]+$/, `.${extension}`)
    : `${fileName}.${extension}`;

const escapeCsvValue = (value: CsvValue) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const downloadCsv = (
  headers: CsvValue[],
  data: CsvValue[][],
  fileName = "data.csv",
) => {
  const content = [headers, ...data]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
  downloadBlob(
    content,
    "text/csv;charset=utf-8",
    withExtension(fileName, "csv"),
  );
};

export const downloadJson = <TData,>(data: TData, fileName = "data.json") =>
  downloadBlob(
    JSON.stringify(data, null, 2),
    "application/json;charset=utf-8",
    withExtension(fileName, "json"),
  );

const downloadBlob = (content: string, type: string, fileName: string) => {
  const url = window.URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  requestAnimationFrame(() => window.URL.revokeObjectURL(url));
};

export const DataTableRowActions = <TData,>({
  actions,
  row,
  title,
}: {
  actions: readonly DataTableRowAction<TData>[];
  row: TData;
  title?: string;
}) => {
  const visible = actions.filter(
    (action) => !action.visible || action.visible(row),
  );
  if (!visible.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(event) => event.stopPropagation()}
        render={
          <Button
            className="size-8 focus-visible:ring-inset [&_svg:not([class*='size-'])]:size-4"
            size="icon"
            variant="ghost"
          >
            <span className="sr-only">{title}</span>
            <MoreHorizontal />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-max">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visible.map((action) => (
            <DropdownMenuItem
              key={action.id ?? action.name}
              onClick={(event) => {
                event.stopPropagation();
                action.onClick(row);
              }}
              variant={action.variant}
            >
              {action.icon}
              {action.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DataTableRowActionMenu = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store] = useTableAtom(tableAtom);
  const rowId = useRequiredId(RowIdContext);
  const model = deriveModel(store);
  const row = model.sortedRows.find((candidate) => candidate.id === rowId);
  if (!row) return null;

  const rowActions = store.config.features.rowActions || undefined;
  const visibleRows = model.pageRows;
  const rowIndex = visibleRows.findIndex((candidate) => candidate.id === rowId);
  const reordering = store.config.features.reordering;
  const reorderActions: DataTableRowAction<TData>[] = [];
  if (reordering && canReorderRows(store)) {
    const move = (targetIndex: number) =>
      reordering.onReorder(
        reorderDataTableRows(model.rows, rowId, visibleRows[targetIndex]!.id),
      );
    if (rowIndex > 0) {
      reorderActions.push({
        id: "data-table-move-up",
        name: store.config.labels.moveUp,
        icon: <ArrowUp />,
        onClick: () => move(rowIndex - 1),
      });
    }
    if (rowIndex !== -1 && rowIndex < visibleRows.length - 1) {
      reorderActions.push({
        id: "data-table-move-down",
        name: store.config.labels.moveDown,
        icon: <ArrowDown />,
        onClick: () => move(rowIndex + 1),
      });
    }
  }

  return (
    <DataTableRowActions
      actions={[...reorderActions, ...(rowActions ? rowActions.items : [])]}
      row={row.data}
      title={rowActions?.label ?? store.config.labels.actions}
    />
  );
};

const DataTableToolbar = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const { features, labels } = store.config;
  const model = deriveModel(store);
  const selectedRows = getSelectedRows(store, model);
  const grouping = features.grouping;
  const bulkActions = features.selection && features.selection.bulkActions;
  const hasToolbar =
    features.search !== false ||
    features.sorting !== false ||
    features.columnVisibility !== false ||
    !!features.export ||
    !!features.gallery ||
    !!grouping ||
    !!features.refresh ||
    (!!bulkActions && selectedRows.length > 0);
  if (!hasToolbar) return null;

  const update = (next: (state: DataTableState) => DataTableState) =>
    changeState(setStore, next);
  const visibleBulkActions = bulkActions
    ? bulkActions.items.filter(
        (action) => !action.visible || action.visible(selectedRows),
      )
    : [];
  const exportRows =
    features.export && features.export.scope === "filteredRows"
      ? model.filteredRows
      : model.pageRows;

  return (
    <div className="flex flex-col gap-2 pb-4">
      {features.search !== false ? (
        <div className="relative min-w-0">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="px-9"
            onChange={(event) =>
              update((state) => ({
                ...state,
                globalFilter: event.target.value,
                page: 0,
              }))
            }
            placeholder={labels.filter}
            value={store.state.globalFilter ?? ""}
          />
          {store.state.globalFilter ? (
            <Button
              aria-label={labels.filter}
              className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
              onClick={() =>
                update((state) => ({
                  ...state,
                  globalFilter: undefined,
                  page: 0,
                }))
              }
              size="icon"
              variant="ghost"
            >
              <X />
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="-m-1 flex w-full overflow-x-auto p-1">
        <Menubar className="h-auto w-max min-w-full justify-start bg-transparent shadow-none [&_[data-slot=menubar-trigger]]:gap-2 [&_[data-slot=menubar-trigger]_svg]:size-4">
          {visibleBulkActions.length ? (
            <MenubarMenu>
              <MenubarTrigger className="bg-primary text-primary-foreground hover:bg-primary/90 aria-expanded:bg-primary/90">
                {labels.selected}
                <Badge variant="secondary">{selectedRows.length}</Badge>
                <ChevronDown />
              </MenubarTrigger>
              <MenubarContent align="end" className="w-max">
                <MenubarGroup>
                  <MenubarLabel>
                    {bulkActions && bulkActions.label
                      ? bulkActions.label
                      : labels.actions}
                  </MenubarLabel>
                  <MenubarSeparator />
                  {visibleBulkActions.map((action) => (
                    <MenubarItem
                      key={action.id ?? action.name}
                      onClick={() => action.onClick(selectedRows)}
                      variant={action.variant}
                    >
                      {action.icon}
                      {action.name}
                    </MenubarItem>
                  ))}
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          ) : null}
          {grouping ? (
            <MenubarMenu>
              <MenubarTrigger aria-label={labels.groupBy}>
                <Rows3 />
                <span className="hidden sm:inline">{labels.groupBy}</span>
              </MenubarTrigger>
              <MenubarContent align="end">
                <MenubarGroup>
                  <MenubarLabel>{labels.groupBy}</MenubarLabel>
                  <MenubarSeparator />
                  {grouping.fields.map((field) => (
                    <MenubarCheckboxItem
                      checked={store.state.grouping.includes(field.id)}
                      key={field.id}
                      onCheckedChange={(checked) =>
                        update((state) => ({
                          ...state,
                          grouping: checked
                            ? [...state.grouping, field.id]
                            : state.grouping.filter((id) => id !== field.id),
                        }))
                      }
                    >
                      {field.label}
                    </MenubarCheckboxItem>
                  ))}
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          ) : null}
          {features.sorting !== false ? (
            <SortMenu tableAtom={tableAtom} />
          ) : null}
          {features.gallery ? <ViewMenu tableAtom={tableAtom} /> : null}
          {features.columnVisibility !== false ? (
            <ColumnMenu tableAtom={tableAtom} />
          ) : null}
          {features.refresh ? (
            <MenubarMenu>
              <MenubarTrigger
                aria-label={labels.refresh}
                onClick={features.refresh}
              >
                <RefreshCw />
                <span className="hidden sm:inline">{labels.refresh}</span>
              </MenubarTrigger>
            </MenubarMenu>
          ) : null}
          {features.export ? (
            <MenubarMenu>
              <MenubarTrigger
                aria-label={labels.export}
                disabled={!exportRows.length}
              >
                <Download />
                <span className="hidden sm:inline">{labels.export}</span>
              </MenubarTrigger>
              <MenubarContent align="end">
                <MenubarGroup>
                  <MenubarLabel>{labels.export}</MenubarLabel>
                  <MenubarSeparator />
                  <MenubarItem
                    onClick={() =>
                      downloadCsv(
                        model.visibleColumns.map(columnLabel),
                        exportRows.map((row) =>
                          model.visibleColumns.map((column) =>
                            String(row.values.get(column.id) ?? ""),
                          ),
                        ),
                        features.export ? features.export.baseName : "table",
                      )
                    }
                  >
                    <FileText />
                    {labels.exportCsv}
                  </MenubarItem>
                  <MenubarItem
                    onClick={() =>
                      downloadJson(
                        exportRows.map((row) =>
                          Object.fromEntries(
                            model.visibleColumns.map((column) => [
                              column.id,
                              row.values.get(column.id),
                            ]),
                          ),
                        ),
                        features.export ? features.export.baseName : "table",
                      )
                    }
                  >
                    <FileJson />
                    {labels.exportJson}
                  </MenubarItem>
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          ) : null}
        </Menubar>
      </div>
    </div>
  );
};

const SortMenu = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const columns = deriveModel(store).columns.filter(
    ({ colDef }) => colDef.sortable !== false,
  );
  if (!columns.length) return null;
  const current = store.state.sort?.[0];
  const sort = (id: string, direction: SortDirection) =>
    changeState(setStore, (state) => ({
      ...state,
      sort: [{ id, direction }],
      page: 0,
    }));
  return (
    <MenubarMenu>
      <MenubarTrigger aria-label={store.config.labels.sortBy}>
        {current ? (
          current.direction === "desc" ? (
            <ArrowDown />
          ) : (
            <ArrowUp />
          )
        ) : (
          <ChevronsUpDown />
        )}
        <span className="hidden sm:inline">{store.config.labels.sortBy}</span>
      </MenubarTrigger>
      <MenubarContent align="end" className="w-52">
        {columns.map((column) => {
          const sortState = store.state.sort?.find(
            ({ id }) => id === column.id,
          );
          return (
            <MenubarSub key={column.id}>
              <MenubarSubTrigger>
                {sortState ? (
                  sortState.direction === "desc" ? (
                    <ArrowDown />
                  ) : (
                    <ArrowUp />
                  )
                ) : null}
                {columnLabel(column)}
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onClick={() => sort(column.id, "asc")}>
                  <ArrowUp /> {store.config.labels.sortAsc}
                </MenubarItem>
                <MenubarItem onClick={() => sort(column.id, "desc")}>
                  <ArrowDown /> {store.config.labels.sortDesc}
                </MenubarItem>
                {sortState ? (
                  <>
                    <MenubarSeparator />
                    <MenubarItem
                      onClick={() =>
                        changeState(setStore, (state) => ({
                          ...state,
                          sort: state.sort?.filter(
                            ({ id }) => id !== column.id,
                          ),
                        }))
                      }
                    >
                      <X /> {store.config.labels.sortClear}
                    </MenubarItem>
                  </>
                ) : null}
              </MenubarSubContent>
            </MenubarSub>
          );
        })}
      </MenubarContent>
    </MenubarMenu>
  );
};

const ViewMenu = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  return (
    <MenubarMenu>
      <MenubarTrigger aria-label={store.config.labels.view}>
        {store.state.view === "gallery" ? <LayoutGrid /> : <Rows3 />}
        <span className="hidden sm:inline">{store.config.labels.view}</span>
      </MenubarTrigger>
      <MenubarContent align="end">
        <MenubarRadioGroup
          onValueChange={(view) => {
            if (view === "table" || view === "gallery") {
              changeState(setStore, (state) => ({ ...state, view }));
            }
          }}
          value={store.state.view}
        >
          <MenubarRadioItem value="table">
            <Rows3 /> {store.config.labels.tableView}
          </MenubarRadioItem>
          <MenubarRadioItem value="gallery">
            <LayoutGrid /> {store.config.labels.galleryView}
          </MenubarRadioItem>
        </MenubarRadioGroup>
      </MenubarContent>
    </MenubarMenu>
  );
};

const ColumnMenu = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const columns = deriveModel(store).columns.filter(
    ({ colDef }) => colDef.hideable !== false,
  );
  if (!columns.length) return null;
  return (
    <MenubarMenu>
      <MenubarTrigger aria-label={store.config.labels.columns}>
        <Settings2 />
        <span className="hidden sm:inline">{store.config.labels.columns}</span>
      </MenubarTrigger>
      <MenubarContent align="end">
        <MenubarGroup>
          <MenubarLabel>{store.config.labels.columns}</MenubarLabel>
          <MenubarSeparator />
          {columns.map((column) => (
            <MenubarCheckboxItem
              checked={store.state.columnVisibility[column.id] !== false}
              key={column.id}
              onCheckedChange={(visible) =>
                changeState(setStore, (state) => ({
                  ...state,
                  columnVisibility: {
                    ...state.columnVisibility,
                    [column.id]: visible,
                  },
                }))
              }
            >
              {columnLabel(column)}
            </MenubarCheckboxItem>
          ))}
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  );
};

const ResizeHandle = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const columnId = useRequiredId(ColumnIdContext);
  const column = deriveModel(store).columns.find(({ id }) => id === columnId);
  if (!column || column.colDef.resizable === false) return null;
  const resize = (width: number) =>
    changeState(setStore, (state) => ({
      ...state,
      columnSizing: {
        ...state.columnSizing,
        [column.id]: clampWidth(column.colDef, width),
      },
    }));
  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.startX = String(event.clientX);
    event.currentTarget.dataset.startWidth = String(column.width);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const startX = Number(event.currentTarget.dataset.startX);
    const startWidth = Number(event.currentTarget.dataset.startWidth);
    resize(startWidth + event.clientX - startX);
  };
  return (
    <button
      aria-label={store.config.labels.resizeColumn(columnLabel(column))}
      aria-orientation="vertical"
      aria-valuemax={column.colDef.maxWidth ?? DEFAULT_MAX_WIDTH}
      aria-valuemin={column.colDef.minWidth ?? DEFAULT_MIN_WIDTH}
      aria-valuenow={column.width}
      className="hover:bg-primary/60 absolute inset-y-0 right-0 z-10 w-1 cursor-col-resize touch-none"
      onDoubleClick={() => resize(column.colDef.width ?? DEFAULT_WIDTH)}
      onKeyDown={(event) => {
        const delta =
          event.key === "ArrowLeft" ? -8 : event.key === "ArrowRight" ? 8 : 0;
        if (delta) {
          event.preventDefault();
          resize(column.width + delta);
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      role="separator"
      type="button"
    />
  );
};

const DragHandle = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const rowId = useRequiredId(RowIdContext);
  const dragRef = useRef<PointerDragState | null>(null);
  const [overlay, setOverlay] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const reset = (element: HTMLElement) => {
    clearDragPresentation(element.closest<HTMLElement>("[data-table-root]"));
    dragRef.current = null;
    setOverlay(null);
  };
  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const row = deriveModel(store).rows.find(
      (candidate) => candidate.id === rowId,
    );
    const grouping = store.config.features.grouping;
    const reordering = store.config.features.reordering;
    dragRef.current = {
      pointerId: event.pointerId,
      rowId,
      label:
        (row && grouping && grouping.getRowLabel?.(row.data)) ||
        (row && reordering && reordering.getRowLabel?.(row.data)) ||
        rowId,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
    };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const root = event.currentTarget.closest<HTMLElement>("[data-table-root]");
    const active =
      drag.active ||
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 8;
    drag.active = active;
    clearDragPresentation(root);
    if (!active) return;

    const elements = document.elementsFromPoint(event.clientX, event.clientY);
    const rowTarget = findTableDragTarget(elements, "[data-table-row]", root);
    const groupTarget = findTableDragTarget(
      elements,
      "[data-table-group]",
      root,
    );
    event.currentTarget
      .closest<HTMLElement>("[data-table-row]")
      ?.setAttribute("data-drag-source", "true");
    if (canMoveRowsToGroups(store)) {
      groupTarget?.setAttribute("data-drop-target", "true");
    } else if (rowTarget?.dataset.tableRow !== drag.rowId) {
      const rows = deriveModel(store).pageRows;
      const sourceIndex = rows.findIndex((row) => row.id === drag.rowId);
      const targetIndex = rows.findIndex(
        (row) => row.id === rowTarget?.dataset.tableRow,
      );
      if (sourceIndex !== -1 && targetIndex !== -1) {
        rowTarget?.setAttribute(
          "data-drop-position",
          sourceIndex < targetIndex ? "after" : "before",
        );
      }
    }
    setOverlay({ label: drag.label, x: event.clientX, y: event.clientY });
  };
  const finish = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const root = event.currentTarget.closest<HTMLElement>("[data-table-root]");
    const elements = document.elementsFromPoint(event.clientX, event.clientY);
    const rowTarget = findTableDragTarget(elements, "[data-table-row]", root);
    const groupTarget = findTableDragTarget(
      elements,
      "[data-table-group]",
      root,
    );
    setStore((current) => {
      const targetRowId = rowTarget?.dataset.tableRow;
      const targetGroupKey = groupTarget?.dataset.tableGroup;
      const model = deriveModel(current);
      const source = model.sortedRows.find((row) => row.id === drag.rowId);
      const grouping = current.config.features.grouping;
      const reordering = current.config.features.reordering;
      if (drag.active && source && targetGroupKey && grouping) {
        const target = parseGroupDropKey(targetGroupKey);
        const field = grouping.fields.find(({ id }) => id === target?.fieldId);
        if (
          target &&
          field?.onMoveToGroup &&
          field.getGroupId(source.data) !== target.groupId
        ) {
          field.onMoveToGroup(source.data, target.groupId);
        }
      } else if (
        drag.active &&
        source &&
        targetRowId &&
        reordering &&
        canReorderRows(current) &&
        source.id !== targetRowId
      ) {
        reordering.onReorder(
          reorderDataTableRows(model.rows, source.id, targetRowId),
        );
      }
      return current;
    });
    reset(event.currentTarget);
  };
  const cancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      reset(event.currentTarget);
    }
  };
  const reorderWithKeyboard = (direction: -1 | 1) => {
    const reordering = store.config.features.reordering;
    if (!reordering || !canReorderRows(store)) return;
    const model = deriveModel(store);
    const visibleRows = model.pageRows;
    const sourceIndex = visibleRows.findIndex((row) => row.id === rowId);
    const target = visibleRows[sourceIndex + direction];
    if (sourceIndex !== -1 && target) {
      reordering.onReorder(reorderDataTableRows(model.rows, rowId, target.id));
    }
  };
  return (
    <>
      <Button
        aria-label={
          store.config.features.reordering &&
          store.config.features.reordering.handleLabel
            ? store.config.features.reordering.handleLabel
            : store.config.labels.reorder
        }
        className="size-8 cursor-grab touch-none active:cursor-grabbing"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            event.stopPropagation();
            reorderWithKeyboard(event.key === "ArrowUp" ? -1 : 1);
          }
        }}
        onPointerCancel={cancel}
        onPointerDown={onPointerDown}
        onLostPointerCapture={cancel}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        size="icon"
        variant="ghost"
      >
        <GripVertical />
      </Button>
      {overlay
        ? createPortal(
            <div
              aria-hidden="true"
              className="bg-background pointer-events-none fixed z-[100] rounded-md border px-3 py-2 text-sm shadow-lg"
              style={{ left: overlay.x + 12, top: overlay.y + 12 }}
            >
              {overlay.label}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

const toggleRow = <TData extends RowData>(
  store: DataTableStore<TData>,
  setStore: (
    update: (store: DataTableStore<TData>) => DataTableStore<TData>,
  ) => void,
  rowId: string,
  selected: boolean,
) =>
  changeState(setStore, (state) => {
    const rowSelection = { ...state.rowSelection, [rowId]: selected };
    const selection = store.config.features.selection;
    if (selection) {
      const model = deriveModel(store);
      selection.onSelectionChange?.(
        model.rows.filter((row) => rowSelection[row.id]).map((row) => row.data),
      );
    }
    return { ...state, rowSelection };
  });

const TableDataRow = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const rowId = useRequiredId(RowIdContext);
  const model = deriveModel(store);
  const row = model.sortedRows.find((candidate) => candidate.id === rowId);
  if (!row) return null;
  const selection = store.config.features.selection;
  const selectable =
    !!selection && (selection.isRowSelectable?.(row.data) ?? true);
  const draggable = canDragRows(store);
  return (
    <TableRow
      className={cn(
        "group/row h-16 data-[drag-source=true]:opacity-40 data-[drop-position=before]:[&>td]:border-t-2 data-[drop-position=before]:[&>td]:border-primary data-[drop-position=after]:[&>td]:border-b-2 data-[drop-position=after]:[&>td]:border-primary",
        store.config.onRowClicked && "cursor-pointer",
      )}
      data-state={store.state.rowSelection[row.id] && "selected"}
      data-table-row={row.id}
      onClick={() => store.config.onRowClicked?.(row.data)}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          store.config.onRowClicked &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          store.config.onRowClicked(row.data);
        }
      }}
      tabIndex={store.config.onRowClicked ? 0 : undefined}
    >
      {selection ? (
        <TableCell
          className="w-10 pr-0"
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            aria-label={store.config.labels.selectRow}
            checked={!!store.state.rowSelection[row.id]}
            disabled={!selectable}
            onCheckedChange={(checked) =>
              toggleRow(store, setStore, row.id, checked)
            }
          />
        </TableCell>
      ) : null}
      {draggable ? (
        <TableCell className="w-10 pr-0">
          <DragHandle tableAtom={tableAtom} />
        </TableCell>
      ) : null}
      {model.visibleColumns.map((column) => (
        <TableCell
          className={cn(
            "min-w-24 overflow-hidden",
            column.colDef.truncate ? "whitespace-nowrap" : "whitespace-normal",
          )}
          key={column.id}
          style={{ width: column.width }}
        >
          <div className={cn("min-w-0", column.colDef.truncate && "truncate")}>
            {renderCell(row, column)}
          </div>
        </TableCell>
      ))}
      {hasRowActionMenu(store) ? (
        <TableCell
          className="bg-background group-data-[state=selected]/row:bg-muted sticky right-0 z-20 w-10 min-w-10 cursor-default p-0 transition-colors group-hover/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--background))]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-16 items-center justify-center">
            <DataTableRowActionMenu tableAtom={tableAtom} />
          </div>
        </TableCell>
      ) : null}
    </TableRow>
  );
};

const GroupActions = ({
  actions,
  groupId,
  title,
}: {
  actions?: readonly DataTableGroupAction[];
  groupId: string;
  title: string;
}) => {
  const visible = actions?.filter(
    (action) => !action.visible || action.visible(groupId),
  );
  if (!visible?.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(event) => event.stopPropagation()}
        render={
          <Button size="icon" variant="ghost">
            <span className="sr-only">{title}</span>
            <MoreHorizontal />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {visible.map((action) => (
            <DropdownMenuItem
              key={action.name}
              onClick={() => action.onClick(groupId)}
              variant={action.variant}
            >
              {action.icon} {action.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const GroupedTable = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const model = deriveModel(store);
  const sections = groupDataTableRows(
    model.sortedRows,
    getActiveGrouping(store),
  );
  const extra =
    (store.config.features.selection ? 1 : 0) +
    (hasRowActionMenu(store) ? 1 : 0) +
    (canDragRows(store) ? 1 : 0);
  const renderSections = (items: GroupSection<TData>[]): ReactNode =>
    items.flatMap((section) => {
      const collapsed = !!store.state.collapsedGroups[section.key];
      const targetKey = getGroupDropKey(section.field.id, section.groupId);
      const toggleCollapsed = () =>
        changeState(setStore, (state) => ({
          ...state,
          collapsedGroups: {
            ...state.collapsedGroups,
            [section.key]: !collapsed,
          },
        }));
      const body = (
        <TableBody
          className="data-[drop-target=true]:outline-primary relative data-[drop-target=true]:z-30 data-[drop-target=true]:outline-2 data-[drop-target=true]:-outline-offset-2 data-[drop-target=true]:[&>tr]:border-transparent data-[drop-target=true]:[&>tr>td:last-child]:z-0"
          data-table-group={section.field.onMoveToGroup ? targetKey : undefined}
          key={section.key}
        >
          <TableRow
            className="bg-muted/40 hover:bg-accent! cursor-pointer"
            onClick={toggleCollapsed}
          >
            <TableCell colSpan={model.visibleColumns.length + extra}>
              <div
                className="flex items-center gap-2"
                style={{ paddingLeft: section.depth * 20 }}
              >
                <button
                  aria-expanded={!collapsed}
                  className="flex flex-1 cursor-pointer items-center gap-2 text-left font-medium"
                  type="button"
                >
                  {collapsed ? (
                    <ChevronRight className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  <span className="flex-1">
                    {section.field.renderGroupLabel?.(
                      section.groupId,
                      section.rows.map((row) => row.data),
                    ) ?? section.groupId}
                  </span>
                </button>
                <Badge variant="secondary">{section.rows.length}</Badge>
                <GroupActions
                  actions={section.field.actions}
                  groupId={section.groupId}
                  title={
                    section.field.actionsLabel ?? store.config.labels.actions
                  }
                />
              </div>
            </TableCell>
          </TableRow>
          {!collapsed && !section.children.length
            ? section.rows.length
              ? section.rows.map((row) => (
                  <RowIdContext.Provider
                    key={`${section.key}:${row.id}`}
                    value={row.id}
                  >
                    <TableDataRow tableAtom={tableAtom} />
                  </RowIdContext.Provider>
                ))
              : [
                  <TableRow key={`${section.key}:empty`}>
                    <TableCell
                      className="text-muted-foreground h-16"
                      colSpan={model.visibleColumns.length + extra}
                    >
                      {section.field.renderEmptyGroup?.(section.groupId) ??
                        store.config.labels.empty}
                    </TableCell>
                  </TableRow>,
                ]
            : null}
        </TableBody>
      );
      return !collapsed && section.children.length
        ? [body, renderSections(section.children)]
        : [body];
    });
  return <>{renderSections(sections)}</>;
};

const ColumnHeaderMenu = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const columnId = useRequiredId(ColumnIdContext);
  const column = deriveModel(store).columns.find(({ id }) => id === columnId);
  if (!column) return null;
  const sortingEnabled =
    store.config.features.sorting !== false && column.colDef.sortable !== false;
  const hidingEnabled =
    store.config.features.columnVisibility !== false &&
    column.colDef.hideable !== false;
  const sort = store.state.sort?.find(({ id }) => id === column.id);
  const update = (next: (state: DataTableState) => DataTableState) =>
    changeState(setStore, next);
  const setSort = (direction: SortDirection) =>
    update((state) => ({
      ...state,
      sort: [{ id: column.id, direction }],
      page: 0,
    }));
  const label = columnLabel(column);

  if (!sortingEnabled && !hidingEnabled) {
    return <div className="truncate">{column.colDef.headerName}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={label}
            className="h-8 max-w-full justify-start px-2"
            size="sm"
            variant="ghost"
          >
            <span className="truncate">{column.colDef.headerName}</span>
            {sort ? (
              sort.direction === "desc" ? (
                <ArrowDown />
              ) : (
                <ArrowUp />
              )
            ) : sortingEnabled ? (
              <ChevronsUpDown />
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuGroup>
          {sortingEnabled ? (
            <>
              <DropdownMenuItem onClick={() => setSort("asc")}>
                <ArrowUp /> {store.config.labels.sortAsc}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("desc")}>
                <ArrowDown /> {store.config.labels.sortDesc}
              </DropdownMenuItem>
              {sort ? (
                <DropdownMenuItem
                  onClick={() =>
                    update((state) => ({
                      ...state,
                      sort: state.sort?.filter(({ id }) => id !== column.id),
                    }))
                  }
                >
                  <X /> {store.config.labels.sortClear}
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
          {sortingEnabled && hidingEnabled ? <DropdownMenuSeparator /> : null}
          {hidingEnabled ? (
            <DropdownMenuItem
              onClick={() =>
                update((state) => ({
                  ...state,
                  columnVisibility: {
                    ...state.columnVisibility,
                    [column.id]: false,
                  },
                }))
              }
            >
              <EyeOff /> {store.config.labels.hideColumn}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DataTableHeader = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const model = deriveModel(store);
  const selection = store.config.features.selection;
  const grouped = getActiveGrouping(store).length > 0;
  const draggable = canDragRows(store);
  const selectableRows = getDataTableSelectableRows(
    model,
    grouped,
    selection ? selection.isRowSelectable : undefined,
  );
  const allSelected =
    selectableRows.length > 0 &&
    selectableRows.every((row) => store.state.rowSelection[row.id]);
  const someSelected = selectableRows.some(
    (row) => store.state.rowSelection[row.id],
  );
  return (
    <TableHeader>
      <TableRow>
        {selection ? (
          <TableHead className="w-10 pr-0">
            <Checkbox
              aria-label={store.config.labels.selectAllRows}
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onCheckedChange={(checked) => {
                changeState(setStore, (state) => {
                  const rowSelection = { ...state.rowSelection };
                  selectableRows.forEach(
                    (row) => (rowSelection[row.id] = checked),
                  );
                  selection.onSelectionChange?.(
                    model.rows
                      .filter((row) => rowSelection[row.id])
                      .map((row) => row.data),
                  );
                  return { ...state, rowSelection };
                });
              }}
            />
          </TableHead>
        ) : null}
        {draggable ? <TableHead className="w-10" /> : null}
        {model.visibleColumns.map((column) => {
          return (
            <TableHead
              className="relative h-12"
              key={column.id}
              style={{ width: column.width }}
            >
              <ColumnIdContext.Provider value={column.id}>
                <ColumnHeaderMenu tableAtom={tableAtom} />
                <ResizeHandle tableAtom={tableAtom} />
              </ColumnIdContext.Provider>
            </TableHead>
          );
        })}
        {hasRowActionMenu(store) ? <TableHead className="w-10" /> : null}
      </TableRow>
    </TableHeader>
  );
};

const DataTableBody = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store] = useTableAtom(tableAtom);
  const model = deriveModel(store);
  const grouped = getActiveGrouping(store).length > 0;
  const rows = grouped ? model.sortedRows : model.pageRows;
  const colSpan =
    model.visibleColumns.length +
    (store.config.features.selection ? 1 : 0) +
    (hasRowActionMenu(store) ? 1 : 0) +
    (canDragRows(store) ? 1 : 0);
  if (grouped && rows.length && !store.config.status.error) {
    return <GroupedTable tableAtom={tableAtom} />;
  }
  return (
    <TableBody>
      {store.config.status.error ||
      (!rows.length && !store.config.status.loading) ? (
        <TableRow>
          <TableCell
            className="h-24 text-center"
            colSpan={Math.max(colSpan, 1)}
          >
            {store.config.status.error ??
              store.config.status.empty ??
              store.config.labels.empty}
          </TableCell>
        </TableRow>
      ) : store.config.status.loading && !rows.length ? (
        <TableRow>
          <TableCell
            className="h-24 text-center"
            colSpan={Math.max(colSpan, 1)}
          >
            <Loading label={store.config.labels.loading} />
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <RowIdContext.Provider key={row.id} value={row.id}>
            <TableDataRow tableAtom={tableAtom} />
          </RowIdContext.Provider>
        ))
      )}
    </TableBody>
  );
};

const GalleryCard = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const rowId = useRequiredId(RowIdContext);
  const model = deriveModel(store);
  const row = model.sortedRows.find((candidate) => candidate.id === rowId);
  const gallery = store.config.features.gallery;
  if (!row || !gallery) return null;
  const find = (id?: string) =>
    id ? model.visibleColumns.find((column) => column.id === id) : undefined;
  const name = find(gallery.name);
  const description = find(gallery.description);
  const tag = find(gallery.tag);
  const selection = store.config.features.selection;
  const selectable =
    !!selection && (selection.isRowSelectable?.(row.data) ?? true);
  const draggable = canDragRows(store);
  return (
    <Card
      className={cn(
        "relative gap-3 data-[drag-source=true]:opacity-40 data-[drop-position=before]:border-t-2 data-[drop-position=before]:border-t-primary data-[drop-position=after]:border-b-2 data-[drop-position=after]:border-b-primary",
        store.config.onRowClicked && "cursor-pointer",
      )}
      data-table-row={row.id}
      onClick={() => store.config.onRowClicked?.(row.data)}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          store.config.onRowClicked &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          store.config.onRowClicked(row.data);
        }
      }}
      tabIndex={store.config.onRowClicked ? 0 : undefined}
    >
      <CardHeader className="pr-12">
        <div className="flex items-center gap-2">
          {selection ? (
            <Checkbox
              aria-label={store.config.labels.selectRow}
              checked={!!store.state.rowSelection[row.id]}
              disabled={!selectable}
              onCheckedChange={(checked) =>
                toggleRow(store, setStore, row.id, checked)
              }
              onClick={(event) => event.stopPropagation()}
            />
          ) : null}
          {draggable ? <DragHandle tableAtom={tableAtom} /> : null}
          {tag ? (
            <Badge variant="secondary">
              {gallery.tagIcon}
              {renderCell(row, tag)}
            </Badge>
          ) : null}
        </div>
        <CardTitle>{name ? renderCell(row, name) : row.id}</CardTitle>
        {description ? (
          <div className="text-muted-foreground line-clamp-3 text-sm">
            {renderCell(row, description)}
          </div>
        ) : null}
        {hasRowActionMenu(store) ? (
          <div
            className="absolute top-4 right-4"
            onClick={(event) => event.stopPropagation()}
          >
            <DataTableRowActionMenu tableAtom={tableAtom} />
          </div>
        ) : null}
      </CardHeader>
    </Card>
  );
};

const DataTableGallery = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const model = deriveModel(store);
  const fields = getActiveGrouping(store);
  const rows = fields.length ? model.sortedRows : model.pageRows;
  if (store.config.status.error) {
    return (
      <div className="text-destructive rounded-lg border border-dashed p-10 text-center">
        {store.config.status.error}
      </div>
    );
  }
  if (store.config.status.loading && !rows.length) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <Loading label={store.config.labels.loading} />
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center">
        {store.config.status.empty ?? store.config.labels.empty}
      </div>
    );
  }
  if (!fields.length) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <RowIdContext.Provider key={row.id} value={row.id}>
            <GalleryCard tableAtom={tableAtom} />
          </RowIdContext.Provider>
        ))}
      </div>
    );
  }
  const renderSections = (sections: GroupSection<TData>[]): ReactNode =>
    sections.map((section) => {
      const collapsed = !!store.state.collapsedGroups[section.key];
      const targetKey = getGroupDropKey(section.field.id, section.groupId);
      const toggleCollapsed = () =>
        changeState(setStore, (state) => ({
          ...state,
          collapsedGroups: {
            ...state.collapsedGroups,
            [section.key]: !collapsed,
          },
        }));
      return (
        <section
          className="data-[drop-target=true]:ring-primary space-y-3 rounded-lg transition-shadow data-[drop-target=true]:ring-2"
          data-table-group={section.field.onMoveToGroup ? targetKey : undefined}
          key={section.key}
        >
          <div
            className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors"
            onClick={toggleCollapsed}
          >
            <button
              aria-expanded={!collapsed}
              className="flex flex-1 cursor-pointer items-center gap-2 text-left font-medium"
              type="button"
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
              <span className="flex-1">
                {section.field.renderGroupLabel?.(
                  section.groupId,
                  section.rows.map((row) => row.data),
                ) ?? section.groupId}
              </span>
              <Badge variant="secondary">{section.rows.length}</Badge>
            </button>
            <GroupActions
              actions={section.field.actions}
              groupId={section.groupId}
              title={section.field.actionsLabel ?? store.config.labels.actions}
            />
          </div>
          {!collapsed ? (
            section.children.length ? (
              renderSections(section.children)
            ) : section.rows.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {section.rows.map((row) => (
                  <RowIdContext.Provider
                    key={`${section.key}:${row.id}`}
                    value={row.id}
                  >
                    <GalleryCard tableAtom={tableAtom} />
                  </RowIdContext.Provider>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
                {section.field.renderEmptyGroup?.(section.groupId) ??
                  store.config.labels.empty}
              </div>
            )
          ) : null}
        </section>
      );
    });
  return (
    <div className="space-y-4">
      {renderSections(groupDataTableRows(rows, fields))}
    </div>
  );
};

const DataTablePagination = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store, setStore] = useTableAtom(tableAtom);
  const model = deriveModel(store);
  const pagination = store.config.features.pagination ?? { mode: "client" };
  const clientGrouping =
    pagination !== false &&
    pagination.mode === "client" &&
    getActiveGrouping(store).length > 0;
  const paginationVisible = pagination !== false && !clientGrouping;
  const pageIndex = store.state.page;
  const maxPageIndex = model.pageCount - 1;
  useLayoutEffect(() => {
    if (paginationVisible && pageIndex > maxPageIndex) {
      changeState(setStore, (state) => ({
        ...state,
        page: maxPageIndex,
      }));
    }
  }, [maxPageIndex, pageIndex, paginationVisible, setStore]);
  if (!paginationVisible) return null;
  const selected = model.rows.filter(
    (row) => store.state.rowSelection[row.id],
  ).length;
  const setPagination = (next: Pick<QueryType, "page" | "pageSize">) =>
    changeState(setStore, (state) => ({ ...state, ...next }));
  return (
    <div className="pt-4">
      <Pagination
        messages={store.config.labels}
        onPageChange={(page) =>
          setPagination({ page, pageSize: store.state.pageSize })
        }
        onPageSizeChange={(pageSize) => setPagination({ page: 0, pageSize })}
        page={Math.min(store.state.page, model.pageCount - 1)}
        pageCount={model.pageCount}
        pageSize={store.state.pageSize}
        pageSizes={pagination.pageSizes}
        selectedRows={selected}
        totalRows={model.totalRows}
      />
    </div>
  );
};

type HydratedDataTableProps<TData extends RowData> = DataTableProps<TData> & {
  persistedUiState: DataTablePersistedUiState;
  setPersistedUiState: (state: DataTablePersistedUiState) => void;
};

const HydratedDataTable = <TData extends RowData>({
  persistedUiState,
  setPersistedUiState,
  ...props
}: HydratedDataTableProps<TData>) => {
  const transientUiAtomRef =
    useRef<Atom.Writable<DataTableTransientUiState> | null>(null);
  if (!transientUiAtomRef.current) {
    const grouping = props.features?.grouping;
    transientUiAtomRef.current = Atom.make({
      ...transientUiFromState(DEFAULT_UI_STATE),
      grouping: grouping && grouping.initial ? grouping.initial : [],
    });
  }
  const [transientUiState, setTransientUiState] = useAtom(
    transientUiAtomRef.current,
  );
  const uiState: DataTableUiState = useMemo(
    () => ({ ...persistedUiState, ...transientUiState }),
    [persistedUiState, transientUiState],
  );
  const setUiState = useCallback(
    (state: DataTableUiState) => {
      setPersistedUiState(persistedUiFromState(state));
      setTransientUiState(transientUiFromState(state));
    },
    [setPersistedUiState, setTransientUiState],
  );
  const validatedConfig = resolveConfig(props, (state) => setUiState(state));
  const atomRef = useRef<TableAtom<TData> | null>(null);
  if (!atomRef.current) {
    const initial = {
      rowData: props.rowData,
      columnDefs: props.columnDefs,
      config: validatedConfig,
      state: initialPublicState(props, uiState),
      controlledState: props.state,
    };
    atomRef.current = Atom.make<DataTableStore<TData>>({
      ...initial,
      model: buildDataTableModel(initial),
    });
  }
  const tableAtom = atomRef.current;
  const setStore = useAtomSet(tableAtom);

  useLayoutEffect(() => {
    setStore((store) => {
      const features = props.features ?? {};
      const selection = features.selection;
      const config: ResolvedConfig<TData> = {
        getRowId:
          (selection && selection.getRowId) || props.getRowId || undefined,
        onStateChange: props.onStateChange,
        onUiStateChange: (state) => setUiState(state),
        status: props.status ?? {},
        features,
        onRowClicked: props.onRowClicked,
        labels: dataTableMessages(props.messages),
      };
      const state = { ...store.state, ...uiState, ...props.state };
      const modelChanged =
        store.rowData !== props.rowData ||
        store.columnDefs !== props.columnDefs ||
        !sameDataTableState(store.state, state) ||
        store.config.getRowId !== config.getRowId ||
        store.config.features.pagination !== config.features.pagination;
      const next = {
        ...store,
        rowData: props.rowData,
        columnDefs: props.columnDefs,
        config,
        controlledState: props.state,
        state,
      };
      return modelChanged
        ? { ...next, model: buildDataTableModel(next) }
        : next;
    });
  }, [
    props.columnDefs,
    props.features,
    props.getRowId,
    props.messages,
    props.onRowClicked,
    props.onStateChange,
    props.rowData,
    props.state,
    props.status,
    setStore,
    setUiState,
    uiState,
  ]);

  return (
    <div className="w-full max-w-full min-w-0 rounded-md" data-table-root="">
      <DataTableToolbar tableAtom={tableAtom} />
      <DataTableContent tableAtom={tableAtom} />
      <DataTablePagination tableAtom={tableAtom} />
    </div>
  );
};

export const DataTable = <TData extends RowData>(
  props: DataTableProps<TData>,
) => {
  const persistedUiAtomRef = useRef<Atom.Writable<
    AsyncResult.AsyncResult<DataTablePersistedUiState>,
    DataTablePersistedUiState
  > | null>(null);
  if (!persistedUiAtomRef.current) {
    const pathname = globalThis.window?.location.pathname ?? "/";
    const columnIds = normalizeDataTableColumns(props.columnDefs)
      .map(({ id }) => id)
      .join(",");
    const viewCapability = props.features?.gallery ? "gallery" : "table";
    persistedUiAtomRef.current = Atom.kvs({
      mode: "async",
      runtime: dataTableStorageRuntime,
      key: `data-table:${pathname}:${columnIds}:${viewCapability}:ui`,
      schema: DataTablePersistedUiStateSchema,
      defaultValue: () => persistedUiFromState(DEFAULT_UI_STATE),
    });
  }
  const [persistedUiResult, setPersistedUiState] = useAtom(
    persistedUiAtomRef.current,
  );
  if (
    !AsyncResult.isSuccess(persistedUiResult) ||
    AsyncResult.isWaiting(persistedUiResult)
  ) {
    return (
      <div
        aria-busy="true"
        className="invisible w-full max-w-full min-w-0 rounded-md"
        data-table-root=""
      />
    );
  }
  return (
    <HydratedDataTable
      {...props}
      persistedUiState={persistedUiResult.value}
      setPersistedUiState={setPersistedUiState}
    />
  );
};

const DataTableContent = <TData extends RowData>({
  tableAtom,
}: {
  tableAtom: TableAtom<TData>;
}) => {
  const [store] = useTableAtom(tableAtom);
  if (store.config.features.gallery && store.state.view === "gallery") {
    return <DataTableGallery tableAtom={tableAtom} />;
  }
  const model = deriveModel(store);
  const width = getDataTableWidth(
    model.visibleColumns,
    (store.config.features.selection ? 1 : 0) +
      (hasRowActionMenu(store) ? 1 : 0) +
      (canDragRows(store) ? 1 : 0),
  );
  return (
    <ScrollArea className="max-w-full min-w-0">
      <Table className="table-fixed" style={{ width: `max(100%, ${width}px)` }}>
        <DataTableHeader tableAtom={tableAtom} />
        <DataTableBody tableAtom={tableAtom} />
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export interface DataTableRelationshipOption {
  icon?: ReactNode;
  label: string;
  value: string;
}

export const DataTableRelationshipCell = ({
  emptyLabel,
  manageLabel,
  onAdd,
  onRemove,
  options,
  value,
}: {
  emptyLabel: string;
  manageLabel: string;
  onAdd?: (value: string) => void;
  onRemove?: (value: string) => void;
  options: readonly DataTableRelationshipOption[];
  value: readonly DataTableRelationshipOption[];
}) => {
  const [selected, setSelected] = useState([...value]);
  useLayoutEffect(() => setSelected([...value]), [value]);
  const selectedValues = new Set(selected.map((item) => item.value));
  return (
    <VirtualizedCombobox
      ariaLabel={manageLabel}
      emptyLabel={emptyLabel}
      items={[...options].sort(
        (left, right) =>
          Number(selectedValues.has(right.value)) -
          Number(selectedValues.has(left.value)),
      )}
      messages={{ search: manageLabel }}
      multiple
      onValueChange={(next) => {
        const nextValues = new Set(next.map((item) => item.value));
        selected.forEach(
          (item) => !nextValues.has(item.value) && onRemove?.(item.value),
        );
        next.forEach(
          (item) => !selectedValues.has(item.value) && onAdd?.(item.value),
        );
        setSelected(next);
      }}
      placeholder={emptyLabel}
      trigger={
        <Button
          className="h-full min-h-16 w-full justify-between rounded-none"
          variant="ghost"
        >
          <DataTableListSummary
            emptyLabel={emptyLabel}
            expandable={false}
            items={selected}
            variant={selected.some((item) => item.icon) ? "icon" : "text"}
          />
          <ChevronDown />
        </Button>
      }
      value={selected}
    />
  );
};

export const DataTableListSummary = ({
  emptyLabel,
  expandable = true,
  items,
  overflowLabel,
  totalCount = items.length,
  variant = "text",
  visibleCount = 3,
}: {
  emptyLabel: ReactNode;
  expandable?: boolean;
  items: readonly (
    | string
    | { icon?: ReactNode; label: string; value?: string }
  )[];
  overflowLabel?: (remaining: number) => ReactNode;
  totalCount?: number;
  variant?: "icon" | "text";
  visibleCount?: number;
}) => {
  const labels = dataTableMessages();
  const normalized = items.map((item) =>
    Schema.is(Schema.String)(item) ? { label: item } : item,
  );
  if (!normalized.length)
    return <span className="text-muted-foreground">{emptyLabel}</span>;
  const visible = normalized.slice(0, visibleCount);
  const remaining = Math.max(totalCount - visible.length, 0);
  const details = (
    <PopoverContent align="start" className="max-h-72 w-72 overflow-y-auto p-2">
      {normalized.map((item, index) => (
        <div
          className="flex items-center gap-2 p-2"
          key={item.value ?? `${item.label}-${index}`}
        >
          {item.icon}
          {item.label}
        </div>
      ))}
    </PopoverContent>
  );
  if (variant === "icon") {
    return (
      <TooltipProvider>
        <span className="flex items-center">
          {visible.map((item) => (
            <Tooltip key={item.value ?? item.label}>
              <TooltipTrigger
                render={
                  <span
                    aria-label={item.label}
                    className="bg-muted -ml-1 flex size-8 items-center justify-center rounded-full"
                  >
                    {item.icon ?? item.label.slice(0, 2).toUpperCase()}
                  </span>
                }
              />
              <TooltipContent>{item.label}</TooltipContent>
            </Tooltip>
          ))}
          {remaining && expandable ? (
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    aria-label={labels.listOthers(remaining)}
                    className="bg-muted -ml-1 flex size-8 items-center justify-center rounded-full"
                    type="button"
                  >
                    +{remaining}
                  </button>
                }
              />
              {details}
            </Popover>
          ) : remaining ? (
            <span className="bg-muted -ml-1 flex size-8 items-center justify-center rounded-full">
              +{remaining}
            </span>
          ) : null}
        </span>
      </TooltipProvider>
    );
  }
  const summary = (
    <>
      {visible.map((item) => item.label).join(", ")}
      {remaining
        ? ` ${overflowLabel?.(remaining) ?? labels.listOthers(remaining)}`
        : ""}
    </>
  );
  return remaining && expandable ? (
    <Popover>
      <PopoverTrigger
        render={
          <button className="text-left text-sm" type="button">
            {summary}
          </button>
        }
      />
      {details}
    </Popover>
  ) : (
    <span className="text-sm">{summary}</span>
  );
};
