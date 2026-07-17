import { Button } from "@/components/ui/button";
import { VirtualizedCombobox } from "@/components/ui/virtualized-combobox";
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
import { Query, SortParamsFromString } from "@/lib/query";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  type Modifier,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useNavigate,
  useRouterState,
  type ValidateFromPath,
} from "@tanstack/react-router";
import { useAtom } from "@effect/atom-react";
import { BrowserKeyValueStore } from "@effect/platform-browser";
import {
  type Column,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Header,
  type Row,
  type RowData,
  type SortingState,
  type Table as TanstackTable,
  useReactTable,
} from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    truncate?: boolean;
  }
}
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
  useEffect,
  useMemo,
  useState,
  createContext,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Effect, Layer, Schema } from "effect";
import { KeyValueStore } from "effect/unstable/persistence";
import { Atom } from "effect/unstable/reactivity";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLocale } from "@/paraglide/runtime";
import { Loading } from "@/components/ui/loading";

const DataTableViewContext = createContext<DataTableView>("table");

export const TableSearchSchema = Schema.Struct({
  page: Schema.optional(Query.fields.page),
  pageSize: Schema.optional(Query.fields.pageSize),
  globalFilter: Query.fields.globalFilter,
  sort: Query.fields.sort,
  grouping: Schema.optional(Schema.Array(Schema.String)),
});

export const TableSearchSchemaStandard =
  Schema.toStandardSchemaV1(TableSearchSchema);
export type TableParams = Schema.Schema.Type<typeof TableSearchSchema>;

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
]);
type DataTableView = typeof DataTableViewSchema.Type;

const ColumnVisibilitySchema = Schema.Record(Schema.String, Schema.Boolean);
const ColumnSizingSchema = Schema.Record(Schema.String, Schema.Number);

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

export interface DataTableFeatures<TData> {
  pagination?: DataTablePaginationFeature;
  search?: boolean;
  export?: false | DataTableExportFeature;
  columnVisibility?: boolean;
  gallery?: false | DataTableGalleryConfig;
  sorting?: boolean;
  rowActions?: false | DataTableRowActionsFeature<TData>;
}

