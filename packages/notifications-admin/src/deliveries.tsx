import type * as S from "@krak-stack/notifications/admin/delivery.schema";
import type {
  DataTableColDef,
  DataTablePublicState,
} from "@krak-stack/registry/data-table";
import { useKrakstackLocale } from "@krak-stack/registry/krakstack-provider";
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
  type NotificationTableOptions,
  type NotificationTableId,
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
  readonly sections?: {
    readonly summary: string;
    readonly sending: string;
  };
}

interface ReadState {
  readonly pending?: boolean;
  /** A failed protected read hides retained data, not just an error banner. */
  readonly error?: string;
}
export type NotificationAttemptHistoryMessages = Pick<
  SendOperationsMessages,
  | "generation"
  | "attempts"
  | "outcome"
  | "outcomes"
  | "pending"
  | "reason"
  | "started"
  | "completed"
  | "empty"
  | "loading"
>;
export type NotificationDeliveryActivityMessages = Pick<
  NotificationDeliveryMessages,
  | "source"
  | "sources"
  | "recipientUserId"
  | "organizationId"
  | "workspaceId"
  | "eventKey"
  | "template"
  | "purposes"
> & {
  readonly common: Pick<
    SendOperationsMessages,
    | "email"
    | "purpose"
    | "status"
    | "statuses"
    | "attempts"
    | "provider"
    | "created"
    | "accepted"
    | "inspect"
    | "empty"
    | "loading"
  >;
};
export type NotificationDeliveryOverviewMessages = Pick<
  NotificationDeliveryMessages,
  "feedbackCovered" | "feedbackUnavailable" | "feedbackNotice"
> & {
  readonly common: {
    readonly loading: string;
    readonly metrics: Pick<
      SendOperationsMessages["metrics"],
      Exclude<
        NotificationDeliveryMetric,
        "feedbackCovered" | "feedbackUnavailable"
      >
    >;
  };
};
export type NotificationDeliveryDetailsMessages = Pick<
  NotificationDeliveryMessages,
  | "source"
  | "sources"
  | "recipientUserId"
  | "organizationId"
  | "workspaceId"
  | "eventKey"
  | "template"
  | "purposes"
  | "sections"
  | "references"
> & {
  readonly common: NotificationAttemptHistoryMessages &
    Pick<
      SendOperationsMessages,
      | "email"
      | "purpose"
      | "status"
      | "statuses"
      | "created"
      | "scheduled"
      | "accepted"
      | "id"
      | "provider"
      | "providerMessageId"
      | "updated"
      | "contactId"
      | "campaign"
    > & { readonly views: Pick<SendOperationsMessages["views"], "overview"> };
};
export interface NotificationDeliveryActivityProps extends ReadState {
  readonly messages: NotificationDeliveryActivityMessages;
  readonly activity?: typeof S.AdminDeliveryPage.Type;
  readonly table: DataTablePublicState;
  readonly total: number;
  readonly onTable: (table: DataTablePublicState) => void;
  readonly onInspect: (id: string) => void;
  readonly onRefresh?: () => void;
  readonly tableOptions?: NotificationTableOptions<typeof S.AdminDelivery.Type>;
}
export type NotificationDeliveryMetric = keyof typeof S.DeliveryOverview.Type;
export interface NotificationDeliveryOverviewProps extends ReadState {
  readonly messages: NotificationDeliveryOverviewMessages;
  readonly overview?: typeof S.DeliveryOverview.Type;
  readonly variant?: "cards" | "rows";
  readonly groups?: ReadonlyArray<{
    readonly label?: string;
    readonly metrics: ReadonlyArray<NotificationDeliveryMetric>;
  }>;
}
export interface NotificationAttemptHistoryProps extends ReadState {
  readonly messages: NotificationAttemptHistoryMessages;
  readonly attempts: (typeof S.AdminDeliveryInspection.Type)["attempts"];
  readonly tableOptions?: NotificationTableOptions<
    (typeof S.AdminDeliveryInspection.Type)["attempts"][number]
  >;
  readonly tableId?: Extract<
    NotificationTableId,
    "delivery-attempts" | "operations-attempts"
  >;
}
export interface NotificationDeliveryDetailsProps extends ReadState {
  readonly messages: NotificationDeliveryDetailsMessages;
  readonly inspection?: typeof S.AdminDeliveryInspection.Type;
  readonly onContact?: (id: string) => void;
  readonly onCampaign?: (id: string) => void;
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
  readonly header?: boolean;
  readonly navigation?: boolean;
  readonly sourcePicker?: boolean;
  readonly tableOptions?: NotificationDeliveryActivityProps["tableOptions"];
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
] satisfies ReadonlyArray<NotificationDeliveryMetric>;

