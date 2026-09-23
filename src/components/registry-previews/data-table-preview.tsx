import {
  DataTable,
  type DataTableColDef,
  type DataTableRowAction,
  type DataTableListOption,
} from "@krak-stack/registry/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Archive,
  Ban,
  CircleDot,
  ExternalLink,
  LogIn,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import * as m from "@/paraglide/messages";

type Project = {
  id: string;
  name: string;
  summary: string;
  status: "Backlog" | "In Progress" | "Review" | "Shipped";
  owner: string;
  category: "Product" | "Growth" | "Platform";
  score: number;
  updated: string;
};

const projects: Project[] = [
  {
    id: "ks-101",
    name: "Signup funnel",
    summary:
      "Capture qualified leads with plan preference and attribution metadata.",
    status: "In Progress",
    owner: "Ada",
    category: "Growth",
    score: 86,
    updated: "2026-04-21",
  },
  {
    id: "ks-102",
    name: "Asset registry",
    summary: "Track generated UI assets, ownership, and release readiness.",
    status: "Review",
    owner: "Grace",
    category: "Platform",
    score: 91,
    updated: "2026-04-19",
  },
  {
    id: "ks-103",
    name: "Billing dashboard",
    summary:
      "Expose invoice state, payment health, and renewal risk to operators.",
    status: "Backlog",
    owner: "Linus",
    category: "Product",
    score: 73,
    updated: "2026-04-14",
  },
  {
    id: "ks-104",
    name: "Localization review",
    summary: "Review generated copy for English and French component docs.",
    status: "Shipped",
    owner: "Hedy",
    category: "Product",
    score: 95,
    updated: "2026-04-09",
  },
  {
    id: "ks-105",
    name: "Export pipeline",
    summary: "Download filtered table state as CSV for handoff workflows.",
    status: "In Progress",
    owner: "Grace",
    category: "Platform",
    score: 82,
    updated: "2026-04-08",
  },
  {
    id: "ks-106",
    name: "Documentation IA",
    summary:
      "Organize component pages around examples, API notes, and registry usage.",
    status: "Review",
    owner: "Ada",
    category: "Product",
    score: 88,
    updated: "2026-04-03",
  },
  {
    id: "ks-107",
    name: "Lifecycle emails",
    summary:
      "Send high-signal lifecycle emails based on onboarding milestones.",
    status: "Backlog",
    owner: "Hedy",
    category: "Growth",
    score: 69,
    updated: "2026-03-28",
  },
  {
    id: "ks-108",
    name: "Release notes",
    summary: "Publish concise release notes from merged component changes.",
    status: "Shipped",
    owner: "Linus",
    category: "Platform",
    score: 79,
    updated: "2026-03-24",
  },
];

const projectColumns = (): DataTableColDef<Project>[] => [
  {
    field: "name",
    headerName: "Project",
    cellRenderer: ({ data }) => (
      <div className="grid gap-1">
        <span className="font-medium">{data.name}</span>
        <span className="text-muted-foreground text-xs">{data.id}</span>
      </div>
    ),
  },
  {
    field: "summary",
    headerName: "Summary",
    cellRenderer: ({ data }) => (
      <span className="text-muted-foreground max-w-[24rem]">
        {data.summary}
      </span>
    ),
  },
  {
    field: "status",
    headerName: "Status",
    cellRenderer: ({ data }) => (
      <Badge
        className="gap-1"
        variant={data.status === "Shipped" ? "default" : "secondary"}
      >
        <CircleDot className="size-3" />
        {data.status}
      </Badge>
    ),
  },
  {
    field: "owner",
    headerName: "Owner",
    type: "list",
    typeOptions: {
      emptyLabel: "—",
      display: "icon",
      getItems: (project) => [{ value: project.owner, label: project.owner }],
    },
  },
  {
    field: "category",
    headerName: "Category",
  },
  {
    field: "score",
    headerName: "Score",
    type: "number",
  },
  {
    colId: "shipped",
    headerName: m.data_table_preview_shipped(),
    valueGetter: ({ data }) => data.status === "Shipped",
    type: "boolean",
  },
  {
    field: "updated",
    headerName: "Updated",
    type: "date",
    typeOptions: { dateStyle: "medium" },
  },
  {
    colId: "updatedAt",
    headerName: m.data_table_preview_updated_at(),
    valueGetter: ({ data }) => `${data.updated}T14:30:00Z`,
    type: "dateTime",
    typeOptions: { timeZone: "UTC", hour12: false },
  },
];

