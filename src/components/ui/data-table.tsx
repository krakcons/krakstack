import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  type SortingState,
  type Table as TanstackTable,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Download,
  EyeOff,
  FileJson,
  FileText,
  GripVertical,
  LayoutGrid,
  LinkIcon,
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
import { Schema } from "effect";
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

const dataTableStorageRuntime = Atom.runtime(
  BrowserKeyValueStore.layerLocalStorage,
);

const DataTableViewSchema = Schema.Union([
  Schema.Literal("table"),
  Schema.Literal("gallery"),
]);
type DataTableView = typeof DataTableViewSchema.Type;

const ColumnVisibilitySchema = Schema.Record(Schema.String, Schema.Boolean);

export type DataTableMessages = {
  pageSize: string;
  empty: string;
  loading: string;
  filter: string;
  results: (count: number) => string;
  export: string;
  exportCsv: string;
  exportJson: string;
  refresh: string;
  selectedOf: (selected: number, total: number) => string;
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
  pageOf: (page: number, total: number) => string;
  goToFirstPage: string;
  goToPreviousPage: string;
  goToNextPage: string;
  goToLastPage: string;
};

const messages = {
  en: {
    pageSize: "Page size",
    empty: "No results.",
    loading: "Loading...",
    filter: "Filter results...",
    results: (count: number) => `${count} results`,
    export: "Export",
    exportCsv: "CSV",
    exportJson: "JSON",
    refresh: "Refresh",
    selectedOf: (selected: number, total: number) => `${selected} of ${total}`,
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
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
    goToFirstPage: "Go to first page",
    goToPreviousPage: "Go to previous page",
    goToNextPage: "Go to next page",
    goToLastPage: "Go to last page",
  },
  fr: {
    pageSize: "Taille de la page",
    empty: "Aucun résultat.",
    loading: "Chargement...",
    filter: "Filtrer les résultats...",
    results: (count: number) => `${count} résultats`,
    export: "Exporter",
    exportCsv: "CSV",
    exportJson: "JSON",
    refresh: "Rafraîchir",
    selectedOf: (selected: number, total: number) => `${selected} sur ${total}`,
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
    pageOf: (page: number, total: number) => `Page ${page} sur ${total}`,
    goToFirstPage: "Aller à la première page",
    goToPreviousPage: "Aller à la page précédente",
    goToNextPage: "Aller à la page suivante",
    goToLastPage: "Aller à la dernière page",
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
  getGroupIds?: () => string[];
  getGroupLabel?: (groupId: string, rows: TData[]) => ReactNode;
  renderEmptyGroup?: (groupId: string) => ReactNode;
  onMoveToGroup?: (row: TData, groupId: string) => void;
}

export interface DataTableGrouping<TData> {
  fields: DataTableGroupingField<TData>[];
  initial?: string[];
  getRowLabel?: (row: TData) => string;
}

interface DataTableRelationshipOption {
  label: string;
  value: string;
  href?: string;
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
  name: string;
  icon?: ReactNode;
  variant?: "default" | "destructive" | undefined;
  onClick: (data: TData) => void;
  visible?: (data: TData) => boolean;
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyLabel?: string;
  messages?: DataTableMessageOverrides;
  exportFileName?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  onRowClick?: (row: TData) => void;
  from?: ValidateFromPath;
  grouping?: DataTableGrouping<TData>;
  gallery?: DataTableGalleryConfig;
  rowActions?: DataTableRowAction<TData>[];
  reordering?: DataTableReordering<TData>;
  serverPagination?: {
    rowCount: number;
  };
  features?: {
    pagination?: boolean;
    search?: boolean;
    export?: boolean;
    columnVisibility?: boolean;
    gallery?: boolean;
    sorting?: boolean;
  };
}

type GroupSection<TData> = {
  key: string;
  groupId: string;
  depth: number;
  field: DataTableGroupingField<TData>;
  rows: Row<TData>[];
  children: GroupSection<TData>[];
};

const DEFAULT_TABLE_FEATURES = {
  pagination: true,
  search: true,
  export: true,
  columnVisibility: true,
  gallery: true,
  sorting: true,
} as const;

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
  title = "Actions",
}: {
  actions: DataTableRowAction<TData>[];
  contentClassName?: string | undefined;
  row: TData;
  title?: string | undefined;
}) => {
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
            <span className="sr-only">{title}</span>
            <MoreHorizontal />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className={cn("w-max", contentClassName)}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>{title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleActions.map((action) => (
            <DropdownMenuItem
              key={action.name}
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
    const groupId = field.getGroupId(row.original);
    const currentRows = groups.get(groupId) ?? [];
    currentRows.push(row);
    groups.set(groupId, currentRows);
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
          <div className="min-w-0 flex-1 text-left">{label}</div>
          <Badge variant="secondary" className="ml-auto">
            {section.rows.length}
          </Badge>
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

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left font-medium transition-colors",
        isOver && "outline outline-primary",
      )}
      onClick={onToggle}
      ref={setNodeRef}
      type="button"
    >
      {collapsed ? (
        <ChevronRight className="size-4" />
      ) : (
        <ChevronDown className="size-4" />
      )}
      <div className="min-w-0 flex-1">{label}</div>
      <Badge variant="secondary" className="ml-auto">
        {section.rows.length}
      </Badge>
    </button>
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
}: {
  canDrag: boolean;
  canReorder: boolean;
  dragLabel?: string | undefined;
  indentDepth?: number | undefined;
  reorderHandleLabel?: string | undefined;
  onRowClick?: ((row: TData) => void) | undefined;
  row: Row<TData>;
  rowActions?: DataTableRowAction<TData>[] | undefined;
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
              "align-center min-w-32 whitespace-normal [&:has([data-slot=relationship-cell])]:p-0 [&:has([data-slot=relationship-cell])>div]:line-clamp-none",
              rowActions &&
                isLastCell &&
                "min-w-40 pr-12 [&:has([data-slot=relationship-cell])]:pr-0 [&:has([data-slot=relationship-cell])_[data-slot=relationship-cell]]:pr-14",
            )}
            style={
              index === 0 && firstCellIndent
                ? { paddingLeft: firstCellIndent }
                : undefined
            }
          >
            <div className="line-clamp-3 break-words">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </TableCell>
        );
      })}
      {rowActions ? (
        <TableCell className="sticky right-0 z-20 w-0 min-w-0 overflow-visible p-0">
          <div className="bg-background/95 absolute top-1/2 right-2 -translate-y-1/2 rounded-md shadow-sm backdrop-blur">
            <DataTableRowActions actions={rowActions} row={row.original} />
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
  table,
}: {
  canDrag: boolean;
  dragLabel?: string | undefined;
  gallery?: DataTableGalleryConfig | undefined;
  onRowClick?: ((row: TData) => void) | undefined;
  row: Row<TData>;
  rowActions?: DataTableRowAction<TData>[] | undefined;
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
            <DataTableRowActions actions={rowActions} row={row.original} />
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
            <DataTableRowActions actions={rowActions} row={row.original} />
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
  emptyLabel,
  messages,
  exportFileName = "table.csv",
  isLoading = false,
  onRefresh,
  onRowClick,
  from,
  grouping,
  gallery,
  rowActions,
  reordering,
  serverPagination,
  features = DEFAULT_TABLE_FEATURES,
}: DataTableProps<TData, TValue>) {
  const labels = dataTableMessages(messages);
  const resolvedEmptyLabel = emptyLabel ?? labels.empty;
  const location = useRouterState({
    select: (state) => state.location,
  });
  const search = location.search as TableParams | undefined;
  const pathname = location.pathname;
  const navigate = useNavigate(from ? { from } : undefined);

  const {
    page = 0,
    pageSize = 10,
    sort,
    globalFilter = "",
    grouping: urlGrouping,
  } = search ?? {};
  const pagination = { pageIndex: page, pageSize };
  const decodedSort = sort ? Schema.decodeSync(SortParamsFromString)(sort) : [];
  const sorting: SortingState = decodedSort.map((sortParam) => ({
    id: sortParam.id,
    desc: sortParam.direction === "desc",
  }));
  const {
    pagination: showPagination,
    search: showSearch,
    export: showExport,
    columnVisibility: showColumnVisibility,
    gallery: showGallery,
    sorting: showSorting,
  } = {
    ...DEFAULT_TABLE_FEATURES,
    ...features,
  };
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

    return `${pathname}:${exportFileName}:${columnIds}`;
  }, [columns, exportFileName, pathname]);
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
  const [storedView, setStoredView] = useAtom(viewAtom);
  const currentView: DataTableView = showGallery ? storedView : "table";
  const isGalleryView = currentView === "gallery";
  const emptyStateLabel = isLoading ? labels.loading : resolvedEmptyLabel;
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
    ...(serverPagination
      ? { manualFiltering: true, manualSorting: true }
      : {
          getFilteredRowModel: getFilteredRowModel(),
          getSortedRowModel: getSortedRowModel(),
        }),
    ...(serverPagination
      ? { manualPagination: true, rowCount: serverPagination.rowCount }
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
  const exportRows = table.getPrePaginationRowModel().rows;
  const bodyRows = hasActiveGrouping ? exportRows : table.getRowModel().rows;
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

  const renderTableEmptyState = () => (
    <TableRow>
      <TableCell className="h-24 text-center" colSpan={colSpan}>
        {isLoading ? renderLoadingState() : emptyStateLabel}
      </TableCell>
    </TableRow>
  );

  const renderGalleryEmptyState = (message: ReactNode = emptyStateLabel) => (
    <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-10 text-center text-sm">
      {isLoading ? renderLoadingState() : message}
    </div>
  );

  const renderGalleryRows = (rows: Row<TData>[], canDrag: boolean) => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <DataTableGalleryCard
          canDrag={canDrag}
          dragLabel={grouping?.getRowLabel?.(row.original)}
          gallery={gallery}
          key={row.id}
          onRowClick={onRowClick}
          row={row}
          rowActions={rowActions}
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
                          exportTableToCsv(table, exportRows, exportFileName)
                        }
                      >
                        <FileText />
                        {labels.exportCsv}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          exportTableToJson(table, exportRows, exportFileName)
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
                <Table className="min-w-full">
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
                              className="h-12 min-w-32 p-0"
                            >
                              {renderHeader(header)}
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
            rowCount={serverPagination?.rowCount}
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
  rowCount?: number | undefined;
  table: TanstackTable<TData>;
}

