import { m } from "@/paraglide/messages";
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
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useNavigate, useSearch, type ValidateFromPath } from "@tanstack/react-router";
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
  type Table as TanstackTable,
  useReactTable,
  type VisibilityState,
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
  LayoutGrid,
  LinkIcon,
  MoreHorizontal,
  Rows3,
  Search,
  Settings2,
} from "lucide-react";
import {
  Fragment,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  createContext,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DataTableViewContext = createContext<DataTableView>("table");

export const TableSearchSchema = z.object({
  globalFilter: z.string().optional(),
  pagination: z
    .object({
      pageIndex: z.number().default(0),
      pageSize: z.number().default(10),
    })
    .optional(),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).optional(),
  grouping: z.array(z.string()).optional(),
  view: z.enum(["table", "gallery"]).optional(),
});
export type TableParams = z.infer<typeof TableSearchSchema>;

type DataTableView = "table" | "gallery";

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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  exportFileName?: string;
  onRowClick?: (row: TData) => void;
  from: ValidateFromPath;
  grouping?: DataTableGrouping<TData>;
  gallery?: DataTableGalleryConfig;
  features?: {
    pagination?: boolean;
    search?: boolean;
    export?: boolean;
    columnVisibility?: boolean;
    gallery?: boolean;
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
} as const;

const GROUP_INDENT_PX = 20;

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
    const key = parentKey ? `${parentKey}::${field.id}:${groupId}` : `${field.id}:${groupId}`;

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
    <TableRow>
      <TableCell
        className={cn(
          "py-2 font-medium transition-colors cursor-pointer",
          isOver && "outline outline-1 outline-primary",
        )}
        colSpan={colSpan}
        ref={setNodeRef}
        onClick={onToggle}
      >
        <div
          className="flex items-center gap-3"
          style={{ paddingLeft: `${section.depth * GROUP_INDENT_PX}px` }}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
          <div className="min-w-0 flex-1 text-left">{label}</div>
          <span className="ml-auto text-muted-foreground text-sm">{section.rows.length}</span>
        </div>
      </TableCell>
    </TableRow>
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
      {collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
      <div className="min-w-0 flex-1">{label}</div>
      <span className="text-muted-foreground text-sm">{section.rows.length}</span>
    </button>
  );
};