const rowActions: DataTableRowAction<Project>[] = [
  {
    name: "Open",
    icon: <ExternalLink />,
    onClick: (project) => window.alert(`Open ${project.name}`),
  },
  {
    name: "Edit",
    icon: <Pencil />,
    onClick: (project) => window.alert(`Edit ${project.name}`),
  },
  {
    name: "Archive",
    icon: <Archive />,
    variant: "destructive",
    visible: (project) => project.status !== "Shipped",
    onClick: (project) => window.alert(`Archive ${project.name}`),
  },
];

const exampleMembers: DataTableListOption[] = [
  { value: "ada", label: "Ada" },
  { value: "grace", label: "Grace" },
  { value: "hedy", label: "Hedy" },
  { value: "linus", label: "Linus" },
];

type ColumnTypeExample = {
  id: string;
  number: number | null;
  boolean: boolean | null;
  date: string | null;
  dateTime: string | null;
  list: readonly DataTableListOption[];
  members: readonly DataTableListOption[];
};

const columnTypeExamples: ColumnTypeExample[] = [
  {
    id: "example-1",
    number: 1234.5,
    boolean: true,
    date: "2026-01-02",
    dateTime: "2026-01-02T09:15:00Z",
    list: exampleMembers,
    members: exampleMembers.slice(0, 1),
  },
  {
    id: "example-2",
    number: 0,
    boolean: false,
    date: "2026-09-23",
    dateTime: "2026-09-23T10:30:00-04:00",
    list: exampleMembers.slice(1, 2),
    members: exampleMembers.slice(1, 3),
  },
  {
    id: "example-3",
    number: null,
    boolean: null,
    date: null,
    dateTime: null,
    list: [],
    members: [],
  },
];