export const NotificationDeliveryOverview = (
  p: NotificationDeliveryOverviewProps,
) => {
  const locale = useKrakstackLocale();
  const labels = {
    ...p.messages.common.metrics,
    feedbackCovered: p.messages.feedbackCovered,
    feedbackUnavailable: p.messages.feedbackUnavailable,
  };
  if (p.error) return <p role="alert">{p.error}</p>;
  if (!p.overview)
    return p.pending ? <p role="status">{p.messages.common.loading}</p> : null;
  const overview = p.overview;
  return (
    <div className="space-y-4" aria-busy={p.pending}>
      <p>{p.messages.feedbackNotice}</p>
      {(p.groups ?? [{ metrics: metricKeys }]).map((group, index) => (
        <section key={index} aria-label={group.label}>
          {group.label && <h2 className="font-semibold">{group.label}</h2>}
          <dl
            className={
              p.variant === "rows" ? "divide-y" : "grid gap-3 sm:grid-cols-3"
            }
          >
            {group.metrics.map((key) => (
              <div
                key={key}
                role="group"
                aria-label={labels[key]}
                className={
                  p.variant === "rows"
                    ? "flex justify-between gap-4 py-2"
                    : "rounded border p-3"
                }
              >
                <dt>{labels[key]}</dt>
                <dd className="text-2xl font-semibold">
                  {overview[key].toLocaleString(locale)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
};

export const NotificationDeliveryActivity = (
  p: NotificationDeliveryActivityProps,
) => {
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
  return (
    <DataTable
      notificationTable="delivery-activity"
      rowData={p.error ? [] : (p.activity?.items ?? [])}
      columnDefs={p.tableOptions?.columns?.(columns) ?? columns}
      initialState={p.tableOptions?.initialState}
      className={p.tableOptions?.className}
      getRowId={(row) => row.id}
      state={p.table}
      onStateChange={p.onTable}
      status={{ loading: p.pending, error: p.error }}
      features={{
        pagination: { mode: "server", rowCount: p.error ? 0 : p.total },
        refresh: p.onRefresh,
      }}
      messages={{
        en: { empty: c.empty, loading: c.loading },
        fr: { empty: c.empty, loading: c.loading },
      }}
    />
  );
};

export const NotificationAttemptHistory = (
  p: NotificationAttemptHistoryProps,
) => {
  const c = p.messages;
  const columns: DataTableColDef<
    NotificationAttemptHistoryProps["attempts"][number]
  >[] = [
    { field: "generation", headerName: c.generation, type: "number" },
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
        const outcome = data.outcome;
        if (!outcome) return "—";
        if (outcome._tag === "Sent") return outcome.providerMessageId ?? "—";
        if (outcome._tag === "Skipped") return outcome.reason;
        return outcome.message;
      },
    },
    { field: "startedAt", headerName: c.started, type: "date" },
    { field: "completedAt", headerName: c.completed, type: "date" },
  ];
  return (
    <DataTable
      notificationTable={p.tableId ?? "delivery-attempts"}
      rowData={p.error ? [] : p.attempts}
      columnDefs={p.tableOptions?.columns?.(columns) ?? columns}
      initialState={p.tableOptions?.initialState}
      className={p.tableOptions?.className}
      getRowId={(row) => row.id}
      status={{ loading: p.pending, error: p.error }}
      features={{ pagination: { mode: "client" } }}
      messages={{
        en: { empty: c.empty, loading: c.loading },
        fr: { empty: c.empty, loading: c.loading },
      }}
    />
  );
};

/** Read-only content for a host dialog, drawer or route; no fetching or shell. */
export const NotificationDeliveryDetails = (
  p: NotificationDeliveryDetailsProps,
) => {
  const locale = useKrakstackLocale();
  const m = p.messages;
  const c = m.common;
  if (p.error) return <p role="alert">{p.error}</p>;
  if (!p.inspection) return <p role="status">{c.loading}</p>;
  const { delivery, references, attempts } = p.inspection;
  const date = (value: Date | null) =>
    value ? value.toLocaleString(locale) : "—";
  const summary = [
    { label: c.email, value: delivery.recipientAddress },
    {
      label: m.recipientUserId,
      value: (
        <NotificationReference kind="account" id={delivery.recipientUserId} />
      ),
    },
    {
      label: m.organizationId,
      value: (
        <NotificationReference
          kind="organization"
          id={delivery.organizationId}
        />
      ),
    },
    {
      label: m.workspaceId,
      value: (
        <NotificationReference kind="workspace" id={delivery.workspaceId} />
      ),
    },
    { label: c.purpose, value: m.purposes[delivery.purpose] },
    { label: c.status, value: c.statuses[delivery.status] },
    { label: c.created, value: date(delivery.createdAt) },
    { label: c.scheduled, value: date(delivery.scheduledFor) },
    { label: c.accepted, value: date(delivery.sentAt) },
    { label: c.reason, value: delivery.errorMessage },
  ];
  const sending = [
    {
      label: c.id,
      value: <NotificationReference kind="delivery" id={delivery.id} />,
    },
    { label: m.source, value: m.sources[delivery.source] },
    { label: m.eventKey, value: delivery.eventKey },
    { label: m.template, value: delivery.template },
    { label: c.provider, value: delivery.provider },
    { label: c.providerMessageId, value: delivery.providerMessageId },
    {
      label: c.attempts,
      value: `${delivery.attempts} / ${delivery.maxAttempts}`,
    },
    { label: c.updated, value: date(delivery.updatedAt) },
  ];
  return (
    <div className="space-y-6" aria-busy={p.pending}>
      {[
        { label: m.sections?.summary ?? c.views.overview, fields: summary },
        { label: m.sections?.sending ?? c.provider, fields: sending },
      ].map((section, index) => (
        <section key={index} aria-label={section.label}>
          <h2 className="font-semibold">{section.label}</h2>
          <dl className="grid gap-2 break-words sm:grid-cols-2">
            {section.fields.map((field, index) => (
              <div key={index}>
                <dt className="font-semibold">{field.label}</dt>
                <dd>{field.value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {delivery.contactId && p.onContact && (
        <Button
          variant="outline"
          onClick={() => {
            if (delivery.contactId) p.onContact?.(delivery.contactId);
          }}
        >
          {c.contactId}
        </Button>
      )}
      {delivery.campaignId && p.onCampaign && (
        <Button
          variant="outline"
          onClick={() => {
            if (delivery.campaignId) p.onCampaign?.(delivery.campaignId);
          }}
        >
          {c.campaign}
        </Button>
      )}
      {references.length > 0 && (
        <section aria-label={m.references}>
          <h2 className="font-semibold">{m.references}</h2>
          <dl>
            {references.map((ref) => (
              <div key={`${ref.namespace}:${ref.value}`}>
                <dt>{ref.namespace}</dt>
                <dd>
                  <NotificationReference kind={ref.namespace} id={ref.value} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <section aria-label={c.attempts}>
        <h2 className="font-semibold">{c.attempts}</h2>
        <NotificationAttemptHistory messages={c} attempts={attempts} />
      </section>
    </div>
  );
};

/** Backwards-compatible default composition; hosts can mount the sections alone. */
export const NotificationDeliveries = (p: NotificationDeliveriesProps) => {
  const m = p.messages;
  const c = m.common;
  return (
    <section className="space-y-4" aria-busy={p.pending}>
      {p.header !== false && (
        <header className="flex justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{m.title}</h1>
            <p>{m.description}</p>
          </div>
          <Button variant="outline" onClick={p.onRefresh}>
            {c.refresh}
          </Button>
        </header>
      )}
      {p.sourcePicker !== false && (
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
      )}
      {p.navigation !== false && (
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
      )}
      {p.view === "overview" ? (
        <NotificationDeliveryOverview
          messages={m}
          overview={p.overview}
          pending={p.pending}
          error={p.error}
        />
      ) : (
        <>
          <p>{m.feedbackNotice}</p>
          <NotificationDeliveryActivity
            messages={m}
            activity={p.activity}
            pending={p.pending}
            error={p.error}
            table={p.table}
            total={p.total}
            onTable={p.onTable}
            onInspect={p.onInspect}
            onRefresh={p.onRefresh}
            tableOptions={p.tableOptions}
          />
        </>
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
          <NotificationDeliveryDetails
            messages={m}
            inspection={p.inspection}
            error={p.error ?? p.inspectionError}
            onContact={p.onContact}
            onCampaign={p.onCampaign}
          />
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
