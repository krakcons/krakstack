import type * as S from "@krak-stack/notifications/admin/delivery.schema";
import {
  type DataTableColDef,
  type DataTablePublicState,
} from "@krak-stack/registry/data-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SendOperationsMessages } from "./operations.js";
import {
  NotificationTable as DataTable,
  NotificationReference,
} from "./presentation.js";

export interface NotificationDeliveryMessages {
  readonly common: SendOperationsMessages;
  readonly title: string;
  readonly description: string;
  readonly source: string;
  readonly sources: Readonly<Record<typeof S.DeliverySource.Type, string>>;
  readonly recipientUserId: string;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly template: string;
  readonly purposes: Readonly<
    Record<(typeof S.AdminDelivery.Type)["purpose"], string>
  >;
  readonly eventKey: string;
  readonly references: string;
  readonly feedbackNotice: string;
  readonly feedbackCovered: string;
  readonly feedbackUnavailable: string;
}
export interface NotificationDeliveriesProps {
  readonly messages: NotificationDeliveryMessages;
  readonly source: typeof S.DeliverySource.Type;
  readonly onSource: (source: typeof S.DeliverySource.Type) => void;
  readonly view: "overview" | "activity";
  readonly onView: (view: "overview" | "activity") => void;
  readonly overview?: typeof S.DeliveryOverview.Type;
  readonly activity?: typeof S.AdminDeliveryPage.Type;
  readonly table: DataTablePublicState;
  readonly total: number;
  readonly onTable: (table: DataTablePublicState) => void;
  readonly pending: boolean;
  readonly error?: string;
  readonly inspection?: typeof S.AdminDeliveryInspection.Type;
  readonly inspecting: boolean;
  readonly inspectionError?: string;
  readonly onInspect: (id: string | undefined) => void;
  readonly onRefresh: () => void;
  readonly onContact?: (id: string) => void;
  readonly onCampaign?: (id: string) => void;
}
const metricKeys = [
  "total",
  "queued",
  "processing",
  "retrying",
  "accepted",
  "failed",
  "suppressed",
  "cancelled",
  "feedbackCovered",
  "feedbackUnavailable",
  "confirmed",
  "hardBounced",
  "softBounced",
  "complained",
] satisfies ReadonlyArray<keyof typeof S.DeliveryOverview.Type>;