const DataTableRow = <TData,>({
  canDrag,
  dragLabel,
  onRowClick,
  row,
}: {
  canDrag: boolean;
  dragLabel?: string;
  onRowClick?: (row: TData) => void;
  row: Row<TData>;
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

  return (
    <TableRow
      className={cn("h-16", onRowClick && "cursor-pointer", isDragging && "opacity-50")}
      data-state={row.getIsSelected() && "selected"}
      key={row.id}
      onClick={() => {
        if (onRowClick) {
          onRowClick(row.original);
        }
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="min-w-32 align-center whitespace-normal break-words">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
};

const DataTableGalleryCard = <TData,>({
  canDrag,
  dragLabel,
  gallery,
  onRowClick,
  row,
  table,
}: {
  canDrag: boolean;
  dragLabel?: string;
  gallery?: DataTableGalleryConfig;
  onRowClick?: (row: TData) => void;
  row: Row<TData>;
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
    ? row.getVisibleCells().find((cell) => cell.column.id === gallery.description)
    : null;
  const tagCell = gallery?.tag
    ? row.getVisibleCells().find((cell) => cell.column.id === gallery.tag)
    : null;
  const actionCell = row.getVisibleCells().find((cell) => cell.column.id === "actions");

  if (gallery) {
    const tagValue = tagCell
      ? flexRender(tagCell.column.columnDef.cell, tagCell.getContext())
      : null;

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
        <CardHeader>
          {actionCell || tagCell ? (
            <CardAction onClick={(event) => event.stopPropagation()}>
              {actionCell
                ? flexRender(actionCell.column.columnDef.cell, actionCell.getContext())
                : null}
              {tagCell ? (
                <Badge variant="secondary" className="gap-1">
                  {gallery.tagIcon}
                  {tagValue}
                </Badge>
              ) : null}
            </CardAction>
          ) : null}
          {nameCell ? (
            <CardTitle className="text-base min-w-0">
              {flexRender(nameCell.column.columnDef.cell, nameCell.getContext())}
            </CardTitle>
          ) : null}
          {descriptionCell ? (
            <CardDescription className="min-w-0 line-clamp-2">
              {flexRender(descriptionCell.column.columnDef.cell, descriptionCell.getContext())}
            </CardDescription>
          ) : null}
        </CardHeader>
      </Card>
    );
  }

  const contentCells = row.getVisibleCells().filter((cell) => cell.column.id !== "actions");

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
        {actionCell ? (
          <CardAction onClick={(event) => event.stopPropagation()}>
            {flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
          </CardAction>
        ) : null}
        {contentCells.length > 0 && (
          <div className="grid min-w-0 gap-3">
            <CardDescription className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {getColumnDisplayName(table, contentCells[0].column.id)}
            </CardDescription>
            <CardTitle className="text-base">
              {flexRender(contentCells[0].column.columnDef.cell, contentCells[0].getContext())}
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

const getColumnDisplayName = <TData,>(table: TanstackTable<TData>, columnId: string) => {
  const header = table
    .getFlatHeaders()
    .find((currentHeader) => currentHeader.column.id === columnId);
  return header ? getHeaderName(header) : columnId;
};

const escapeCsvValue = (value: string) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const getCsvBlob = <TData,>(table: TanstackTable<TData>, rows: Row<TData>[]): Blob => {
  const exportableColumns = table
    .getVisibleLeafColumns()
    .filter((column) => column.id !== "actions");
  const headerNames = exportableColumns.map((column) => getColumnDisplayName(table, column.id));
  const data = rows.map((row) =>
    exportableColumns.map((column) => {
      const value = row.getValue(column.id);
      return value === null || value === undefined ? "" : String(value);
    }),
  );

  const csvContent = [headerNames, ...data]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
};

const exportToCsv = <TData,>(
  table: TanstackTable<TData>,
  rows: Row<TData>[],
  fileName = "data.csv",
): void => {
  const blob = getCsvBlob(table, rows);
  const link = document.createElement("a");
  const url = window.URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  requestAnimationFrame(() => window.URL.revokeObjectURL(url));
};

export function DataTable<TData, TValue>({
  columns,
  data,
  exportFileName = "table.csv",
  onRowClick,
  from,
  grouping,
  gallery,
  features = DEFAULT_TABLE_FEATURES,
}: DataTableProps<TData, TValue>) {
  const search = useSearch({
    // @ts-ignore
    from,
  }) as TableParams;
  const navigate = useNavigate({
    from,
  });

  const {
    pagination = { pageIndex: 0, pageSize: 10 },
    sorting = [],
    globalFilter = "",
    grouping: urlGrouping,
    view = "table",
  } = search ?? {};
  const {
    pagination: showPagination,
    search: showSearch,
    export: showExport,
    columnVisibility: showColumnVisibility,
    gallery: showGallery,
  } = {
    ...DEFAULT_TABLE_FEATURES,
    ...features,
  };
  const currentView: DataTableView = showGallery ? view : "table";
  const isGalleryView = currentView === "gallery";

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(globalFilter);
  const deferredSearchInput = useDeferredValue(searchInput);
  const availableGroupFieldIds = grouping?.fields.map((field) => field.id) ?? [];
  const activeGrouping =
    urlGrouping?.filter((groupId) => availableGroupFieldIds.includes(groupId)) ??
    getDefaultGrouping(grouping);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const updateTableSearch = (
    updater: (current: TableParams & Record<string, unknown>) => Record<string, unknown>,
  ) => {
    navigate({
      to: ".",
      // @ts-ignore
      search: (current) => updater((current ?? {}) as TableParams & Record<string, unknown>),
    });
  };

  const table = useReactTable({
    data,
    columns,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === "function" ? updater(pagination) : updater;
      if (
        pagination.pageIndex === newPagination.pageIndex &&
        pagination.pageSize === newPagination.pageSize
      ) {
        return;
      }
      updateTableSearch((current) => ({
        ...current,
        pagination: newPagination,
      }));
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === "function" ? updater(sorting) : updater;
      if (
        sorting.length === newSorting.length &&
        sorting.every(
          (sortState, i) =>
            sortState.id === newSorting[i]?.id && sortState.desc === newSorting[i]?.desc,
        )
      ) {
        return;
      }
      updateTableSearch((current) => ({
        ...current,
        sorting: newSorting,
        pagination: {
          ...pagination,
          pageIndex: 0,
        },
      }));
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: (updater) => {
      const newGlobalFilter = typeof updater === "function" ? updater(globalFilter) : updater;
      if (globalFilter === newGlobalFilter) {
        return;
      }
      updateTableSearch((current) => ({
        ...current,
        pagination: {
          ...pagination,
          pageIndex: 0,
        },
        globalFilter: newGlobalFilter,
      }));
    },
    getFilteredRowModel: getFilteredRowModel(),
    autoResetPageIndex: false,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      pagination,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
  });

  useEffect(() => {
    setSearchInput(globalFilter);
  }, [globalFilter]);

  useEffect(() => {
    if (deferredSearchInput === globalFilter) {
      return;
    }

    table.setGlobalFilter(deferredSearchInput);
  }, [deferredSearchInput, globalFilter, table]);

  const activeGroupingFields = useMemo(
    () =>
      activeGrouping
        .map((groupId) => grouping?.fields.find((field) => field.id === groupId))
        .filter((field): field is DataTableGroupingField<TData> => !!field),
    [activeGrouping, grouping],
  );
  const hasActiveGrouping = activeGroupingFields.length > 0;
  const exportRows = table.getPrePaginationRowModel().rows;
  const bodyRows = hasActiveGrouping ? exportRows : table.getRowModel().rows;
  const groupedSections = useMemo(
    () => buildGroupedSections(bodyRows, activeGroupingFields),
    [activeGroupingFields, bodyRows],
  );
  const colSpan = Math.max(table.getVisibleLeafColumns().length, 1);
  const canDragRows = activeGroupingFields.some((field) => !!field.onMoveToGroup);
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

    updateTableSearch((current) => ({
      ...current,
      view: nextView,
    }));
  };

  const renderTableEmptyState = () => (
    <TableRow>
      <TableCell className="h-24 text-center" colSpan={colSpan}>
        {m.table_empty()}
      </TableCell>
    </TableRow>
  );

  const renderGalleryEmptyState = (message: ReactNode = m.table_empty()) => (
    <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-10 text-center text-sm">
      {message}
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
          table={table}
        />
      ))}
    </div>
  );

  const renderGroupedTableSections = (sections: GroupSection<TData>[]): ReactNode =>
    sections.map((section) => {
      const isCollapsed = collapsedGroups[section.key] ?? false;
      const hasChildren = section.children.length > 0;

      return (
        <Fragment key={section.key}>
          <GroupHeaderRow
            collapsed={isCollapsed}
            colSpan={colSpan}
            onToggle={() => toggleGroup(section.key)}
            section={section}
          />
          {!isCollapsed &&
            (hasChildren ? (
              renderGroupedTableSections(section.children)
            ) : section.rows.length > 0 ? (
              section.rows.map((row) => (
                <DataTableRow
                  canDrag={canDragRows}
                  dragLabel={grouping?.getRowLabel?.(row.original)}
                  key={row.id}
                  onRowClick={onRowClick}
                  row={row}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-16 text-muted-foreground"
                  colSpan={colSpan}
                  style={{ paddingLeft: `${(section.depth + 1) * GROUP_INDENT_PX + 16}px` }}
                >
                  {section.field.renderEmptyGroup?.(section.groupId) ?? m.table_empty()}
                </TableCell>
              </TableRow>
            ))}
        </Fragment>
      );
    });

  const renderGroupedGallerySections = (sections: GroupSection<TData>[]): ReactNode =>
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
                    section.field.renderEmptyGroup?.(section.groupId) ?? m.table_empty(),
                  ))}
        </div>
      );
    });

  return (
    <div className="w-[calc(100vw-32px)] rounded-md sm:w-full">
      <div className="flex flex-col gap-3 pb-4">
        <div className="flex flex-col gap-2 sm:flex-wrap sm:flex-row sm:items-center sm:justify-between">
          {showSearch ? (
            <div className="relative flex-1 min-w-sm">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                className="pl-9"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={m.table_filter()}
                value={searchInput}
              />
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2 overflow-x-auto">
            {grouping?.fields.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button className="h-8" size="sm" variant="outline">
                      <Rows3 />
                      <span className="hidden sm:inline">{m.table_group_by()}</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{m.table_group_by()}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {grouping.fields.map((field) => (
                      <DropdownMenuCheckboxItem
                        checked={activeGrouping.includes(field.id)}
                        key={field.id}
                        onCheckedChange={(value) => toggleGroupingField(field.id, !!value)}
                      >
                        {field.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <DataTableSortDropdown table={table} />
            {showGallery ? (
              <DataTableDisplayModeSwitch onChange={setView} value={currentView} />
            ) : null}
            {showColumnVisibility ? <DataTableViewOptions table={table} /> : null}
            {showExport ? (
              <Button
                disabled={!hasExportableRows}
                onClick={() => exportToCsv(table, exportRows, exportFileName)}
                size="sm"
                variant="outline"
              >
                <Download size={18} />
                <span className="hidden sm:inline">{m.table_export()}</span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <DndContext
        onDragCancel={() => setActiveDragLabel(null)}
        onDragEnd={({ active, over }) => {
          setActiveDragLabel(null);

          if (!over) {
            return;
          }

          const dragType = active.data.current?.type;

          if (dragType !== "row" || over.data.current?.type !== "group-target") {
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
          setActiveDragLabel(typeof label === "string" ? label : null);
        }}
        sensors={sensors}
      >
        <DataTableViewContext.Provider value={currentView}>
          {isGalleryView ? (
            hasActiveGrouping ? (
              groupedSections.length > 0 ? (
                <div className="space-y-4">{renderGroupedGallerySections(groupedSections)}</div>
              ) : (
                renderGalleryEmptyState()
              )
            ) : bodyRows.length > 0 ? (
              renderGalleryRows(bodyRows, false)
            ) : (
              renderGalleryEmptyState()
            )
          ) : (
            <ScrollArea>
              <Table className="min-w-full">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="p-4">
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} className="h-12 min-w-32">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="px-2">
                  {hasActiveGrouping
                    ? groupedSections.length > 0
                      ? renderGroupedTableSections(groupedSections)
                      : renderTableEmptyState()
                    : bodyRows.length > 0
                      ? bodyRows.map((row) => (
                          <DataTableRow
                            canDrag={false}
                            key={row.id}
                            onRowClick={onRowClick}
                            row={row}
                          />
                        ))
                      : renderTableEmptyState()}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
          <DragOverlay>
            {activeDragLabel ? (
              <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
                {activeDragLabel}
              </div>
            ) : null}
          </DragOverlay>
        </DataTableViewContext.Provider>
      </DndContext>
      {showPagination && !hasActiveGrouping && (
        <div className="p-2">
          <DataTablePagination table={table} />
        </div>
      )}
    </div>
  );
}

function DataTableDisplayModeSwitch({
  value,
  onChange,
}: {
  value: DataTableView;
  onChange: (value: DataTableView) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className="h-8" size="sm" variant="outline" />}>
        <Rows3 />
        {m.table_view()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as DataTableView)}>
          <DropdownMenuRadioItem value="table">
            <Rows3 />
            {m.table_table_view()}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="gallery">
            <LayoutGrid />
            {m.table_gallery_view()}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DataTableSortDropdown<TData>({ table }: { table: TanstackTable<TData> }) {
  const sorting = table.getState().sorting;
  const sortableColumns = table.getAllColumns().filter((column) => column.getCanSort());
  const columnLabels = useMemo(
    () =>
      new Map(table.getFlatHeaders().map((header) => [header.column.id, getHeaderName(header)])),
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
          <Button className="h-8" size="sm" variant="outline">
            {activeSortColumn ? (
              activeSortColumn.desc ? (
                <ArrowDown className="size-4" />
              ) : (
                <ArrowUp className="size-4" />
              )
            ) : (
              <ChevronsUpDown className="size-4" />
            )}
            <span className="hidden sm:inline">{m.table_sort_by()}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{m.table_sort_by()}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sortableColumns.map((column) => {
            const sortState = sorting.find((s) => s.id === column.id);
            const label = columnLabels.get(column.id) ?? column.id;

            return (
              <DropdownMenuSub key={column.id}>
                <DropdownMenuSubTrigger inset={!!sortState}>
                  {sortState ? (
                    <span className="pointer-events-none absolute left-3 flex size-4 items-center justify-center">
                      {sortState.desc ? (
                        <ArrowDown className="size-4" />
                      ) : (
                        <ArrowUp className="size-4" />
                      )}
                    </span>
                  ) : null}
                  {label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                    <ArrowUp className="size-4" />
                    {m.table_sort_asc()}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                    <ArrowDown className="size-4" />
                    {m.table_sort_desc()}
                  </DropdownMenuItem>
                  {sortState && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => column.clearSorting()}>
                        {m.table_sort_clear()}
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

function DataTableViewOptions<TData>({ table }: { table: TanstackTable<TData> }) {
  const columnLabels = useMemo(
    () =>
      new Map(table.getFlatHeaders().map((header) => [header.column.id, getHeaderName(header)])),
    [table],
  );
  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide());

  if (columns.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button className="h-8" size="sm" variant="outline">
            <Settings2 />
            <span className="hidden sm:inline">{m.table_columns()}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{m.table_columns()}</DropdownMenuLabel>
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

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground text-sm">
        {selectedRows > 0
          ? m.table_selected_of({
              selected: selectedRows,
              total: table.getFilteredRowModel().rows.length,
            })
          : ""}
      </div>
      <div className="flex items-center gap-4 sm:justify-end">
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size" className="text-sm sm:block hidden">
            {m.table_page_size()}
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
            {m.table_page_of({
              page: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            })}
          </div>
          <div className="flex items-center gap-1">
            <Button
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{m.table_go_to_first_page()}</span>
              <ChevronsLeft />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{m.table_go_to_previous_page()}</span>
              <ChevronLeft />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{m.table_go_to_next_page()}</span>
              <ChevronRight />
            </Button>
            <Button
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{m.table_go_to_last_page()}</span>
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
    <div className="flex flex-col gap-2" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center flex-wrap gap-2">
        {value.length > 0 ? (
          value.map((option) => (
            <Badge
              variant="outline"
              onClick={() => option.href && navigate({ to: option.href })}
              className="max-w-48"
            >
              {option.href && <LinkIcon className="size-3.5 min-w-3.5" />}
              <span className="truncate justify-start">{option.label}</span>
            </Badge>
          ))
        ) : (
          <span className="text-muted-foreground text-sm">{emptyLabel}</span>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button className="h-8 w-min" size="sm" variant="outline">
              {manageLabel}
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
            {options.map((option) => {
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
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface DataTableColumnHeaderProps<TData, TValue> extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
              <span className="text-sm">{title}</span>
              {column.getIsSorted() === "desc" ? (
                <ArrowDown />
              ) : column.getIsSorted() === "asc" ? (
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
              <ArrowUp className="h-3.5 w-3.5 text-muted-foreground/70" />
              {m.table_sort_asc()}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/70" />
              {m.table_sort_desc()}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground/70" />
              {m.table_sort_hide()}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const createDataTableActionsColumn = <TData extends object>(
  actions: {
    name: string;
    icon?: ReactNode;
    variant?: "default" | "destructive";
    onClick: (data: TData) => void;
    visible?: (data: TData) => boolean;
  }[],
  options?: {
    title?: string;
  },
) => {
  const title = options?.title ?? "Actions";

  return {
    id: "actions",
    enableHiding: false,
    header: ({ column }: any) => <DataTableColumnHeader title={title} column={column} />,
    cell: ({ cell }: any) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(event) => event.stopPropagation()}
          render={
            <Button variant="ghost" size="icon">
              <span className="sr-only">{title}</span>
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {actions.map(
              (action) =>
                (!action.visible || action.visible(cell.row.original)) && (
                  <DropdownMenuItem
                    key={action.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(cell.row.original);
                    }}
                    variant={action.variant}
                  >
                    {action.icon}
                    {action.name}
                  </DropdownMenuItem>
                ),
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  };
};
