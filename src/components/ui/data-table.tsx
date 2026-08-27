import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
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
import { SortParamsFromString } from "@/lib/query";
import { TableSearchSchema, type TableParams } from "@/lib/table-search";
import { cn } from "@/lib/utils";
import { getLocale } from "@/paraglide/runtime";
import { useAtom } from "@effect/atom-react";
import { BrowserKeyValueStore } from "@effect/platform-browser";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Effect, Layer, Option, Schema } from "effect";
import { KeyValueStore } from "effect/unstable/persistence";
import { Atom } from "effect/unstable/reactivity";
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
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  useNavigate,
  useRouterState,
  type ValidateFromPath,
} from "@tanstack/react-router";
import {
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  createTableHook,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  type Column,
  type ColumnDef,
  flexRender,
  type Header,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type ColumnVisibilityState,
  type AppReactTable,
  type TableState,
} from "@tanstack/react-table";

type DataTableColumnMeta = {
  truncate?: boolean;
};

const DEFAULT_COLUMN_MIN_SIZE = 128;
const DEFAULT_COLUMN_SIZE = 224;
const DEFAULT_COLUMN_MAX_SIZE = 640;
const COLUMN_RESIZE_STEP = 8;
const dataTableColumnMeta: DataTableColumnMeta = {};

const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  columnMeta: dataTableColumnMeta,
});

export const {
  createAppColumnHelper: createDataTableColumnHelper,
  useAppTable: useDataTable,
  useCellContext: useDataTableCellContext,
  useHeaderContext: useDataTableHeaderContext,
  useTableContext: useDataTableContext,
} = createTableHook({
  features: dataTableFeatures,
  defaultColumn: {
    minSize: DEFAULT_COLUMN_MIN_SIZE,
    size: DEFAULT_COLUMN_SIZE,
    maxSize: DEFAULT_COLUMN_MAX_SIZE,
  },
  columnResizeMode: "onChange",
  enableColumnResizing: true,
  tableComponents: {},
  cellComponents: {},
  headerComponents: {},
});

export type DataTableColumnDef<
  TData extends RowData,
  TValue = unknown,
> = ColumnDef<typeof dataTableFeatures, TData, TValue>;
type DataTableColumn<TData extends RowData, TValue = unknown> = Column<
  typeof dataTableFeatures,
  TData,
  TValue
>;
type DataTableHeader<TData extends RowData, TValue = unknown> = Header<
  typeof dataTableFeatures,
  TData,
  TValue
>;
type DataTableRow<TData extends RowData> = Row<typeof dataTableFeatures, TData>;
type DataTableInstance<TData extends RowData> = AppReactTable<
  typeof dataTableFeatures,
  TData,
  TableState<typeof dataTableFeatures>,
  Record<never, never>,
  Record<never, never>,
  Record<never, never>
>;

export {
  TableSearchSchema,
  TableSearchSchemaStandard,
} from "@/lib/table-search";
export type { TableParams } from "@/lib/table-search";

const compactDataTableStorage = Layer.effect(
  KeyValueStore.KeyValueStore,
  Effect.map(KeyValueStore.KeyValueStore, (store) =>
    KeyValueStore.make({
      clear: store.clear,
      get: (key) =>
        Effect.flatMap(store.get(key), (value) =>
          value === "{}"
            ? Effect.as(store.remove(key), undefined)
            : Effect.succeed(value),
        ),
      getUint8Array: store.getUint8Array,
      remove: store.remove,
      set: (key, value) =>
        value === "{}" ? store.remove(key) : store.set(key, value),
      size: store.size,
    }),
  ),
).pipe(Layer.provide(BrowserKeyValueStore.layerLocalStorage));

const dataTableStorageRuntime = Atom.runtime(compactDataTableStorage);

const DataTableViewSchema = Schema.Union([
  Schema.Literal("table"),
  Schema.Literal("gallery"),
]).annotate({ identifier: "DataTableView" });
type DataTableView = typeof DataTableViewSchema.Type;

const ColumnVisibilitySchema = Schema.Record(
  Schema.String,
  Schema.Boolean,
).annotate({ identifier: "DataTableColumnVisibility" });
const ColumnSizingSchema = Schema.Record(Schema.String, Schema.Number).annotate(
  {
    identifier: "DataTableColumnSizing",
  },
);
const RowDragDataSchema = Schema.Struct({
  type: Schema.Literal("row"),
  label: Schema.optional(Schema.String),
  rowId: Schema.String,
}).annotate({ identifier: "DataTableRowDragData" });
const RowReorderDragDataSchema = Schema.Struct({
  type: Schema.Literal("row-reorder"),
}).annotate({ identifier: "DataTableRowReorderDragData" });
const GroupDropDataSchema = Schema.Struct({
  type: Schema.Literal("group-target"),
  fieldId: Schema.String,
  groupId: Schema.String,
}).annotate({ identifier: "DataTableGroupDropData" });

const decodeTableSearch = Schema.decodeUnknownOption(TableSearchSchema);
const decodeDataTableView = Schema.decodeUnknownOption(DataTableViewSchema);
const decodeRowDragData = Schema.decodeUnknownOption(RowDragDataSchema);
const decodeRowReorderDragData = Schema.decodeUnknownOption(
  RowReorderDragDataSchema,
);
const decodeGroupDropData = Schema.decodeUnknownOption(GroupDropDataSchema);

type TableSearchValue = string | number | readonly string[] | undefined;
type TableSearchRecord = Record<string, TableSearchValue>;

const validateTableSearchUpdate = (search: TableSearchRecord) => ({
  ...search,
  ...Schema.decodeUnknownSync(TableSearchSchema)(search),
});

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
  sortHide: string;
  sortClear: string;
  sortBy: string;
  reorder: string;
  resizeColumn: (column: string) => string;
  listOthers: (count: number) => string;
  selectAllRows: string;
  selectRow: string;
  selected: string;
};

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
    sortAsc: "Asc",
    sortDesc: "Desc",
    sortHide: "Hide",
    sortClear: "Clear",
    sortBy: "Sort by",
    reorder: "Drag to reorder",
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
    sortHide: "Cacher",
    sortClear: "Effacer",
    sortBy: "Trier par",
    reorder: "Glisser pour réordonner",
    resizeColumn: (column: string) => `Redimensionner la colonne ${column}`,
    listOthers: (count: number) =>
      count === 1 ? "et 1 autre" : `et ${count} autres`,
    selectAllRows: "Sélectionner toutes les lignes de cette page",
    selectRow: "Sélectionner la ligne",
    selected: "Sélectionnés",
  },
} as const satisfies Record<"en" | "fr", DataTableMessages>;

export type DataTableMessageOverrides = Partial<DataTableMessages>;