// Uses the same installed KrakStack table primitives as contact operations, but
// deliberately has no publishing, consent, block/unblock or retry callbacks.
export const NotificationDeliveries = (p: NotificationDeliveriesProps) => {
  const m = p.messages;
  const c = m.common;
  const columns: DataTableColDef<typeof S.AdminDelivery.Type>[] = [
    { field: "recipientAddress", headerName: c.email },
    {
      field: "source",
      headerName: m.source,
      filterOptions: ["contacts", "engine"].map((value) => ({
        value,
        label: value === "contacts" ? m.sources.contacts : m.sources.engine,
      })),
      cellRenderer: ({ data }) => m.sources[data.source],
    },
    { field: "recipientUserId", headerName: m.recipientUserId },
    { field: "organizationId", headerName: m.organizationId },
    { field: "workspaceId", headerName: m.workspaceId },
    { field: "eventKey", headerName: m.eventKey },
    { field: "template", headerName: m.template },
    {
      field: "purpose",
      headerName: c.purpose,
      filterOptions: Object.entries(m.purposes).map(([value, label]) => ({
        value,
        label,
      })),
      cellRenderer: ({ data }) => m.purposes[data.purpose],
    },
    {
      field: "status",
      headerName: c.status,
      filterOptions: Object.entries(c.statuses).map(([value, label]) => ({
        value,
        label,
      })),
      cellRenderer: ({ data }) => c.statuses[data.status],
    },
    { field: "attempts", headerName: c.attempts, type: "number" },
    { field: "provider", headerName: c.provider },
    { field: "createdAt", headerName: c.created, type: "date" },
    { field: "sentAt", headerName: c.accepted, type: "date" },
    {
      colId: "inspect",
      headerName: c.inspect,
      sortable: false,
      searchable: false,
      filterable: false,
      hideable: false,
      cellRenderer: ({ data }) => (
        <Button variant="outline" onClick={() => p.onInspect(data.id)}>
          {c.inspect}
        </Button>
      ),
    },
  ];
  const delivery = p.inspection?.delivery;
  const metrics = {
    ...c.metrics,
    feedbackCovered: m.feedbackCovered,
    feedbackUnavailable: m.feedbackUnavailable,
  };
  return (
    <section className="space-y-4" aria-busy={p.pending}>
      <header className="flex justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{m.title}</h1>
          <p>{m.description}</p>
        </div>
        <Button variant="outline" onClick={p.onRefresh}>
          {c.refresh}
        </Button>
      </header>
      <Tabs
        value={p.source}
        onValueChange={(value) => {
          if (value === "all" || value === "contacts" || value === "engine")
            p.onSource(value);
        }}
      >
        <TabsList aria-label={m.source}>
          {(["all", "contacts", "engine"] as const).map((source) => (
            <TabsTrigger key={source} value={source}>
              {m.sources[source]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Tabs
        value={p.view}
        onValueChange={(value) => {
          if (value === "overview" || value === "activity") p.onView(value);
        }}
      >
        <TabsList aria-label={m.title}>
          {(["overview", "activity"] as const).map((view) => (
            <TabsTrigger key={view} value={view}>
              {c.views[view]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {p.error && <p role="alert">{p.error}</p>}
      <p>{m.feedbackNotice}</p>
      {p.view === "overview" && p.overview && (
        <dl className="grid gap-3 sm:grid-cols-3">
          {metricKeys.map((key) => (
            <div
              key={key}
              role="group"
              aria-label={metrics[key]}
              className="rounded border p-3"
            >
              <dt>{metrics[key]}</dt>
              <dd className="text-2xl font-semibold">{p.overview?.[key]}</dd>
            </div>
          ))}
        </dl>
      )}
      {p.view === "activity" && (
        <DataTable
          rowData={p.activity?.items ?? []}
          columnDefs={columns}
          getRowId={(row) => row.id}
          state={p.table}
          onStateChange={p.onTable}
          status={{ loading: p.pending, error: p.error }}
          features={{
            pagination: { mode: "server", rowCount: p.total },
            refresh: p.onRefresh,
          }}
          messages={{
            en: { empty: c.empty, loading: c.loading },
            fr: { empty: c.empty, loading: c.loading },
          }}
        />
      )}
      <Dialog
        open={p.inspecting}
        onOpenChange={(open) => {
          if (!open) p.onInspect(undefined);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{c.inspect}</DialogTitle>
          </DialogHeader>
          {p.inspectionError && <p role="alert">{p.inspectionError}</p>}
          {!delivery && !p.inspectionError && <p role="status">{c.loading}</p>}
          {delivery && (
            <>
              <dl className="grid gap-2 break-all sm:grid-cols-2">
                {[
                  [
                    c.id,
                    <NotificationReference
                      key="delivery"
                      kind="delivery"
                      id={delivery.id}
                    />,
                  ],
                  [m.source, m.sources[delivery.source]],
                  [c.email, delivery.recipientAddress],
                  [
                    m.recipientUserId,
                    <NotificationReference
                      key="account"
                      kind="account"
                      id={delivery.recipientUserId}
                    />,
                  ],
                  [
                    m.organizationId,
                    <NotificationReference
                      key="organization"
                      kind="organization"
                      id={delivery.organizationId}
                    />,
                  ],
                  [
                    m.workspaceId,
                    <NotificationReference
                      key="workspace"
                      kind="workspace"
                      id={delivery.workspaceId}
                    />,
                  ],
                  [m.eventKey, delivery.eventKey],
                  [m.template, delivery.template],
                  [c.purpose, m.purposes[delivery.purpose]],
                  [c.status, c.statuses[delivery.status]],
                  [c.provider, delivery.provider],
                  [c.providerMessageId, delivery.providerMessageId],
                  [c.reason, delivery.errorMessage],
                  [
                    c.attempts,
                    `${delivery.attempts} / ${delivery.maxAttempts}`,
                  ],
                ].map(([label, value], index) => (
                  <div key={index}>
                    <dt className="font-semibold">{label}</dt>
                    <dd>{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
              {delivery.contactId && p.onContact && (
                <Button
                  variant="outline"
                  onClick={() => p.onContact?.(delivery.contactId!)}
                >
                  {c.contactId}
                </Button>
              )}
              {delivery.campaignId && p.onCampaign && (
                <Button
                  variant="outline"
                  onClick={() => p.onCampaign?.(delivery.campaignId!)}
                >
                  {c.campaign}
                </Button>
              )}
              <h3>{m.references}</h3>
              <dl>
                {p.inspection?.references.map((ref) => (
                  <div key={`${ref.namespace}:${ref.value}`}>
                    <dt>{ref.namespace}</dt>
                    <dd>
                      <NotificationReference
                        kind={ref.namespace}
                        id={ref.value}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
              <h3>{c.attempts}</h3>
              <DataTable
                rowData={p.inspection?.attempts ?? []}
                getRowId={(row) => row.id}
                columnDefs={[
                  {
                    field: "generation",
                    headerName: c.generation,
                    type: "number",
                  },
                  { field: "attempt", headerName: c.attempts, type: "number" },
                  {
                    colId: "outcome",
                    headerName: c.outcome,
                    cellRenderer: ({ data }) =>
                      data.outcome ? c.outcomes[data.outcome._tag] : c.pending,
                  },
                  {
                    colId: "reason",
                    headerName: c.reason,
                    cellRenderer: ({ data }) => {
                      const o = data.outcome;
                      if (!o) return "—";
                      switch (o._tag) {
                        case "Sent":
                          return o.providerMessageId ?? "—";
                        case "Skipped":
                          return o.reason;
                        default:
                          return o.message;
                      }
                    },
                  },
                  { field: "startedAt", headerName: c.started, type: "date" },
                  {
                    field: "completedAt",
                    headerName: c.completed,
                    type: "date",
                  },
                ]}
                features={{ pagination: { mode: "client" } }}
              />
            </>
          )}
          <Button variant="outline" onClick={p.onRefresh}>
            {c.refresh}
          </Button>
          <Button variant="outline" onClick={() => p.onInspect(undefined)}>
            {c.close}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
};
