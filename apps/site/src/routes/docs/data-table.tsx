import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallCommand } from "@/components/install-command";
import { useRegistryItem } from "@/lib/use-registry-item";
import {
  DataTable,
  DataTableColumnHeader,
  TableSearchSchema,
  createDataTableActionsColumn,
} from "@/components/data-table";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive, CircleDot, ExternalLink, Pencil } from "lucide-react";

export const Route = createFileRoute("/docs/data-table")({
  validateSearch: TableSearchSchema,
  component: DataTableDocs,
});

const registryFallback = {
  name: "data-table",
  title: "Data Table",
  description: "A simple data table component.",
};

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
    summary: "Capture qualified leads with plan preference and attribution metadata.",
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
    summary: "Expose invoice state, payment health, and renewal risk to operators.",
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
    summary: "Organize component pages around examples, API notes, and registry usage.",
    status: "Review",
    owner: "Ada",
    category: "Product",
    score: 88,
    updated: "2026-04-03",
  },
  {
    id: "ks-107",
    name: "Lifecycle emails",
    summary: "Send high-signal lifecycle emails based on onboarding milestones.",
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
  {
    id: "ks-109",
    name: "Partner portal",
    summary: "Give partners a read-only view of shared projects and owners.",
    status: "In Progress",
    owner: "Ada",
    category: "Growth",
    score: 84,
    updated: "2026-03-18",
  },
  {
    id: "ks-110",
    name: "Audit trail",
    summary: "Log high-risk changes made from administrative workflows.",
    status: "Backlog",
    owner: "Grace",
    category: "Platform",
    score: 76,
    updated: "2026-03-11",
  },
  {
    id: "ks-111",
    name: "Pricing experiments",
    summary: "Compare packaging changes across acquisition cohorts.",
    status: "Review",
    owner: "Hedy",
    category: "Growth",
    score: 90,
    updated: "2026-03-05",
  },
  {
    id: "ks-112",
    name: "Command center",
    summary: "Surface operator queues and operational exceptions in one view.",
    status: "Shipped",
    owner: "Linus",
    category: "Product",
    score: 93,
    updated: "2026-02-27",
  },
];

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Project" />,
    cell: ({ row }) => (
      <div className="grid gap-1">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-muted-foreground text-xs">{row.original.id}</span>
      </div>
    ),
  },
  {
    accessorKey: "summary",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Summary" />,
    cell: ({ row }) => <span className="max-w-[24rem] text-muted-foreground">{row.original.summary}</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge className="gap-1" variant={row.original.status === "Shipped" ? "default" : "secondary"}>
        <CircleDot className="size-3" />
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "owner",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
  },
  {
    accessorKey: "category",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
  },
  {
    accessorKey: "score",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.score}</span>,
  },
  {
    accessorKey: "updated",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
  },
  createDataTableActionsColumn<Project>([
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
  ]),
];

function DataTableDocs() {
  const registryItem = useRegistryItem("data-table", registryFallback);

  return (
    <main className="mx-auto flex min-h-screen w-full min-w-0 max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid min-w-0 gap-3">
        <p className="text-sm font-semibold tracking-[0.24em] text-[var(--kicker)] uppercase">
          Components
        </p>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="grid min-w-0 gap-3">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
              {registryItem.title ?? registryItem.name}
            </h1>
            <p className="max-w-3xl text-lg text-[var(--sea-ink-soft)]">{registryItem.description}</p>
          </div>
          <Card className="bg-[var(--surface-strong)]">
            <CardHeader>
              <CardTitle>URL-driven state</CardTitle>
              <CardDescription>
                Search, pagination, sorting, grouping, and view mode are parsed by `TableSearchSchema`.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <InstallCommand slug="data-table" />

      <Card className="min-w-0 bg-[var(--surface-strong)]">
        <CardHeader>
          <CardTitle>Project Queue</CardTitle>
          <CardDescription>
            This demo uses the exported `DataTable`, `DataTableColumnHeader`, and actions-column helper.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <DataTable
            columns={columns}
            data={projects}
            exportFileName="projects.csv"
            from="/docs/data-table"
            gallery={{
              name: "name",
              description: "summary",
              tag: "status",
            }}
            grouping={{
              initial: ["status"],
              getRowLabel: (project) => project.name,
              fields: [
                {
                  id: "status",
                  label: "Status",
                  getGroupId: (project) => project.status,
                  getGroupIds: () => ["Backlog", "In Progress", "Review", "Shipped"],
                  getGroupLabel: (status, rows) => `${status} (${rows.length})`,
                  renderEmptyGroup: (status) => `No projects are currently ${status.toLowerCase()}.`,
                  onMoveToGroup: (project, status) => {
                    window.alert(`Move ${project.name} to ${status}`);
                  },
                },
                {
                  id: "owner",
                  label: "Owner",
                  getGroupId: (project) => project.owner,
                  getGroupIds: () => ["Ada", "Grace", "Hedy", "Linus"],
                  getGroupLabel: (owner, rows) => `${owner} (${rows.length})`,
                },
              ],
            }}
            onRowClick={(project) => window.alert(`Selected ${project.name}`)}
          />
        </CardContent>
      </Card>
    </main>
  );
}
