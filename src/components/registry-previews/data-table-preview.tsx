import {
  DataTable,
  type DataTableColDef,
  type DataTableRowAction,
} from "@krak-stack/registry/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Archive, CircleDot, ExternalLink, Pencil } from "lucide-react";
import { useState } from "react";

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

const columns: DataTableColDef<Project>[] = [
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
  },
  {
    field: "category",
    headerName: "Category",
  },
  {
    field: "score",
    headerName: "Score",
    cellRenderer: ({ data }) => (
      <span className="tabular-nums">{data.score}</span>
    ),
  },
  {
    field: "updated",
    headerName: "Updated",
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

export function DataTablePreview() {
  const [sortableProjects, setSortableProjects] = useState(projects);
  return (
    <div className="grid gap-6">
      <Card className="max-w-full min-w-0 overflow-hidden bg-[var(--surface-strong)]">
        <CardHeader>
          <CardTitle>Project Queue</CardTitle>
          <CardDescription>
            This demo uses the exported `DataTable`, custom cells, and row
            actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-full min-w-0">
          <DataTable
            columnDefs={columns}
            getRowId={(project) => project.id}
            rowData={projects}
            features={{
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
        <CardContent className="max-w-full min-w-0 pt-6">
          <DataTable
            columnDefs={columns}
            features={{
              pagination: false,
              reordering: {
                getRowLabel: (project) => project.name,
                onReorder: setSortableProjects,
              },
            }}
            getRowId={(project) => project.id}
            rowData={sortableProjects}
          />
        </CardContent>
      </Card>
    </div>
  );
}