type LegacyDataTableRowAction<TData> = Omit<DataTableRowAction<TData>, "id"> & {
  id?: string;
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
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

type GroupSection<TData> = {
  key: string;
  groupId: string;
  depth: number;
  field: DataTableGroupingField<TData>;
  rows: Row<TData>[];
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
    !(activatorEvent instanceof MouseEvent) ||
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
            className="size-7 shadow-md [&_svg:not([class*='size-'])]:size-3.5"
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

const buildGroupedSections = <TData,>(
  rows: Row<TData>[],
  fields: DataTableGroupingField<TData>[],
  depth = 0,
  parentKey = "",
): GroupSection<TData>[] => {
  if (fields.length === 0) {
    return [];
  }

  const [field, ...remainingFields] = fields;
  const groups = new Map<string, Row<TData>[]>();

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

const GroupHeaderRow = <TData,>({
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
  const label =
    section.field.getGroupLabel?.(
      section.groupId,
      section.rows.map((row) => row.original),
    ) ?? section.groupId;
  const renderedLabel =
    section.field.renderGroupLabel?.(
      section.groupId,
      section.rows.map((row) => row.original),
    ) ?? label;

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
          <div className="min-w-0 flex-1 text-left">{renderedLabel}</div>
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

const GroupTableSection = <TData,>({
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

const GroupHeaderCard = <TData,>({
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

  const label =
    section.field.getGroupLabel?.(
      section.groupId,
      section.rows.map((row) => row.original),
    ) ?? section.groupId;
  const renderedLabel =
    section.field.renderGroupLabel?.(
      section.groupId,
      section.rows.map((row) => row.original),
    ) ?? label;

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
        <div className="min-w-0 flex-1">{renderedLabel}</div>
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

const DataTableRow = <TData,>({
  canDrag,
  canReorder,
  dragLabel,
  indentDepth = 0,
  reorderHandleLabel,
  onRowClick,
  row,
  rowActions,
  rowActionsLabel,
}: {
  canDrag: boolean;
  canReorder: boolean;
  dragLabel?: string | undefined;
  indentDepth?: number | undefined;
  reorderHandleLabel?: string | undefined;
  onRowClick?: ((row: TData) => void) | undefined;
  row: Row<TData>;
  rowActions?: readonly DataTableRowAction<TData>[] | undefined;
  rowActionsLabel?: string | undefined;
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
      row: row.original,
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
        "h-16 focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid",
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
        const isLastCell = index === visibleCells.length - 1;
        return (
          <TableCell
            key={cell.id}
            className={cn(
              "align-center min-w-32 overflow-hidden [&:has([data-slot=relationship-cell])]:relative [&:has([data-slot=relationship-cell])]:p-0 [&:has([data-slot=relationship-cell])>div]:absolute [&:has([data-slot=relationship-cell])>div]:inset-0",
              cell.column.columnDef.meta?.truncate
                ? "whitespace-nowrap"
                : "whitespace-normal",
              rowActions &&
                isLastCell &&
                "min-w-40 pr-12 [&:has([data-slot=relationship-cell])]:pr-0 [&:has([data-slot=relationship-cell])>div]:mr-11",
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
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </TableCell>
        );
      })}
      {rowActions ? (
        <TableCell className="sticky right-0 z-20 w-0 min-w-0 overflow-visible p-0">
          <div className="bg-background/95 absolute top-1/2 right-2 -translate-y-1/2 rounded-md shadow-sm backdrop-blur">
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

const DataTableGalleryCard = <TData,>({
  canDrag,
  dragLabel,
  gallery,
  onRowClick,
  row,
  rowActions,
  rowActionsLabel,
  table,
}: {
  canDrag: boolean;
  dragLabel?: string | undefined;
  gallery?: DataTableGalleryConfig | undefined;
  onRowClick?: ((row: TData) => void) | undefined;
  row: Row<TData>;
  rowActions?: readonly DataTableRowAction<TData>[] | undefined;
  rowActionsLabel?: string | undefined;
  table: TanstackTable<TData>;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getRowDragId(row.id),
    disabled: !canDrag,
    data: {
      type: "row",
      row: row.original,
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
        <CardHeader className={cn(rowActions && "pr-14")}>
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
        "gap-3 transition-colors",
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

const extractTextFromElement = (element: unknown): string | null => {
  if (typeof element === "string") return element;
  if (typeof element === "number") return String(element);
  if (!element || typeof element !== "object") return null;
  const props = (element as any).props;
  if (!props) return null;
  if (typeof props.title === "string") return props.title;
  return extractTextFromElement(props.children);
};

const getHeaderName = (header: Header<any, unknown>): string => {
  const columnDef = header.column.columnDef;
  if (typeof columnDef.header === "function") {
    const headerContext = columnDef.header(header.getContext());
    if (typeof headerContext === "string") {
      return headerContext;
    }
    return extractTextFromElement(headerContext) ?? header.id;
  }

  return String(columnDef.header ?? header.id);
};

export const getHeaderNames = (headers: Header<any, unknown>[]): string[] =>
  headers.map((header) => getHeaderName(header));

const getColumnDisplayName = <TData,>(
  table: TanstackTable<TData>,
  columnId: string,
) => {
  const header = table
    .getFlatHeaders()
    .find((currentHeader) => currentHeader.column.id === columnId);
  return header ? getHeaderName(header) : columnId;
};

const renderHeader = <TData, TValue>(header: Header<TData, TValue>) => {
  if (header.isPlaceholder) return null;

  const content = flexRender(
    header.column.columnDef.header,
    header.getContext(),
  );

  return typeof content === "string" || typeof content === "number" ? (
    <div className="flex h-12 items-center px-2 text-sm">{content}</div>
  ) : (
    content
  );
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

export const downloadJson = (data: unknown, fileName = "data.json") => {
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

const exportTableToCsv = <TData,>(
  table: TanstackTable<TData>,
  rows: Row<TData>[],
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

const exportTableToJson = <TData,>(
  table: TanstackTable<TData>,
  rows: Row<TData>[],
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

export function DataTable<TData, TValue>({
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
}: DataTableProps<TData, TValue>) {
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
  const showColumnVisibility = features?.columnVisibility ?? true;
  const showGallery = !!galleryConfig;
  const showSorting = features?.sorting ?? true;
  const isServerMode =
    paginationFeature !== false && paginationFeature.mode === "server";
  const serverRowCount = isServerMode ? paginationFeature.rowCount : undefined;
  const location = useRouterState({
    select: (state) => state.location,
  });
  const search = location.search as TableParams | undefined;
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
        if ("id" in column && typeof column.id === "string") {
          return column.id;
        }

        if ("accessorKey" in column && typeof column.accessorKey === "string") {
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
        defaultValue: () => ({}),
      }),
    [tableStorageId],
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
  const hasToolbar = Boolean(
    showSearch ||
    grouping?.fields.length ||
    showSorting ||
    showGallery ||
    showColumnVisibility ||
    onRefresh ||
    showExport,
  );

  const [rowSelection, setRowSelection] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
  const [refreshSpinCount, setRefreshSpinCount] = useState(0);
  const [searchInput, setSearchInput] = useState(globalFilter);
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
    updater: (
      current: TableParams & Record<string, unknown>,
    ) => Record<string, unknown>,
    options?: { replace?: boolean },
  ) => {
    if (controlledSearch || onSearchChange || searchState === "local") {
      const nextSearch = updater(
        (controlledSearch ?? localSearch ?? {}) as TableParams &
          Record<string, unknown>,
      ) as TableParams;

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
      search: (current: Record<string, unknown>) =>
        updater((current ?? {}) as TableParams & Record<string, unknown>),
    });
  };

  const table = useReactTable({
    data,
    columns,
    defaultColumn: {
      minSize: 128,
      size: 224,
      maxSize: 640,
    },
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    onColumnSizingChange: (updater) => {
      const nextColumnSizing =
        typeof updater === "function" ? updater(columnSizing) : updater;

      setColumnSizing(nextColumnSizing);
    },
    ...(reordering ? { getRowId: reordering.getRowId } : {}),
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater;
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
        typeof updater === "function"
          ? updater([...sorting] as SortingState)
          : updater;
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
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: (updater) => {
      const newGlobalFilter =
        typeof updater === "function" ? updater(globalFilter) : updater;
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
    ...(isServerMode ? { manualSorting: true } : {}),
    ...(!isServerMode ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(isServerMode ? { manualFiltering: true } : {}),
    ...(!isServerMode ? { getFilteredRowModel: getFilteredRowModel() } : {}),
    ...(paginationFeature !== false && paginationFeature.mode === "server"
      ? { manualPagination: true, rowCount: paginationFeature.rowCount }
      : paginationFeature === false
        ? {}
        : { getPaginationRowModel: getPaginationRowModel() }),
    autoResetPageIndex: false,
    onColumnVisibilityChange: (updater) => {
      const nextColumnVisibility =
        typeof updater === "function" ? updater(columnVisibility) : updater;

      setColumnVisibility(nextColumnVisibility);
    },
    onRowSelectionChange: setRowSelection,
    state: {
      sorting: sorting as SortingState,
      pagination,
      globalFilter,
      columnVisibility,
      columnSizing,
      rowSelection,
    },
  });

  useEffect(() => {
    setSearchInput(globalFilter);
  }, [globalFilter]);

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
  const filteredRows = table.getPrePaginationRowModel().rows;
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
    (canReorderRows ? 1 : 0);
  const canDragRows = activeGroupingFields.some(
    (field) => !!field.onMoveToGroup,
  );
  const hasExportableRows = exportRows.length > 0;

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

  const renderGalleryRows = (rows: Row<TData>[], canDrag: boolean) => (
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

  return (
    <div className="w-full max-w-full min-w-0 rounded-md">
      {hasToolbar ? (
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
                        <span className="hidden sm:inline">
                          {labels.groupBy}
                        </span>
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
                            toggleGroupingField(field.id, !!value)
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
                  onChange={setView}
                  value={currentView}
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
                      refreshSpinCount > 0 &&
                        "animate-[spin_500ms_ease-in-out_1]",
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
                        disabled={!hasExportableRows}
                        size="sm"
                        variant="outline"
                      >
                        <Download />
                        <span className="hidden sm:inline">
                          {labels.export}
                        </span>
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
      ) : null}
      <DndContext
        onDragCancel={() => setActiveDragLabel(null)}
        onDragEnd={({ active, over }) => {
          setActiveDragLabel(null);

          if (!over) {
            return;
          }

          const dragType = active.data.current?.type;

          if (dragType === "row-reorder" && reordering && canReorderRows) {
            const sourceRowId = String(active.id).replace(/^sortable-row:/, "");
            const targetRowId = String(over.id).replace(/^sortable-row:/, "");

            if (sourceRowId === targetRowId) {
              return;
            }

            const currentIndex = bodyRows.findIndex(
              (row) => row.id === sourceRowId,
            );
            const nextIndex = bodyRows.findIndex(
              (row) => row.id === targetRowId,
            );

            if (currentIndex === -1 || nextIndex === -1) {
              return;
            }

            const rows = bodyRows.map((row) => row.original);
            const [rowToMove] = rows.splice(currentIndex, 1);
            if (!rowToMove) return;

            rows.splice(nextIndex, 0, rowToMove);
            reordering.onReorder(rows);
            return;
          }

          if (
            dragType !== "row" ||
            over.data.current?.type !== "group-target"
          ) {
            return;
          }

          const row = active.data.current?.row as TData | undefined;
          const field = grouping?.fields.find(
            (currentField) => currentField.id === over.data.current?.fieldId,
          );
          const nextGroupId = String(over.data.current?.groupId ?? "");

          if (!row || !field?.onMoveToGroup) {
            return;
          }

          const currentGroupId = field.getGroupId(row);
          if (currentGroupId === nextGroupId) {
            return;
          }

          field.onMoveToGroup(row, nextGroupId);
        }}
        onDragStart={({ active }) => {
          const label = active.data.current?.label;
          const dragType = active.data.current?.type;
          setActiveDragLabel(
            dragType === "row" && typeof label === "string" ? label : null,
          );
        }}
        sensors={sensors}
      >
        <DataTableViewContext.Provider value={currentView}>
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
                    width: `max(100%, ${table.getTotalSize() + (canReorderRows ? 40 : 0)}px)`,
                  }}
                >
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="p-4">
                        {canReorderRows ? (
                          <TableHead className="w-10 min-w-10 p-0" />
                        ) : null}
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead
                              key={header.id}
                              className="relative h-12 min-w-32 p-0"
                              style={{ width: header.getSize() }}
                            >
                              {renderHeader(header)}
                              {header.column.getCanResize() ? (
                                <button
                                  aria-label={labels.resizeColumn(
                                    getHeaderName(header),
                                  )}
                                  className={cn(
                                    "hover:bg-primary/60 absolute inset-y-0 right-0 z-10 w-1 cursor-col-resize touch-none bg-transparent p-0 select-none",
                                    header.column.getIsResizing() &&
                                      "bg-primary",
                                  )}
                                  type="button"
                                  onDoubleClick={() =>
                                    header.column.resetSize()
                                  }
                                  onMouseDown={header.getResizeHandler()}
                                  onTouchStart={header.getResizeHandler()}
                                />
                              ) : null}
                            </TableHead>
                          );
                        })}
                        {rowActions ? (
                          <TableHead className="sticky right-0 z-20 w-0 min-w-0 p-0" />
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
        </DataTableViewContext.Provider>
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
          onValueChange={(v) => onChange(v as DataTableView)}
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

function DataTableSortDropdown<TData>({
  messages,
  table,
}: {
  messages: DataTableMessages;
  table: TanstackTable<TData>;
}) {
  const sorting = table.getState().sorting;
  const sortableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanSort());
  const columnLabels = useMemo(
    () =>
      new Map(
        table
          .getFlatHeaders()
          .map((header) => [header.column.id, getHeaderName(header)]),
      ),
    [table],
  );

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

function DataTableViewOptions<TData>({
  messages,
  table,
}: {
  messages: DataTableMessages;
  table: TanstackTable<TData>;
}) {
  const columnLabels = useMemo(
    () =>
      new Map(
        table
          .getFlatHeaders()
          .map((header) => [header.column.id, getHeaderName(header)]),
      ),
    [table],
  );
  const columns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && column.getCanHide(),
    );

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

interface DataTablePaginationProps<TData> {
  messages?: DataTableMessageOverrides;
  pageSizes?: readonly number[] | undefined;
  rowCount?: number | undefined;
  table: TanstackTable<TData>;
}

export function DataTablePagination<TData>({
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
      page={table.getState().pagination.pageIndex}
      pageCount={table.getPageCount()}
      pageSize={table.getState().pagination.pageSize}
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
            items={selectedOptions.map(({ label }) => label)}
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
  visibleCount = 3,
}: {
  emptyLabel: ReactNode;
  expandable?: boolean | undefined;
  items: readonly string[];
  overflowLabel?: ((remaining: number) => ReactNode) | undefined;
  visibleCount?: number | undefined;
}) {
  const labels = dataTableMessages();
  const visibleItems = items.slice(0, visibleCount).join(", ");
  const remaining = Math.max(items.length - visibleCount, 0);
  const remainingLabel =
    overflowLabel?.(remaining) ?? labels.listOthers(remaining);

  if (items.length === 0) {
    return <span className="text-muted-foreground text-sm">{emptyLabel}</span>;
  }

  return remaining > 0 ? (
    <span
      className="block min-w-0 text-sm whitespace-normal"
      data-slot="list-summary"
    >
      <span>{visibleItems}</span>{" "}
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
            <PopoverContent
              align="start"
              className="max-h-72 w-72 overflow-y-auto p-2"
              onClick={(event) => event.stopPropagation()}
            >
              <ul className="grid gap-1">
                {items.map((item, index) => (
                  <li
                    className="rounded-sm px-2 py-1.5 break-words"
                    key={`${item}-${index}`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        ) : (
          remainingLabel
        )}
      </span>
    </span>
  ) : (
    <span className="block min-w-0 text-sm" data-slot="list-summary">
      {visibleItems}
    </span>
  );
}

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  messages?: DataTableMessageOverrides;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
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
              className="data-[state=open]:bg-accent h-12 w-full justify-start rounded-none px-2"
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
        <DropdownMenuContent align="start">
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
