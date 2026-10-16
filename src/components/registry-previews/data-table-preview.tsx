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
import { useState, type Dispatch, type SetStateAction } from "react";
import { getRouteApi } from "@tanstack/react-router";
import * as m from "@/paraglide/messages";

const routeApi = getRouteApi("/docs/{-$slug}");

type Project = {
  id: string;
  name: string;
  summary: string;
  status: "Backlog" | "In Progress" | "Review" | "Shipped";
  owner: string;
  category: "Product" | "Growth" | "Platform";
  score: number;
  updated: string;
  members?: readonly DataTableListOption[];
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

const projectColumns = ({
  setMemberAction,
  setPreviewProjects,
}: {
  setMemberAction: (action: {
    action: string;
    name: string;
    row: string;
  }) => void;
  setPreviewProjects: Dispatch<SetStateAction<Project[]>>;
}): DataTableColDef<Project>[] => [
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
      actionsLabel: m.data_table_preview_member_actions(),
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
    field: "category",
    headerName: "Category",
  },
  {
    colId: "members",
    headerName: m.data_table_preview_members(),
    type: "list",
    width: 280,
    typeOptions: {
      display: "list",
      emptyLabel: m.data_table_preview_no_items(),
      getItems: getProjectMembers,
      getOptions: () => exampleMembers,
      manageLabel: m.data_table_preview_manage_members(),
      onAdd: ({ value, row }) => {
        const member = exampleMembers.find((item) => item.value === value);
        if (!member) return;
        setPreviewProjects((current) =>
          current.map((project) =>
            project.id === row.id &&
            !getProjectMembers(project).some((item) => item.value === value)
              ? { ...project, members: [...getProjectMembers(project), member] }
              : project,
          ),
        );
      },
      onRemove: ({ value, row }) =>
        setPreviewProjects((current) =>
          current.map((project) =>
            project.id === row.id
              ? {
                  ...project,
                  members: getProjectMembers(project).filter(
                    (item) => item.value !== value,
                  ),
                }
              : project,
          ),
        ),
    },
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
  { value: "alan", label: "Alan" },
  { value: "annie", label: "Annie" },
  { value: "barbara", label: "Barbara" },
  { value: "claude", label: "Claude" },
  { value: "donald", label: "Donald" },
  { value: "dorothy", label: "Dorothy" },
  { value: "edsger", label: "Edsger" },
  { value: "evelyn", label: "Evelyn" },
  { value: "frances", label: "Frances" },
  { value: "george", label: "George" },
  { value: "james", label: "James" },
  { value: "jean", label: "Jean" },
  { value: "john", label: "John" },
  { value: "karen", label: "Karen" },
  { value: "katherine", label: "Katherine" },
  { value: "ken", label: "Ken" },
  { value: "margaret", label: "Margaret" },
  { value: "mary", label: "Mary" },
  { value: "radia", label: "Radia" },
  { value: "sophie", label: "Sophie" },
];

const getProjectMembers = (project: Project) =>
  project.members ??
  (project.category === "Growth"
    ? exampleMembers
    : exampleMembers.slice(0, project.category === "Product" ? 3 : 1));

export function DataTablePreview() {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const [previewProjects, setPreviewProjects] = useState(projects);
  const [memberAction, setMemberAction] = useState<{
    action: string;
    name: string;
    row: string;
  } | null>(null);
  const columns = projectColumns({ setMemberAction, setPreviewProjects });
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
            state={search}
            onStateChange={(query) =>
              void navigate({
                search: (previous) => ({ ...previous, ...query }),
                replace: true,
                resetScroll: false,
              })
            }
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
      <p role="status" className="text-muted-foreground text-sm">
        {memberAction
          ? m.data_table_preview_member_action_status(memberAction)
          : null}
      </p>
    </div>
  );
}