export function DataTablePreview() {
  const columns = projectColumns();
  const [previewProjects, setPreviewProjects] = useState(projects);
  const [typeExamples, setTypeExamples] = useState(columnTypeExamples);
  const [memberAction, setMemberAction] = useState<{
    action: string;
    name: string;
    row: string;
  } | null>(null);
  const typeColumns: DataTableColDef<ColumnTypeExample>[] = [
    {
      field: "number",
      headerName: "number",
      type: "number",
      typeOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    },
    {
      field: "boolean",
      headerName: "boolean",
      type: "boolean",
      typeOptions: {
        trueLabel: m.data_table_preview_true(),
        falseLabel: m.data_table_preview_false(),
        getAriaLabel: (row) =>
          m.data_table_preview_toggle_boolean({ row: row.id }),
        onChange: ({ value, row }) =>
          setTypeExamples((current) =>
            current.map((example) =>
              example.id === row.id ? { ...example, boolean: value } : example,
            ),
          ),
      },
    },
    { field: "date", headerName: "date", type: "date" },
    {
      field: "dateTime",
      headerName: "dateTime",
      type: "dateTime",
      width: 260,
      typeOptions: { timeZone: "UTC", hour12: false },
    },
    {
      field: "list",
      headerName: m.data_table_preview_list_icons(),
      type: "list",
      typeOptions: {
        actionsLabel: m.data_table_preview_member_actions(),
        emptyLabel: m.data_table_preview_no_items(),
        display: "icon",
        getItems: (row) => row.list,
        itemActions: [
          {
            name: m.data_table_preview_impersonate(),
            icon: <LogIn />,
            onClick: ({ item, row }) =>
              setMemberAction({
                action: m.data_table_preview_impersonate(),
                name: item.label,
                row: row.id,
              }),
          },
          {
            name: m.data_table_preview_ban(),
            icon: <Ban />,
            variant: "destructive",
            onClick: ({ item, row }) =>
              setMemberAction({
                action: m.data_table_preview_ban(),
                name: item.label,
                row: row.id,
              }),
          },
        ],
      },
    },
    {
      field: "members",
      headerName: m.data_table_preview_list_editable(),
      type: "list",
      width: 280,
      typeOptions: {
        emptyLabel: m.data_table_preview_no_items(),
        display: "list",
        manageLabel: m.data_table_preview_manage_members(),
        getItems: (row) => row.members,
        getOptions: () => exampleMembers,
        onAdd: ({ value, row }) => {
          const member = exampleMembers.find((item) => item.value === value);
          if (!member) return;
          setTypeExamples((current) =>
            current.map((example) =>
              example.id === row.id &&
              !example.members.some((item) => item.value === value)
                ? {
                    ...example,
                    members: [...example.members, member],
                  }
                : example,
            ),
          );
        },
        onRemove: ({ value, row }) =>
          setTypeExamples((current) =>
            current.map((example) =>
              example.id === row.id
                ? {
                    ...example,
                    members: example.members.filter(
                      (item) => item.value !== value,
                    ),
                  }
                : example,
            ),
          ),
      },
    },
  ];
  return (
    <div className="grid gap-6">
      <Card className="max-w-full min-w-0 overflow-hidden bg-[var(--surface-strong)]">
        <CardHeader>
          <CardTitle>{m.data_table_preview_kitchen_sink()}</CardTitle>
          <CardDescription>
            {m.data_table_preview_kitchen_sink_description()}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-full min-w-0">
          <DataTable
            columnDefs={columns}
            getRowId={(project) => project.id}
            rowData={previewProjects}
            features={{
              reordering: {
                getRowLabel: (project) => project.name,
                onReorder: setPreviewProjects,
              },
              export: { baseName: "projects", scope: "filteredRows" },
              gallery: {
                name: "name",
                description: "summary",
                tag: "status",
              },
              rowActions: { items: rowActions },
              selection: {
                bulkActions: {
                  label: "Actions",
                  items: [
                    {
                      name: "Archive",
                      icon: <Archive />,
                      variant: "destructive",
                      visible: (selectedProjects) =>
                        selectedProjects.some(
                          (project) => project.status !== "Shipped",
                        ),
                      onClick: (selectedProjects) =>
                        window.alert(
                          `Archive ${selectedProjects.length} projects`,
                        ),
                    },
                  ],
                },
              },
              grouping: {
                initial: ["status"],
                getRowLabel: (project) => project.name,
                fields: [
                  {
                    id: "status",
                    label: "Status",
                    getGroupId: (project) => project.status,
                    getGroupIds: () => [
                      "Backlog",
                      "In Progress",
                      "Review",
                      "Shipped",
                    ],
                    renderGroupLabel: (status) => status,
                    renderEmptyGroup: (status) =>
                      `No projects are currently ${status.toLowerCase()}.`,
                    onMoveToGroup: (project, status) =>
                      window.alert(`Move ${project.name} to ${status}`),
                  },
                  {
                    id: "owner",
                    label: "Owner",
                    getGroupId: (project) => project.owner,
                    getGroupIds: () => ["Ada", "Grace", "Hedy", "Linus"],
                    renderGroupLabel: (owner) => owner,
                  },
                ],
              },
            }}
            onRowClicked={(project) => window.alert(`Selected ${project.name}`)}
          />
        </CardContent>
      </Card>
      <Card className="max-w-full min-w-0 overflow-hidden bg-[var(--surface-strong)]">
        <CardHeader>
          <CardTitle>{m.data_table_preview_column_types()}</CardTitle>
          <CardDescription>
            {m.data_table_preview_column_types_description()}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-full min-w-0">
          <DataTable
            columnDefs={typeColumns}
            features={{
              pagination: false,
              export: { baseName: "column-types" },
            }}
            getRowId={(row) => row.id}
            rowData={typeExamples}
          />
          <p role="status" className="text-muted-foreground mt-3 text-sm">
            {memberAction
              ? m.data_table_preview_member_action_status(memberAction)
              : null}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