interface DataTableRelationshipCellProps {
  emptyLabel: string;
  manageLabel: string;
  options: DataTableRelationshipOption[];
  value: DataTableRelationshipOption[];
  onAdd?: (id: string) => void;
  onRemove?: (id: string) => void;
  from: ValidateFromPath;
}

export function DataTablePagination<TData>({
  messages,
  rowCount,
  table,
}: DataTablePaginationProps<TData>) {
  const labels = dataTableMessages(messages);
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const totalRows = rowCount ?? filteredRows;

  return (
    <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span>{labels.results(totalRows)}</span>
        {selectedRows > 0 ? (
          <span>{labels.selectedOf(selectedRows, totalRows)}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-4 sm:justify-end">
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size" className="hidden text-sm sm:block">
            {labels.pageSize}
          </Label>
          <Select
            items={[10, 20, 30, 40, 50].map((pageSize) => ({
              label: pageSize.toString(),
              value: pageSize.toString(),
            }))}
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]" id="page-size">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center text-sm font-medium sm:block">
            {labels.pageOf(
              table.getState().pagination.pageIndex + 1,
              table.getPageCount(),
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{labels.goToFirstPage}</span>
              <ChevronsLeft />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{labels.goToPreviousPage}</span>
              <ChevronLeft />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{labels.goToNextPage}</span>
              <ChevronRight />
            </Button>
            <Button
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{labels.goToLastPage}</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DataTableRelationshipCell({
  emptyLabel,
  manageLabel,
  options,
  value,
  onAdd,
  onRemove,
  from,
}: DataTableRelationshipCellProps) {
  const selectedValues = new Set(value.map((option) => option.value));
  const navigate = useNavigate({
    from,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(event) => event.stopPropagation()}
        render={
          <Button
            aria-label={manageLabel}
            data-slot="relationship-cell"
            className="min-h-16 w-full justify-between gap-3 rounded-none px-2 py-2 text-left font-normal"
            type="button"
            variant="ghost"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {value.length > 0 ? (
                value.map((option) => (
                  <Badge
                    key={option.value}
                    variant="outline"
                    onClick={(event) => {
                      if (!option.href) return;

                      event.preventDefault();
                      event.stopPropagation();
                      navigate({ to: option.href });
                    }}
                    onPointerDown={(event) => {
                      if (!option.href) return;

                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    className="max-w-48 cursor-pointer"
                  >
                    {option.href && <LinkIcon className="size-3.5 min-w-3.5" />}
                    <span className="justify-start truncate">
                      {option.label}
                    </span>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">
                  {emptyLabel}
                </span>
              )}
            </div>
            <ChevronDown className="text-muted-foreground size-4 shrink-0" />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="w-[220px]"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>{manageLabel}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.length > 0 ? (
            options.map((option) => {
              const checked = selectedValues.has(option.value);

              return (
                <DropdownMenuCheckboxItem
                  checked={checked}
                  key={option.value}
                  onCheckedChange={(nextChecked) => {
                    if (nextChecked) {
                      onAdd?.(option.value);
                      return;
                    }

                    onRemove?.(option.value);
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              );
            })
          ) : (
            <DropdownMenuItem disabled>{emptyLabel}</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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
      <div className={cn("flex h-12 items-center px-2 text-sm", className)}>
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