export const dataTableMessages = (overrides?: DataTableMessageOverrides) => ({
  ...(getLocale().startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

export interface DataTableGroupingField<TData> {
  id: string;
  label: string;
  getGroupId: (row: TData) => string;
  getRowGroupIds?: (row: TData) => string[];
  getGroupIds?: () => string[];
  getGroupLabel?: (groupId: string, rows: TData[]) => ReactNode;
  renderGroupLabel?: (groupId: string, rows: TData[]) => ReactNode;
  renderEmptyGroup?: (groupId: string) => ReactNode;
  onMoveToGroup?: (row: TData, groupId: string) => void;
  actionsTitle?: string;
  actions?: DataTableGroupAction[];
}

export interface DataTableGrouping<TData> {
  fields: DataTableGroupingField<TData>[];
  initial?: string[];
  getRowLabel?: (row: TData) => string;
}

export interface DataTableRelationshipOption {
  icon?: ReactNode;
  label: string;
  value: string;
}

export interface DataTableGalleryConfig {
  name: string;
  description?: string;
  tag?: string;
  tagIcon?: ReactNode;
}

export interface DataTableReordering<TData> {
  onReorder: (rows: TData[]) => void;
  getRowId: (row: TData) => string;
  getRowLabel?: (row: TData) => string;
  handleLabel?: string;
}

export type DataTableRowAction<TData> = {
  id?: string;
  name: string;
  icon?: ReactNode;
  variant?: "default" | "destructive" | undefined;
  onClick: (data: TData) => void;
  visible?: (data: TData) => boolean;
};

export type DataTableBulkAction<TData> = {
  id?: string;
  name: string;
  icon?: ReactNode;
  variant?: "default" | "destructive" | undefined;
  onClick: (rows: TData[]) => void;
  visible?: (rows: TData[]) => boolean;
};

export type DataTableGroupAction = {
  name: string;
  icon?: ReactNode;
  variant?: "default" | "destructive" | undefined;
  onClick: (groupId: string) => void;
  visible?: (groupId: string) => boolean;
};

export interface DataTableState {
  loading?: boolean;
  error?: ReactNode;
  empty?: ReactNode;
}

export type DataTablePaginationFeature =
  | false
  | {
      mode: "client";
      pageSizes?: readonly number[];
    }
  | {
      mode: "server";
      rowCount: number;
      pageSizes?: readonly number[];
    };

export interface DataTableExportFeature {
  baseName: string;
  scope?: "currentPage" | "filteredRows";
}

export interface DataTableRowActionsFeature<TData> {
  label?: string;
  items: readonly DataTableRowAction<TData>[];
}

export interface DataTableColumnVisibilityFeature {
  default?: ColumnVisibilityState;
}

export interface DataTableSelectionFeature<TData> {
  bulkActions?:
    | false
    | {
        label?: string;
        items: readonly DataTableBulkAction<TData>[];
      };
  getRowId: (row: TData) => string;
  isRowSelectable?: (row: TData) => boolean;
  onSelectionChange?: (rows: TData[]) => void;
}

export interface DataTableFeatures<TData> {
  pagination?: DataTablePaginationFeature;
  search?: boolean;
  export?: false | DataTableExportFeature;
  columnVisibility?: boolean | DataTableColumnVisibilityFeature;
  gallery?: false | DataTableGalleryConfig;
  sorting?: boolean;
  rowActions?: false | DataTableRowActionsFeature<TData>;
  selection?: false | DataTableSelectionFeature<TData>;
}

type LegacyDataTableRowAction<TData> = Omit<DataTableRowAction<TData>, "id"> & {
  id?: string;
};

interface DataTableProps<TData extends RowData> {
  columns: DataTableColumnDef<TData>[];
  data: TData[];
  state?: DataTableState;
  search?: TableParams;
  onSearchChange?: (search: TableParams) => void;
  searchState?: "url" | "local";
  emptyLabel?: ReactNode;
  messages?: DataTableMessageOverrides;
  exportFileName?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  onRowClick?: (row: TData) => void;
  routeFrom?: ValidateFromPath;
  from?: ValidateFromPath;
  grouping?: DataTableGrouping<TData>;
  reordering?: DataTableReordering<TData>;
  features?: DataTableFeatures<TData>;
  // Compatibility props retained for existing registry consumers.
  gallery?: DataTableGalleryConfig;
  rowActions?: readonly LegacyDataTableRowAction<TData>[];
  serverPagination?: { rowCount: number };
}

type GroupSection<TData extends RowData> = {
  key: string;
  groupId: string;
  depth: number;
  field: DataTableGroupingField<TData>;
  rows: DataTableRow<TData>[];
  children: GroupSection<TData>[];
};

const GROUP_INDENT_PX = 20;
const GROUP_ROW_INDENT_OFFSET_PX = 44;

const snapDragOverlayVerticalCenterToCursor: Modifier = ({
  activatorEvent,
  activeNodeRect,
  overlayNodeRect,
  transform,
}) => {
  if (
    !globalThis.window ||
    !(activatorEvent instanceof globalThis.window.MouseEvent) ||
    !activeNodeRect ||
    !overlayNodeRect
  ) {
    return transform;
  }

  return {
    ...transform,
    y:
      transform.y +
      activatorEvent.clientY -
      activeNodeRect.top -
      overlayNodeRect.height / 2,
  };
};

const getDefaultGrouping = <TData,>(grouping?: DataTableGrouping<TData>) => {
  if (!grouping) {
    return [];
  }

  const validInitial = grouping.initial?.filter((id) =>
    grouping.fields.some((field) => field.id === id),
  );

  if (validInitial?.length) {
    return validInitial;
  }

  return grouping.fields[0] ? [grouping.fields[0].id] : [];
};

const getGroupTargetDropId = (key: string) => `group-target:${key}`;
const getRowDragId = (rowId: string) => `row:${rowId}`;
const getSortableRowId = (rowId: string) => `sortable-row:${rowId}`;

const getGroupLabels = <TData extends RowData>(
  section: GroupSection<TData>,
) => {
  const rows = section.rows.map((row) => row.original);
  const label =
    section.field.getGroupLabel?.(section.groupId, rows) ?? section.groupId;

  return section.field.renderGroupLabel?.(section.groupId, rows) ?? label;
};

export const DataTableRowActions = <TData,>({
  actions,
  contentClassName,
  row,
  title,
}: {
  actions: readonly DataTableRowAction<TData>[];
  contentClassName?: string | undefined;
  row: TData;
  title?: string | undefined;
}) => {
  const resolvedTitle = title ?? dataTableMessages().actions;
  const visibleActions = actions.filter(
    (action) => !action.visible || action.visible(row),
  );

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(event) => event.stopPropagation()}
        render={
          <Button
            className="size-8 focus-visible:ring-inset [&_svg:not([class*='size-'])]:size-4"
            variant="ghost"
            size="icon"
          >
            <span className="sr-only">{resolvedTitle}</span>
            <MoreHorizontal />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className={cn("w-max", contentClassName)}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>{resolvedTitle}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleActions.map((action) => (
            <DropdownMenuItem
              key={action.id ?? action.name}
              className="whitespace-nowrap"
              onClick={(event) => {
                event.stopPropagation();
                action.onClick(row);
              }}
              {...(action.variant ? { variant: action.variant } : {})}
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

const DataTableBulkActions = <TData,>({
  actions,
  label,
  selectedLabel,
  rows,
}: {
  actions: readonly DataTableBulkAction<TData>[];
  label: string;
  selectedLabel: string;
  rows: TData[];
}) => {
  const visibleActions = actions.filter(
    (action) => !action.visible || action.visible(rows),
  );

  if (visibleActions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button className="h-9" size="sm" variant="default">
            {selectedLabel}
            <Badge
              className="bg-primary-foreground/15 text-primary-foreground min-w-5 justify-center rounded-full border-0 px-1.5 tabular-nums"
              variant="secondary"
            >
              {rows.length}
            </Badge>
            <ChevronRight className="rotate-90" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-max max-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleActions.map((action) => (
            <DropdownMenuItem
              key={action.id ?? action.name}
              className="whitespace-nowrap"
              onClick={() => action.onClick(rows)}
              {...(action.variant ? { variant: action.variant } : {})}
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

const buildGroupedSections = <TData extends RowData>(
  rows: DataTableRow<TData>[],
  fields: DataTableGroupingField<TData>[],
  depth = 0,
  parentKey = "",
): GroupSection<TData>[] => {
  if (fields.length === 0) {
    return [];
  }

  const [field, ...remainingFields] = fields;
  const groups = new Map<string, DataTableRow<TData>[]>();

  field.getGroupIds?.().forEach((groupId) => {
    groups.set(groupId, []);
  });

  rows.forEach((row) => {
    const groupIds = field.getRowGroupIds?.(row.original) ?? [
      field.getGroupId(row.original),
    ];
    for (const groupId of groupIds) {
      const currentRows = groups.get(groupId) ?? [];
      currentRows.push(row);
      groups.set(groupId, currentRows);
    }
  });

  return Array.from(groups.entries()).map(([groupId, groupRows]) => {
    const key = parentKey
      ? `${parentKey}::${field.id}:${groupId}`
      : `${field.id}:${groupId}`;

    return {
      key,
      groupId,
      depth,
      field,
      rows: groupRows,
      children:
        groupRows.length > 0
          ? buildGroupedSections(groupRows, remainingFields, depth + 1, key)
          : [],
    };
  });
};

const GroupHeaderRow = <TData extends RowData>({
  collapsed,
  colSpan,
  onToggle,
  section,
}: {
  collapsed: boolean;
  colSpan: number;
  onToggle: () => void;
  section: GroupSection<TData>;
}) => {
  return (
    <TableRow>
      <TableCell className="relative p-0" colSpan={colSpan} onClick={onToggle}>
        <div
          className="flex cursor-pointer items-center gap-3 px-2 py-2 font-medium transition-colors"
          style={{
            paddingLeft: `calc(0.5rem + ${section.depth * GROUP_INDENT_PX}px)`,
          }}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
          <div className="min-w-0 flex-1 text-left">
            {getGroupLabels(section)}
          </div>
          <Badge variant="secondary" className="ml-auto">
            {section.rows.length}
          </Badge>
          <DataTableGroupActions
            actions={section.field.actions}
            groupId={section.groupId}
            title={section.field.actionsTitle}
          />
        </div>
      </TableCell>
    </TableRow>
  );
};

const GroupTableSection = <TData extends RowData>({
  children,
  section,
}: {
  children: ReactNode;
  section: GroupSection<TData>;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: getGroupTargetDropId(section.key),
    disabled: !section.field.onMoveToGroup,
    data: {
      type: "group-target",
      fieldId: section.field.id,
      groupId: section.groupId,
    },
  });

  return (
    <TableBody
      className={cn(
        "relative px-2",
        isOver && "ring-primary ring-1 ring-inset",
      )}
      ref={setNodeRef}
    >
      {children}
    </TableBody>
  );
};

const GroupHeaderCard = <TData extends RowData>({
  collapsed,
  onToggle,
  section,
}: {
  collapsed: boolean;
  onToggle: () => void;
  section: GroupSection<TData>;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: getGroupTargetDropId(section.key),
    disabled: !section.field.onMoveToGroup,
    data: {
      type: "group-target",
      fieldId: section.field.id,
      groupId: section.groupId,
    },
  });

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left font-medium transition-colors",
        isOver && "outline outline-primary",
      )}
      ref={setNodeRef}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={onToggle}
        type="button"
      >
        {collapsed ? (
          <ChevronRight className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
        <div className="min-w-0 flex-1">{getGroupLabels(section)}</div>
        <Badge variant="secondary" className="ml-auto">
          {section.rows.length}
        </Badge>
      </button>
      <DataTableGroupActions
        actions={section.field.actions}
        groupId={section.groupId}
        title={section.field.actionsTitle}
      />
    </div>
  );
};

const DataTableGroupActions = ({
  actions,
  groupId,
  title,
}: {
  actions?: DataTableGroupAction[] | undefined;
  groupId: string;
  title?: string | undefined;
}) => {
  const visibleActions = actions?.filter(
    (action) => !action.visible || action.visible(groupId),
  );

  if (!visibleActions?.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(event) => event.stopPropagation()}
        render={
          <Button
            className="size-7 shadow-md [&_svg:not([class*='size-'])]:size-3.5"
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
          {visibleActions.map((action) => (
            <DropdownMenuItem
              key={action.name}
              className="whitespace-nowrap"
              onClick={(event) => {
                event.stopPropagation();
                action.onClick(groupId);
              }}
              {...(action.variant ? { variant: action.variant } : {})}
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

const DataTableRow = <TData extends RowData>({
  canDrag,
  canReorder,
  dragLabel,
  indentDepth = 0,
  reorderHandleLabel,
  onRowClick,
  row,
  rowActions,
  rowActionsLabel,
  selectRowLabel,
  selectable,
  table,
}: {
  canDrag: boolean;
  canReorder: boolean;
  dragLabel?: string | undefined;
  indentDepth?: number | undefined;
  reorderHandleLabel?: string | undefined;
  onRowClick?: ((row: TData) => void) | undefined;
  row: DataTableRow<TData>;
  rowActions?: readonly DataTableRowAction<TData>[] | undefined;
  rowActionsLabel?: string | undefined;
  selectRowLabel: string;
  selectable: boolean;
  table: DataTableInstance<TData>;
}) => {
  const sortable = useSortable({
    id: getSortableRowId(row.id),
    disabled: !canReorder,
    data: {
      type: "row-reorder",
      row: row.original,
      label: dragLabel,
    },
  });
  const draggable = useDraggable({
    id: getRowDragId(row.id),
    disabled: !canDrag || canReorder,
    data: {
      type: "row",
      rowId: row.id,
      label: dragLabel,
    },
  });
  const attributes = canReorder ? sortable.attributes : draggable.attributes;
  const listeners = canReorder ? sortable.listeners : draggable.listeners;
  const isDragging = canReorder ? sortable.isDragging : draggable.isDragging;
  const setRowNodeRef = canReorder ? sortable.setNodeRef : draggable.setNodeRef;
  const transform = canReorder
    ? CSS.Transform.toString(sortable.transform)
    : undefined;
  const firstCellIndent =
    indentDepth > 0
      ? `calc(0.5rem + ${(indentDepth - 1) * GROUP_INDENT_PX + GROUP_ROW_INDENT_OFFSET_PX}px)`
      : undefined;
  const rowAttributes = canReorder
    ? onRowClick
      ? { role: "button", tabIndex: 0 }
      : {}
    : onRowClick
      ? { ...attributes, role: "button", tabIndex: 0 }
      : attributes;
  const visibleCells = row.getVisibleCells();

  return (
    <TableRow
      className={cn(
        "group/row h-16 focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid",
        onRowClick && "cursor-pointer",
        isDragging && "opacity-50",
      )}
      data-state={row.getIsSelected() && "selected"}
      key={row.id}
      onClick={() => {
        if (onRowClick) {
          onRowClick(row.original);
        }
      }}
      onKeyDown={(event) => {
        if (!onRowClick || (event.key !== "Enter" && event.key !== " ")) {
          return;
        }

        event.preventDefault();
        onRowClick(row.original);
      }}
      ref={setRowNodeRef}
      style={{
        transform,
        transition: sortable.transition,
      }}
      {...rowAttributes}
      {...(!canReorder ? listeners : {})}
    >
      {selectable ? (
        <TableCell
          className="w-10 min-w-10 cursor-default pr-0"
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            aria-label={selectRowLabel}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(checked, eventDetails) =>
              row.getToggleSelectedHandler()({
                nativeEvent: eventDetails.event,
                target: { checked },
              })
            }
            onClick={(event) => event.stopPropagation()}
          />
        </TableCell>
      ) : null}
      {canReorder ? (
        <TableCell className="w-10 min-w-10 pr-0">
          <Button
            aria-label={reorderHandleLabel}
            className="size-8 cursor-grab active:cursor-grabbing"
            onClick={(event) => event.stopPropagation()}
            size="icon"
            type="button"
            variant="ghost"
            {...attributes}
            {...listeners}
          >
            <GripVertical />
          </Button>
        </TableCell>
      ) : null}
      {visibleCells.map((cell, index) => {
        return (
          <table.AppCell cell={cell} key={cell.id}>
            {(appCell) => (
              <TableCell
                className={cn(
                  "align-center min-w-32 overflow-hidden [&:has([data-slot=relationship-cell])]:relative [&:has([data-slot=relationship-cell])]:p-0 [&:has([data-slot=relationship-cell])>div]:absolute [&:has([data-slot=relationship-cell])>div]:inset-0",
                  cell.column.columnDef.meta?.truncate
                    ? "whitespace-nowrap"
                    : "whitespace-normal",
                )}
                style={
                  index === 0 && firstCellIndent
                    ? {
                        paddingLeft: firstCellIndent,
                        width: cell.column.getSize(),
                      }
                    : { width: cell.column.getSize() }
                }
              >
                <div
                  className={cn(
                    "w-full max-w-full min-w-0 overflow-hidden break-words [&:has([data-slot=list-summary])]:line-clamp-none",
                    cell.column.columnDef.meta?.truncate
                      ? "truncate"
                      : "line-clamp-3",
                  )}
                >
                  <appCell.FlexRender />
                </div>
              </TableCell>
            )}
          </table.AppCell>
        );
      })}
      {rowActions ? (
        <TableCell
          className="bg-background group-data-[state=selected]/row:bg-muted sticky right-0 z-20 w-10 min-w-10 cursor-default p-0 transition-colors group-hover/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--background))]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-16 items-center justify-center">
            <DataTableRowActions
              actions={rowActions}
              row={row.original}
              title={rowActionsLabel}
            />
          </div>
        </TableCell>
      ) : null}
    </TableRow>
  );
};

const DataTableGalleryCard = <TData extends RowData>({
  canDrag,
  dragLabel,
  gallery,
  onRowClick,
  row,
  rowActions,
  rowActionsLabel,
  selectRowLabel,
  selectable,
  table,
}: {
  canDrag: boolean;
  dragLabel?: string | undefined;
  gallery?: DataTableGalleryConfig | undefined;
  onRowClick?: ((row: TData) => void) | undefined;
  row: DataTableRow<TData>;
  rowActions?: readonly DataTableRowAction<TData>[] | undefined;
  rowActionsLabel?: string | undefined;
  selectRowLabel: string;
  selectable: boolean;
  table: DataTableInstance<TData>;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getRowDragId(row.id),
    disabled: !canDrag,
    data: {
      type: "row",
      rowId: row.id,
      label: dragLabel,
    },
  });

  const nameCell = gallery
    ? row.getVisibleCells().find((cell) => cell.column.id === gallery.name)
    : null;
  const descriptionCell = gallery?.description
    ? row
        .getVisibleCells()
        .find((cell) => cell.column.id === gallery.description)
    : null;
  const tagCell = gallery?.tag
    ? row.getVisibleCells().find((cell) => cell.column.id === gallery.tag)
    : null;

  if (gallery) {
    const tagValue = gallery.tag ? row.getValue(gallery.tag) : null;
    const tagLabel =
      tagValue === null || tagValue === undefined ? null : String(tagValue);

    return (
      <Card
        className={cn(
          "relative mx-auto w-full max-w-sm transition-colors",
          onRowClick && "cursor-pointer hover:bg-accent/20",
          isDragging && "opacity-50",
        )}
        data-state={row.getIsSelected() && "selected"}
        onClick={() => {
          if (onRowClick) {
            onRowClick(row.original);
          }
        }}
        ref={setNodeRef}
        {...attributes}
        {...listeners}
      >
        {selectable ? (
          <div
            className="absolute top-4 left-4 z-10"
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox
              aria-label={selectRowLabel}
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onCheckedChange={(checked, eventDetails) =>
                row.getToggleSelectedHandler()({
                  nativeEvent: eventDetails.event,
                  target: { checked },
                })
              }
            />
          </div>
        ) : null}
        {rowActions ? (
          <div
            className="absolute top-4 right-4 z-10"
            onClick={(event) => event.stopPropagation()}
          >
            <DataTableRowActions
              actions={rowActions}
              row={row.original}
              title={rowActionsLabel}
            />
          </div>
        ) : null}
        <CardHeader
          className={cn(rowActions && "pr-14", selectable && "pl-12")}
        >
          {tagCell && tagLabel ? (
            <Badge variant="secondary" className="mb-1 w-fit gap-1">
              {gallery.tagIcon}
              {tagLabel}
            </Badge>
          ) : null}
          {nameCell ? (
            <CardTitle className="min-w-0 text-base">
              {flexRender(
                nameCell.column.columnDef.cell,
                nameCell.getContext(),
              )}
            </CardTitle>
          ) : null}
          {descriptionCell ? (
            <CardDescription className="line-clamp-2 min-w-0">
              {flexRender(
                descriptionCell.column.columnDef.cell,
                descriptionCell.getContext(),
              )}
            </CardDescription>
          ) : null}
        </CardHeader>
      </Card>
    );
  }

  const contentCells = row.getVisibleCells();

  return (
    <Card
      className={cn(
        "relative gap-3 transition-colors",
        onRowClick && "cursor-pointer hover:bg-accent/20",
        isDragging && "opacity-50",
      )}
      data-state={row.getIsSelected() && "selected"}
      onClick={() => {
        if (onRowClick) {
          onRowClick(row.original);
        }
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      {selectable ? (
        <div
          className="absolute top-4 left-4 z-10"
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            aria-label={selectRowLabel}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(checked, eventDetails) =>
              row.getToggleSelectedHandler()({
                nativeEvent: eventDetails.event,
                target: { checked },
              })
            }
          />
        </div>
      ) : null}
      <CardHeader>
        {rowActions ? (
          <CardAction onClick={(event) => event.stopPropagation()}>
            <DataTableRowActions
              actions={rowActions}
              row={row.original}
              title={rowActionsLabel}
            />
          </CardAction>
        ) : null}
        {contentCells.length > 0 && (
          <div className="grid min-w-0 gap-3">
            <CardDescription className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {getColumnDisplayName(table, contentCells[0].column.id)}
            </CardDescription>
            <CardTitle className="text-base">
              {flexRender(
                contentCells[0].column.columnDef.cell,
                contentCells[0].getContext(),
              )}
            </CardTitle>
          </div>
        )}
      </CardHeader>
      {contentCells.length > 1 && (
        <CardContent className="grid gap-3">
          {contentCells.slice(1).map((cell) => (
            <div className="grid gap-1" key={cell.id}>
              <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {getColumnDisplayName(table, cell.column.id)}
              </div>
              <div className="min-w-0 text-sm">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};

const extractTextFromElement = (element: ReactNode): string | null => {
  if (Schema.is(Schema.String)(element)) return element;
  if (Schema.is(Schema.Number)(element)) return String(element);
  if (!isValidElement<{ children?: ReactNode; title?: ReactNode }>(element)) {
    return null;
  }
  const { props } = element;
  if (Schema.is(Schema.String)(props.title)) return props.title;
  return extractTextFromElement(props.children);
};

const getColumnLabels = <TData extends RowData>(
  table: DataTableInstance<TData>,
) =>
  new Map(
    table
      .getFlatHeaders()
      .map((header) => [header.column.id, getHeaderName(header)]),
  );

const getHeaderName = <TData extends RowData>(
  header: DataTableHeader<TData, unknown>,
): string => {
  const columnDef = header.column.columnDef;
  if (columnDef.header instanceof Function) {
    const headerContext = columnDef.header(header.getContext());
    if (Schema.is(Schema.String)(headerContext)) {
      return headerContext;
    }
    return extractTextFromElement(headerContext) ?? header.id;
  }

  return String(columnDef.header ?? header.id);
};

export const getHeaderNames = <TData extends RowData>(
  headers: DataTableHeader<TData, unknown>[],
): string[] => headers.map((header) => getHeaderName(header));

const getColumnDisplayName = <TData extends RowData>(
  table: DataTableInstance<TData>,
  columnId: string,
) => {
  const header = table
    .getFlatHeaders()
    .find((currentHeader) => currentHeader.column.id === columnId);
  return header ? getHeaderName(header) : columnId;
};

export type CsvValue = string | number | boolean | null | undefined;

const withFileExtension = (fileName: string, extension: string) => {
  const normalizedExtension = extension.startsWith(".")
    ? extension
    : `.${extension}`;
  return fileName.includes(".")
    ? fileName.replace(/\.[^/.]+$/, normalizedExtension)
    : `${fileName}${normalizedExtension}`;
};

const escapeCsvValue = (value: CsvValue) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const downloadCsv = (
  headers: CsvValue[],
  data: CsvValue[][],
  fileName = "data.csv",
) => {
  const csvContent = [headers, ...data]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = window.URL.createObjectURL(blob);

  link.href = url;
  link.setAttribute("download", withFileExtension(fileName, "csv"));
  document.body.appendChild(link);
  link.click();
  link.remove();
  requestAnimationFrame(() => window.URL.revokeObjectURL(url));
};

export const downloadJson = <Data,>(data: Data, fileName = "data.json") => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = window.URL.createObjectURL(blob);

  link.href = url;
  link.setAttribute("download", withFileExtension(fileName, "json"));
  document.body.appendChild(link);
  link.click();
  link.remove();
  requestAnimationFrame(() => window.URL.revokeObjectURL(url));
};

const exportTableToCsv = <TData extends RowData>(
  table: DataTableInstance<TData>,
  rows: DataTableRow<TData>[],
  fileName = "data.csv",
): void => {
  const exportableColumns = table.getVisibleLeafColumns();
  const headerNames = exportableColumns.map((column) =>
    getColumnDisplayName(table, column.id),
  );
  const data = rows.map((row) =>
    exportableColumns.map((column) => {
      const value = row.getValue(column.id);
      return value === null || value === undefined ? "" : String(value);
    }),
  );

  downloadCsv(headerNames, data, fileName);
};

const exportTableToJson = <TData extends RowData>(
  table: DataTableInstance<TData>,
  rows: DataTableRow<TData>[],
  fileName = "data.json",
): void => {
  const exportableColumns = table.getVisibleLeafColumns();
  const data = rows.map((row) =>
    Object.fromEntries(
      exportableColumns.map((column) => [column.id, row.getValue(column.id)]),
    ),
  );

  downloadJson(data, fileName);
};

const DataTableToolbar = <TData extends RowData>({
  activeGrouping,
  bulkActions,
  exportBaseName,
  exportRows,
  grouping,
  labels,
  onRefresh,
  onToggleGrouping,
  onViewChange,
  selectedRows,
  showColumnVisibility,
  showExport,
  showGallery,
  showSearch,
  showSorting,
  table,
  view,
}: {
  activeGrouping: readonly string[];
  bulkActions?:
    | {
        label?: string;
        items: readonly DataTableBulkAction<TData>[];
      }
    | undefined;
  exportBaseName: string;
  exportRows: DataTableRow<TData>[];
  grouping?: DataTableGrouping<TData> | undefined;
  labels: DataTableMessages;
  onRefresh?: (() => void) | undefined;
  onToggleGrouping: (fieldId: string, enabled: boolean) => void;
  onViewChange: (view: DataTableView) => void;
  selectedRows: TData[];
  showColumnVisibility: boolean;
  showExport: boolean;
  showGallery: boolean;
  showSearch: boolean;
  showSorting: boolean;
  table: DataTableInstance<TData>;
  view: DataTableView;
}) => {
  const [refreshSpinCount, setRefreshSpinCount] = useState(0);
  const [searchInput, setSearchInput] = useState(table.state.globalFilter);
  const hasToolbar = Boolean(
    showSearch ||
    grouping?.fields.length ||
    showSorting ||
    showGallery ||
    showColumnVisibility ||
    onRefresh ||
    showExport ||
    (selectedRows.length > 0 && bulkActions?.items.length),
  );

  useEffect(() => {
    setSearchInput(table.state.globalFilter);
  }, [table.state.globalFilter]);

  if (!hasToolbar) return null;

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {showSearch ? (
          <div className="relative w-full min-w-0 flex-1 sm:min-w-sm">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="px-9"
              onChange={(event) => {
                setSearchInput(event.target.value);
                table.setGlobalFilter(event.target.value);
              }}
              placeholder={labels.filter}
              value={searchInput}
            />
            {searchInput ? (
              <Button
                aria-label={labels.filter}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2 active:!-translate-y-1/2"
                onClick={() => {
                  setSearchInput("");
                  table.setGlobalFilter("");
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        ) : (
          <div />
        )}
        <div className="-m-1 flex items-center gap-2 overflow-x-auto p-1">
          {bulkActions && selectedRows.length > 0 ? (
            <DataTableBulkActions
              actions={bulkActions.items}
              label={bulkActions.label ?? labels.actions}
              rows={selectedRows}
              selectedLabel={labels.selected}
            />
          ) : null}
          {grouping?.fields.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label={labels.groupBy}
                    className="h-9"
                    size="sm"
                    variant="outline"
                  >
                    <Rows3 />
                    <span className="hidden sm:inline">{labels.groupBy}</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{labels.groupBy}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {grouping.fields.map((field) => (
                    <DropdownMenuCheckboxItem
                      checked={activeGrouping.includes(field.id)}
                      key={field.id}
                      onCheckedChange={(value) =>
                        onToggleGrouping(field.id, !!value)
                      }
                    >
                      {field.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {showSorting ? (
            <DataTableSortDropdown messages={labels} table={table} />
          ) : null}
          {showGallery ? (
            <DataTableDisplayModeSwitch
              messages={labels}
              onChange={onViewChange}
              value={view}
            />
          ) : null}
          {showColumnVisibility ? (
            <DataTableViewOptions messages={labels} table={table} />
          ) : null}
          {onRefresh ? (
            <Button
              aria-label={labels.refresh}
              className="h-9"
              onClick={() => {
                setRefreshSpinCount((count) => count + 1);
                onRefresh();
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <RefreshCw
                className={cn(
                  refreshSpinCount > 0 && "animate-[spin_500ms_ease-in-out_1]",
                )}
                key={refreshSpinCount}
              />
              <span className="hidden sm:inline">{labels.refresh}</span>
            </Button>
          ) : null}
          {showExport ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label={labels.export}
                    className="h-9"
                    disabled={exportRows.length === 0}
                    size="sm"
                    variant="outline"
                  >
                    <Download />
                    <span className="hidden sm:inline">{labels.export}</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{labels.export}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      exportTableToCsv(table, exportRows, exportBaseName)
                    }
                  >
                    <FileText />
                    {labels.exportCsv}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      exportTableToJson(table, exportRows, exportBaseName)
                    }
                  >
                    <FileJson />
                    {labels.exportJson}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export function DataTable<TData extends RowData>({
  columns,
  data,
  state,
  search: controlledSearch,
  onSearchChange,
  searchState = "url",
  emptyLabel,
  messages,
  exportFileName,
  isLoading: legacyIsLoading,
  onRefresh,
  onRowClick,
  from,
  routeFrom,
  grouping,
  gallery,
  rowActions: legacyRowActions,
  reordering,
  serverPagination,
  features,
}: DataTableProps<TData>) {
  const labels = dataTableMessages(messages);
  const isLoading = state?.loading ?? legacyIsLoading ?? false;
  const emptyContent =
    state?.error ?? state?.empty ?? emptyLabel ?? labels.empty;
  const paginationFeature: DataTablePaginationFeature =
    features?.pagination ??
    (serverPagination
      ? { mode: "server", rowCount: serverPagination.rowCount }
      : { mode: "client" });
  const exportFeature: false | DataTableExportFeature =
    features?.export ??
    (exportFileName
      ? { baseName: exportFileName, scope: "currentPage" }
      : false);
  const exportBaseName = exportFeature ? exportFeature.baseName : "table";
  const galleryConfig =
    features?.gallery === false ? undefined : (features?.gallery ?? gallery);
  const rowActionsFeature =
    features?.rowActions === false
      ? undefined
      : (features?.rowActions ??
        (legacyRowActions?.length
          ? {
              items: legacyRowActions.map((action) => ({
                ...action,
                id: action.id ?? action.name,
              })),
            }
          : undefined));
  const rowActions = rowActionsFeature?.items.length
    ? rowActionsFeature.items
    : undefined;
  const rowActionsLabel = rowActionsFeature?.label ?? labels.actions;
  const showPagination = paginationFeature !== false;
  const pageSizes = paginationFeature ? paginationFeature.pageSizes : undefined;
  const showSearch = features?.search ?? true;
  const showExport = exportFeature !== false;
  const columnVisibilityFeature = features?.columnVisibility ?? true;
  const showColumnVisibility = columnVisibilityFeature !== false;
  const defaultColumnVisibility = Schema.is(
    Schema.Struct({ default: ColumnVisibilitySchema }),
  )(columnVisibilityFeature)
    ? columnVisibilityFeature.default
    : undefined;
  const showGallery = !!galleryConfig;
  const showSorting = features?.sorting ?? true;
  const selectionFeature =
    features?.selection === false ? undefined : features?.selection;
  const selectable = !!selectionFeature;
  const bulkActions =
    selectionFeature?.bulkActions === false
      ? undefined
      : selectionFeature?.bulkActions;
  const isServerMode =
    paginationFeature !== false && paginationFeature.mode === "server";
  const serverRowCount = isServerMode ? paginationFeature.rowCount : undefined;
  const location = useRouterState({
    select: (state) => state.location,
  });
  const search = Option.getOrUndefined(decodeTableSearch(location.search));
  const pathname = location.pathname;
  const resolvedRouteFrom = routeFrom ?? from;
  const [storagePath] = useState(() => resolvedRouteFrom ?? pathname);
  const navigate = useNavigate(
    resolvedRouteFrom ? { from: resolvedRouteFrom } : undefined,
  );
  const [localSearch, setLocalSearch] = useState<TableParams>({
    globalFilter: "",
  });
  const tableSearch =
    controlledSearch ?? (searchState === "local" ? localSearch : search);

  const {
    page = 0,
    pageSize = 10,
    sort,
    globalFilter = "",
    grouping: urlGrouping,
  } = tableSearch ?? {};
  const pagination = { pageIndex: page, pageSize };
  const decodedSort = sort ? Schema.decodeSync(SortParamsFromString)(sort) : [];
  const sorting: SortingState = decodedSort.map((sortParam) => ({
    id: sortParam.id,
    desc: sortParam.direction === "desc",
  }));
  const tableStorageId = useMemo(() => {
    const columnIds = columns
      .map((column, index) => {
        if ("id" in column && Schema.is(Schema.String)(column.id)) {
          return column.id;
        }

        if (
          "accessorKey" in column &&
          Schema.is(Schema.String)(column.accessorKey)
        ) {
          return column.accessorKey;
        }

        return String(index);
      })
      .join(",");

    return `${storagePath}:${columnIds}`;
  }, [columns, storagePath]);
  const columnVisibilityAtom = useMemo(
    () =>
      Atom.kvs({
        runtime: dataTableStorageRuntime,
        key: `data-table:column-visibility:${tableStorageId}`,
        schema: ColumnVisibilitySchema,
        defaultValue: () => defaultColumnVisibility ?? {},
      }),
    [defaultColumnVisibility, tableStorageId],
  );
  const columnSizingAtom = useMemo(
    () =>
      Atom.kvs({
        runtime: dataTableStorageRuntime,
        key: `data-table:column-sizing:${tableStorageId}`,
        schema: ColumnSizingSchema,
        defaultValue: () => ({}),
      }),
    [tableStorageId],
  );
  const viewAtom = useMemo(
    () =>
      Atom.kvs({
        runtime: dataTableStorageRuntime,
        key: `data-table:view:${tableStorageId}`,
        schema: DataTableViewSchema,
        defaultValue: (): DataTableView => "table",
      }),
    [tableStorageId],
  );
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [columnSizing, setColumnSizing] = useAtom(columnSizingAtom);
  const [storedView, setStoredView] = useAtom(viewAtom);
  const currentView: DataTableView = showGallery ? storedView : "table";
  const isGalleryView = currentView === "gallery";

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
  const availableGroupFieldIds =
    grouping?.fields.map((field) => field.id) ?? [];
  const activeGrouping =
    urlGrouping?.filter((groupId) =>
      availableGroupFieldIds.includes(groupId),
    ) ?? getDefaultGrouping(grouping);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const updateTableSearch = (
    updater: (current: TableSearchRecord) => TableSearchRecord,
    options?: { replace?: boolean },
  ) => {
    if (controlledSearch || onSearchChange || searchState === "local") {
      const nextSearch = Schema.decodeUnknownSync(TableSearchSchema)(
        updater(controlledSearch ?? localSearch),
      );

      if (onSearchChange) {
        onSearchChange(nextSearch);
      } else {
        setLocalSearch(nextSearch);
      }
      return;
    }

    navigate({
      to: ".",
      replace: options?.replace ?? false,
      resetScroll: false,
      search: (current: TableSearchRecord) =>
        validateTableSearchUpdate(updater(current)),
    });
  };

  const table = useDataTable({
    key: tableStorageId,
    data,
    columns,
    onColumnSizingChange: (updater) => {
      const nextColumnSizing =
        updater instanceof Function ? updater(columnSizing) : updater;

      setColumnSizing(nextColumnSizing);
    },
    ...(selectionFeature
      ? { getRowId: selectionFeature.getRowId }
      : reordering
        ? { getRowId: reordering.getRowId }
        : {}),
    enableRowSelection: selectionFeature?.isRowSelectable
      ? (row) => selectionFeature.isRowSelectable?.(row.original) ?? true
      : selectable,
    enableMultiRowSelection: selectable,
    onPaginationChange: (updater) => {
      const newPagination =
        updater instanceof Function ? updater(pagination) : updater;
      if (
        pagination.pageIndex === newPagination.pageIndex &&
        pagination.pageSize === newPagination.pageSize
      ) {
        return;
      }
      updateTableSearch((current) => ({
        ...current,
        page: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      }));
    },
    onSortingChange: (updater) => {
      const newSorting =
        updater instanceof Function ? updater([...sorting]) : updater;
      if (
        sorting.length === newSorting.length &&
        sorting.every(
          (sortState, i) =>
            sortState.id === newSorting[i]?.id &&
            sortState.desc === newSorting[i]?.desc,
        )
      ) {
        return;
      }
      const nextSort = newSorting.length
        ? Schema.encodeSync(SortParamsFromString)(
            newSorting.map((sortState) => ({
              id: sortState.id,
              direction: sortState.desc ? "desc" : "asc",
            })),
          )
        : undefined;
      updateTableSearch((current) => ({
        ...current,
        sort: nextSort,
        page: 0,
      }));
    },
    onGlobalFilterChange: (updater) => {
      const newGlobalFilter =
        updater instanceof Function ? updater(globalFilter) : updater;
      if (globalFilter === newGlobalFilter) {
        return;
      }
      updateTableSearch(
        (current) => ({
          ...current,
          page: 0,
          globalFilter: newGlobalFilter,
        }),
        { replace: true },
      );
    },
    manualSorting: isServerMode || undefined,
    manualFiltering: isServerMode || undefined,
    ...(paginationFeature !== false && paginationFeature.mode === "server"
      ? { manualPagination: true, rowCount: paginationFeature.rowCount }
      : paginationFeature === false
        ? { manualPagination: true }
        : {}),
    autoResetPageIndex: false,
    onColumnVisibilityChange: (updater) => {
      const nextColumnVisibility =
        updater instanceof Function ? updater(columnVisibility) : updater;

      setColumnVisibility(nextColumnVisibility);
    },
    onRowSelectionChange: (updater) => {
      setRowSelection((current) => {
        const next = updater instanceof Function ? updater(current) : updater;
        selectionFeature?.onSelectionChange?.(
          data.filter((row) => next[selectionFeature.getRowId(row)]),
        );
        return next;
      });
    },
    state: {
      sorting,
      pagination,
      globalFilter,
      columnVisibility,
      columnSizing,
      rowSelection,
    },
  });

  const activeGroupingFields = useMemo(
    () =>
      activeGrouping
        .map((groupId) =>
          grouping?.fields.find((field) => field.id === groupId),
        )
        .filter((field): field is DataTableGroupingField<TData> => !!field),
    [activeGrouping, grouping],
  );
  const hasActiveGrouping = activeGroupingFields.length > 0;
  const filteredRows = table.getPrePaginatedRowModel().rows;
  const selectedRows = selectionFeature
    ? data.filter((row) => rowSelection[selectionFeature.getRowId(row)])
    : [];
  const exportRows =
    exportFeature && exportFeature.scope === "filteredRows"
      ? filteredRows
      : table.getRowModel().rows;
  const bodyRows = hasActiveGrouping ? filteredRows : table.getRowModel().rows;
  const sortableRowIds = bodyRows.map((row) => getSortableRowId(row.id));
  const groupedSections = useMemo(
    () => buildGroupedSections(bodyRows, activeGroupingFields),
    [activeGroupingFields, bodyRows],
  );
  const canReorderRows = Boolean(reordering) && !hasActiveGrouping;
  const colSpan =
    Math.max(table.getVisibleLeafColumns().length, 1) +
    (rowActions ? 1 : 0) +
    (selectable ? 1 : 0) +
    (canReorderRows ? 1 : 0);
  const canDragRows = activeGroupingFields.some(
    (field) => !!field.onMoveToGroup,
  );
  const addGroupingField = (fieldId: string) => {
    if (activeGrouping.includes(fieldId)) return;
    updateTableSearch((current) => ({
      ...current,
      grouping: [...activeGrouping, fieldId],
    }));
  };

  const removeGroupingField = (fieldId: string) => {
    updateTableSearch((current) => ({
      ...current,
      grouping: activeGrouping.filter((currentId) => currentId !== fieldId),
    }));
  };

  const toggleGroupingField = (fieldId: string, enabled: boolean) => {
    if (enabled) {
      addGroupingField(fieldId);
      return;
    }

    removeGroupingField(fieldId);
  };

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  const setView = (nextView: DataTableView) => {
    if (nextView === currentView) {
      return;
    }

    setStoredView(nextView);
  };

  const renderLoadingState = () => <Loading label={labels.loading} />;

  const renderEmptyContent = () =>
    state?.error ?? (isLoading ? renderLoadingState() : emptyContent);

  const renderTableEmptyState = () => (
    <TableRow>
      <TableCell className="h-24 text-center" colSpan={colSpan}>
        {renderEmptyContent()}
      </TableCell>
    </TableRow>
  );

  const renderGalleryEmptyState = (message?: ReactNode) => (
    <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-10 text-center text-sm">
      {message ?? renderEmptyContent()}
    </div>
  );

  const renderGalleryRows = (rows: DataTableRow<TData>[], canDrag: boolean) => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <DataTableGalleryCard
          canDrag={canDrag}
          dragLabel={grouping?.getRowLabel?.(row.original)}
          gallery={galleryConfig}
          key={row.id}
          onRowClick={onRowClick}
          row={row}
          rowActions={rowActions}
          rowActionsLabel={rowActionsLabel}
          selectRowLabel={labels.selectRow}
          selectable={selectable}
          table={table}
        />
      ))}
    </div>
  );

  const renderGroupedTableSections = (
    sections: GroupSection<TData>[],
  ): ReactNode =>
    sections.flatMap((section) => {
      const isCollapsed = collapsedGroups[section.key] ?? false;
      const hasChildren = section.children.length > 0;
      const sectionBody = (
        <GroupTableSection key={section.key} section={section}>
          <GroupHeaderRow
            collapsed={isCollapsed}
            colSpan={colSpan}
            onToggle={() => toggleGroup(section.key)}
            section={section}
          />
          {!isCollapsed &&
            !hasChildren &&
            (section.rows.length > 0 ? (
              section.rows.map((row) => (
                <DataTableRow
                  canDrag={canDragRows}
                  canReorder={false}
                  dragLabel={grouping?.getRowLabel?.(row.original)}
                  indentDepth={section.depth + 1}
                  key={row.id}
                  onRowClick={onRowClick}
                  row={row}
                  rowActions={rowActions}
                  rowActionsLabel={rowActionsLabel}
                  selectRowLabel={labels.selectRow}
                  selectable={selectable}
                  table={table}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="text-muted-foreground h-16"
                  colSpan={colSpan}
                  style={{
                    paddingLeft: `calc(0.5rem + ${section.depth * GROUP_INDENT_PX + GROUP_ROW_INDENT_OFFSET_PX}px)`,
                  }}
                >
                  {isLoading
                    ? renderLoadingState()
                    : (section.field.renderEmptyGroup?.(section.groupId) ??
                      labels.empty)}
                </TableCell>
              </TableRow>
            ))}
        </GroupTableSection>
      );

      return !isCollapsed && hasChildren
        ? [sectionBody, renderGroupedTableSections(section.children)]
        : [sectionBody];
    });

  const renderGroupedGallerySections = (
    sections: GroupSection<TData>[],
  ): ReactNode =>
    sections.map((section) => {
      const isCollapsed = collapsedGroups[section.key] ?? false;
      const hasChildren = section.children.length > 0;

      return (
        <div className="space-y-3" key={section.key}>
          <GroupHeaderCard
            collapsed={isCollapsed}
            onToggle={() => toggleGroup(section.key)}
            section={section}
          />
          {!isCollapsed &&
            (hasChildren
              ? renderGroupedGallerySections(section.children)
              : section.rows.length > 0
                ? renderGalleryRows(section.rows, canDragRows)
                : renderGalleryEmptyState(
                    isLoading
                      ? renderLoadingState()
                      : (section.field.renderEmptyGroup?.(section.groupId) ??
                          labels.empty),
                  ))}
        </div>
      );
    });

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragLabel(null);
    if (!over) return;

    const reorderData = decodeRowReorderDragData(active.data.current);
    if (Option.isSome(reorderData) && reordering && canReorderRows) {
      const sourceRowId = String(active.id).replace(/^sortable-row:/, "");
      const targetRowId = String(over.id).replace(/^sortable-row:/, "");
      const currentIndex = bodyRows.findIndex((row) => row.id === sourceRowId);
      const nextIndex = bodyRows.findIndex((row) => row.id === targetRowId);

      if (
        currentIndex !== -1 &&
        nextIndex !== -1 &&
        currentIndex !== nextIndex
      ) {
        reordering.onReorder(
          arrayMove(
            bodyRows.map((row) => row.original),
            currentIndex,
            nextIndex,
          ),
        );
      }
      return;
    }

    const rowData = decodeRowDragData(active.data.current);
    const groupData = decodeGroupDropData(over.data.current);
    if (Option.isNone(rowData) || Option.isNone(groupData)) return;

    const row = bodyRows.find(({ id }) => id === rowData.value.rowId)?.original;
    const field = grouping?.fields.find(
      (currentField) => currentField.id === groupData.value.fieldId,
    );
    const nextGroupId = groupData.value.groupId;

    if (row && field?.onMoveToGroup && field.getGroupId(row) !== nextGroupId) {
      field.onMoveToGroup(row, nextGroupId);
    }
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    const rowData = decodeRowDragData(active.data.current);
    setActiveDragLabel(
      Option.isSome(rowData) ? (rowData.value.label ?? null) : null,
    );
  };

  return (
    <div className="w-full max-w-full min-w-0 rounded-md">
      <DataTableToolbar
        activeGrouping={activeGrouping}
        bulkActions={bulkActions}
        exportBaseName={exportBaseName}
        exportRows={exportRows}
        grouping={grouping}
        labels={labels}
        onRefresh={onRefresh}
        onToggleGrouping={toggleGroupingField}
        onViewChange={setView}
        selectedRows={selectedRows}
        showColumnVisibility={showColumnVisibility}
        showExport={showExport}
        showGallery={showGallery}
        showSearch={showSearch}
        showSorting={showSorting}
        table={table}
        view={currentView}
      />
      <DndContext
        onDragCancel={() => setActiveDragLabel(null)}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <table.AppTable>
          {isGalleryView ? (
            hasActiveGrouping ? (
              groupedSections.length > 0 ? (
                <div className="space-y-4">
                  {renderGroupedGallerySections(groupedSections)}
                </div>
              ) : (
                renderGalleryEmptyState()
              )
            ) : bodyRows.length > 0 ? (
              renderGalleryRows(bodyRows, false)
            ) : (
              renderGalleryEmptyState()
            )
          ) : (
            <ScrollArea className="-m-1 max-w-full min-w-0">
              <div className="max-w-full min-w-0 p-1">
                <Table
                  className="table-fixed"
                  style={{
                    width: `max(100%, ${table.getTotalSize() + (canReorderRows ? 40 : 0) + (selectable ? 40 : 0) + (rowActions ? 40 : 0)}px)`,
                  }}
                >
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="p-4">
                        {selectable ? (
                          <TableHead className="w-10 min-w-10 pr-0">
                            <Checkbox
                              aria-label={labels.selectAllRows}
                              checked={table.getIsAllPageRowsSelected()}
                              indeterminate={
                                table.getIsSomePageRowsSelected() &&
                                !table.getIsAllPageRowsSelected()
                              }
                              onCheckedChange={(checked) =>
                                table.toggleAllPageRowsSelected(checked)
                              }
                            />
                          </TableHead>
                        ) : null}
                        {canReorderRows ? (
                          <TableHead className="w-10 min-w-10 p-0" />
                        ) : null}
                        {headerGroup.headers.map((header) => (
                          <table.AppHeader header={header} key={header.id}>
                            {(appHeader) => (
                              <TableHead
                                className="relative h-12 min-w-32 p-0"
                                style={{ width: header.getSize() }}
                              >
                                {header.isPlaceholder ? null : (
                                  <appHeader.FlexRender />
                                )}
                                {header.column.getCanResize() ? (
                                  <button
                                    aria-label={labels.resizeColumn(
                                      getHeaderName(header),
                                    )}
                                    aria-orientation="vertical"
                                    aria-valuemax={
                                      header.column.columnDef.maxSize ??
                                      DEFAULT_COLUMN_MAX_SIZE
                                    }
                                    aria-valuemin={
                                      header.column.columnDef.minSize ??
                                      DEFAULT_COLUMN_MIN_SIZE
                                    }
                                    aria-valuenow={header.column.getSize()}
                                    className={cn(
                                      "hover:bg-primary/60 absolute inset-y-0 right-0 z-10 w-1 cursor-col-resize touch-none bg-transparent p-0 select-none",
                                      header.column.getIsResizing() &&
                                        "bg-primary",
                                    )}
                                    onKeyDown={(event) => {
                                      const minSize =
                                        header.column.columnDef.minSize ??
                                        DEFAULT_COLUMN_MIN_SIZE;
                                      const maxSize =
                                        header.column.columnDef.maxSize ??
                                        DEFAULT_COLUMN_MAX_SIZE;
                                      const currentSize =
                                        header.column.getSize();
                                      const nextSize =
                                        event.key === "ArrowLeft"
                                          ? currentSize - COLUMN_RESIZE_STEP
                                          : event.key === "ArrowRight"
                                            ? currentSize + COLUMN_RESIZE_STEP
                                            : event.key === "Home"
                                              ? minSize
                                              : event.key === "End"
                                                ? maxSize
                                                : undefined;

                                      if (nextSize === undefined) return;
                                      event.preventDefault();
                                      table.setColumnSizing((current) => ({
                                        ...current,
                                        [header.column.id]: Math.min(
                                          maxSize,
                                          Math.max(minSize, nextSize),
                                        ),
                                      }));
                                    }}
                                    role="separator"
                                    type="button"
                                    onDoubleClick={() =>
                                      header.column.resetSize()
                                    }
                                    onMouseDown={header.getResizeHandler()}
                                    onTouchStart={header.getResizeHandler()}
                                  />
                                ) : null}
                              </TableHead>
                            )}
                          </table.AppHeader>
                        ))}
                        {rowActions ? (
                          <TableHead className="w-10 min-w-10 p-0" />
                        ) : null}
                      </TableRow>
                    ))}
                  </TableHeader>
                  {hasActiveGrouping ? (
                    groupedSections.length > 0 ? (
                      renderGroupedTableSections(groupedSections)
                    ) : (
                      <TableBody className="px-2">
                        {renderTableEmptyState()}
                      </TableBody>
                    )
                  ) : (
                    <TableBody className="px-2">
                      {bodyRows.length > 0 ? (
                        canReorderRows ? (
                          <SortableContext
                            items={sortableRowIds}
                            strategy={verticalListSortingStrategy}
                          >
                            {bodyRows.map((row) => (
                              <DataTableRow
                                canDrag={false}
                                canReorder
                                dragLabel={reordering?.getRowLabel?.(
                                  row.original,
                                )}
                                key={row.id}
                                onRowClick={onRowClick}
                                reorderHandleLabel={
                                  reordering?.handleLabel ?? labels.reorder
                                }
                                row={row}
                                rowActions={rowActions}
                                rowActionsLabel={rowActionsLabel}
                                selectRowLabel={labels.selectRow}
                                selectable={selectable}
                                table={table}
                              />
                            ))}
                          </SortableContext>
                        ) : (
                          bodyRows.map((row) => (
                            <DataTableRow
                              canDrag={false}
                              canReorder={false}
                              key={row.id}
                              onRowClick={onRowClick}
                              row={row}
                              rowActions={rowActions}
                              rowActionsLabel={rowActionsLabel}
                              selectRowLabel={labels.selectRow}
                              selectable={selectable}
                              table={table}
                            />
                          ))
                        )
                      ) : (
                        renderTableEmptyState()
                      )}
                    </TableBody>
                  )}
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
          <DragOverlay modifiers={[snapDragOverlayVerticalCenterToCursor]}>
            {activeDragLabel ? (
              <div className="bg-background rounded-md border px-3 py-2 text-sm shadow-sm">
                {activeDragLabel}
              </div>
            ) : null}
          </DragOverlay>
        </table.AppTable>
      </DndContext>
      {showPagination && !hasActiveGrouping && (
        <div className="p-2">
          <DataTablePagination
            messages={labels}
            pageSizes={pageSizes}
            rowCount={serverRowCount}
            table={table}
          />
        </div>
      )}
    </div>
  );
}

function DataTableDisplayModeSwitch({
  messages,
  value,
  onChange,
}: {
  messages: DataTableMessages;
  value: DataTableView;
  onChange: (value: DataTableView) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={messages.view}
            className="h-9"
            size="sm"
            variant="outline"
          >
            {value === "gallery" ? <LayoutGrid /> : <Rows3 />}
            <span className="hidden sm:inline">{messages.view}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => {
            const view = decodeDataTableView(nextValue);
            if (Option.isSome(view)) onChange(view.value);
          }}
        >
          <DropdownMenuRadioItem value="table">
            <Rows3 />
            {messages.tableView}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="gallery">
            <LayoutGrid />
            {messages.galleryView}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DataTableSortDropdown<TData extends RowData>({
  messages,
  table,
}: {
  messages: DataTableMessages;
  table: DataTableInstance<TData>;
}) {
  const sorting = table.state.sorting;
  const sortableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanSort());
  const columnLabels = getColumnLabels(table);

  if (sortableColumns.length === 0) {
    return null;
  }

  const activeSortColumn = sorting.length > 0 ? sorting[0] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={messages.sortBy}
            className="h-9"
            size="sm"
            variant="outline"
          >
            {activeSortColumn ? (
              activeSortColumn.desc ? (
                <ArrowDown />
              ) : (
                <ArrowUp />
              )
            ) : (
              <ChevronsUpDown />
            )}
            <span className="hidden sm:inline">{messages.sortBy}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{messages.sortBy}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sortableColumns.map((column) => {
            const sortState = sorting.find((s) => s.id === column.id);
            const label = columnLabels.get(column.id) ?? column.id;

            return (
              <DropdownMenuSub key={column.id}>
                <DropdownMenuSubTrigger inset={!!sortState}>
                  {sortState ? (
                    <span className="pointer-events-none absolute left-3 flex size-4 items-center justify-center">
                      {sortState.desc ? <ArrowDown /> : <ArrowUp />}
                    </span>
                  ) : null}
                  {label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                    <ArrowUp />
                    {messages.sortAsc}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                    <ArrowDown />
                    {messages.sortDesc}
                  </DropdownMenuItem>
                  {sortState && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => column.clearSorting()}>
                        {messages.sortClear}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DataTableViewOptions<TData extends RowData>({
  messages,
  table,
}: {
  messages: DataTableMessages;
  table: DataTableInstance<TData>;
}) {
  const columnLabels = getColumnLabels(table);
  const columns = table
    .getAllColumns()
    .filter((column) => column.accessorFn !== undefined && column.getCanHide());

  if (columns.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={messages.columns}
            className="h-9"
            size="sm"
            variant="outline"
          >
            <Settings2 />
            <span className="hidden sm:inline">{messages.columns}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{messages.columns}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              checked={column.getIsVisible()}
              className="capitalize"
              key={column.id}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {columnLabels.get(column.id) ?? column.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DataTablePaginationProps<TData extends RowData> {
  messages?: DataTableMessageOverrides;
  pageSizes?: readonly number[] | undefined;
  rowCount?: number | undefined;
  table: DataTableInstance<TData>;
}

export function DataTablePagination<TData extends RowData>({
  messages,
  pageSizes = [10, 20, 30, 40, 50],
  rowCount,
  table,
}: DataTablePaginationProps<TData>) {
  const labels = dataTableMessages(messages);
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const totalRows = rowCount ?? filteredRows;

  return (
    <Pagination
      messages={{
        pageSize: labels.pageSize,
        results: labels.results,
        selectedOf: labels.selectedOf,
        pageOf: labels.pageOf,
        goToFirstPage: labels.goToFirstPage,
        goToPreviousPage: labels.goToPreviousPage,
        goToNextPage: labels.goToNextPage,
        goToLastPage: labels.goToLastPage,
      }}
      onPageChange={(page) => table.setPageIndex(page)}
      onPageSizeChange={(pageSize) => table.setPageSize(pageSize)}
      page={table.state.pagination.pageIndex}
      pageCount={table.getPageCount()}
      pageSize={table.state.pagination.pageSize}
      pageSizes={pageSizes}
      selectedRows={selectedRows}
      totalRows={totalRows}
    />
  );
}

export function DataTableRelationshipCell({
  emptyLabel,
  manageLabel,
  onAdd,
  onRemove,
  options,
  value,
}: {
  emptyLabel: string;
  from?: ValidateFromPath;
  manageLabel: string;
  onAdd?: (value: string) => void;
  onRemove?: (value: string) => void;
  options: readonly DataTableRelationshipOption[];
  value: readonly DataTableRelationshipOption[];
}) {
  const [selectedOptions, setSelectedOptions] = useState(() => [...value]);
  const selectedValues = new Set(selectedOptions.map(({ value }) => value));
  const orderedOptions = [...options].sort(
    (a, b) =>
      Number(selectedValues.has(b.value)) - Number(selectedValues.has(a.value)),
  );

  useEffect(() => {
    setSelectedOptions([...value]);
  }, [value]);

  return (
    <VirtualizedCombobox
      ariaLabel={manageLabel}
      emptyLabel={emptyLabel}
      items={orderedOptions}
      messages={{ search: manageLabel }}
      multiple
      onValueChange={(nextOptions) => {
        const nextValues = new Set(nextOptions.map(({ value }) => value));
        for (const option of selectedOptions) {
          if (!nextValues.has(option.value)) onRemove?.(option.value);
        }
        for (const option of nextOptions) {
          if (!selectedValues.has(option.value)) onAdd?.(option.value);
        }
        setSelectedOptions(nextOptions);
      }}
      placeholder={emptyLabel}
      trigger={
        <Button
          aria-label={manageLabel}
          className="h-full min-h-16 w-full min-w-0 justify-between gap-2 overflow-hidden rounded-none px-2 py-2 text-left font-normal"
          data-slot="relationship-cell"
          type="button"
          variant="ghost"
        >
          <DataTableListSummary
            emptyLabel={emptyLabel}
            expandable={false}
            items={selectedOptions}
            variant={selectedOptions.some(({ icon }) => icon) ? "icon" : "text"}
          />
          <ChevronDown className="text-muted-foreground size-4 shrink-0" />
        </Button>
      }
      value={selectedOptions}
    />
  );
}

export function DataTableListSummary({
  emptyLabel,
  expandable = true,
  items,
  overflowLabel,
  totalCount = items.length,
  variant = "text",
  visibleCount = 3,
}: {
  emptyLabel: ReactNode;
  expandable?: boolean | undefined;
  items: readonly (
    | string
    | { icon?: ReactNode; label: string; value?: string }
  )[];
  overflowLabel?: ((remaining: number) => ReactNode) | undefined;
  totalCount?: number | undefined;
  variant?: "icon" | "text" | undefined;
  visibleCount?: number | undefined;
}) {
  const labels = dataTableMessages();
  const normalizedItems = items.map((item) =>
    Schema.is(Schema.String)(item) ? { label: item } : item,
  );
  const visibleItems = normalizedItems.slice(0, visibleCount);
  const visibleLabels = visibleItems.map(({ label }) => label).join(", ");
  const remaining = Math.max(totalCount - visibleItems.length, 0);
  const remainingLabel =
    overflowLabel?.(remaining) ?? labels.listOthers(remaining);
  const expandedItems = (
    <PopoverContent
      align="start"
      className="max-h-72 w-72 overflow-y-auto p-2"
      onClick={(event) => event.stopPropagation()}
    >
      <ul className="grid gap-1">
        {normalizedItems.map((item, index) => (
          <li
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 break-words"
            key={item.value ?? `${item.label}-${index}`}
          >
            {item.icon ? (
              <span className="bg-muted flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-[9px] font-semibold">
                {item.icon}
              </span>
            ) : null}
            <span className="min-w-0">{item.label}</span>
          </li>
        ))}
      </ul>
    </PopoverContent>
  );

  if (normalizedItems.length === 0) {
    return <span className="text-muted-foreground text-sm">{emptyLabel}</span>;
  }

  if (variant === "icon") {
    return (
      <TooltipProvider>
        <span className="flex min-w-0 items-center pl-2">
          {visibleItems.map((item, index) => (
            <Tooltip key={item.value ?? item.label}>
              <TooltipTrigger
                render={
                  <span
                    aria-label={item.label}
                    className="bg-muted border-background relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-[10px] font-semibold"
                    style={{ marginLeft: index ? -8 : 0 }}
                  >
                    {item.icon ?? item.label.slice(0, 2).toUpperCase()}
                  </span>
                }
              />
              <TooltipContent>{item.label}</TooltipContent>
            </Tooltip>
          ))}
          {remaining ? (
            expandable ? (
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      aria-label={labels.listOthers(remaining)}
                      className="bg-muted border-background relative -ml-2 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold tabular-nums"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      type="button"
                    >
                      +{remaining}
                    </button>
                  }
                />
                {expandedItems}
              </Popover>
            ) : (
              <span className="bg-muted border-background relative -ml-2 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold tabular-nums">
                +{remaining}
              </span>
            )
          ) : null}
        </span>
      </TooltipProvider>
    );
  }

  return remaining > 0 ? (
    <span
      className="block min-w-0 text-sm whitespace-normal"
      data-slot="list-summary"
    >
      <span>{visibleLabels}</span>{" "}
      <span className="inline-block whitespace-nowrap">
        {expandable ? (
          <Popover>
            <PopoverTrigger
              render={
                <button
                  className="text-muted-foreground hover:text-foreground underline decoration-dotted underline-offset-2"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  type="button"
                >
                  {remainingLabel}
                </button>
              }
            />
            {expandedItems}
          </Popover>
        ) : (
          remainingLabel
        )}
      </span>
    </span>
  ) : (
    <span className="block min-w-0 text-sm" data-slot="list-summary">
      {visibleLabels}
    </span>
  );
}

interface DataTableColumnHeaderProps<
  TData extends RowData,
  TValue,
> extends HTMLAttributes<HTMLDivElement> {
  column: DataTableColumn<TData, TValue>;
  messages?: DataTableMessageOverrides;
  title: string;
}

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  messages,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const labels = dataTableMessages(messages);
  const sortDirection = column.getIsSorted();

  if (!column.getCanSort()) {
    return (
      <div
        className={cn(
          "flex h-12 items-center truncate px-2 text-sm",
          className,
        )}
      >
        {title}
      </div>
    );
  }

  return (
    <div className={cn("flex h-12 items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="data-[state=open]:bg-accent h-8 max-w-full justify-start px-2"
            >
              <span className="min-w-0 truncate text-sm">{title}</span>
              {sortDirection === "desc" ? (
                <ArrowDown />
              ) : sortDirection === "asc" ? (
                <ArrowUp />
              ) : (
                <ChevronsUpDown />
              )}
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="max-w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <ArrowUp className="text-muted-foreground/70 h-3.5 w-3.5" />
              {labels.sortAsc}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDown className="text-muted-foreground/70 h-3.5 w-3.5" />
              {labels.sortDesc}
            </DropdownMenuItem>
            {sortDirection ? (
              <DropdownMenuItem onClick={() => column.clearSorting()}>
                <X className="text-muted-foreground/70 h-3.5 w-3.5" />
                {labels.sortClear}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff className="text-muted-foreground/70 h-3.5 w-3.5" />
              {labels.sortHide}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
