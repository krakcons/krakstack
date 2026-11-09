import { useState } from "react";
export { NotificationDeliveries } from "./deliveries.js";
export type {
  NotificationDeliveriesProps,
  NotificationDeliveryMessages,
} from "./deliveries.js";
import { Effect, Schema } from "effect";
import * as S from "@krak-stack/notifications/admin/operations.schema";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColDef,
} from "@krak-stack/registry/data-table";
import type {
  DataTableProps,
  DataTablePublicState,
} from "@krak-stack/registry/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppForm } from "@krak-stack/registry/form";

export { SendOperationsAdmin as NotificationOperations };
export type {
  SendOperationsProps as NotificationOperationsProps,
  SendOperationsMessages as NotificationOperationsMessages,
};
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type View = typeof S.OperationsView.Type;
type Filters = typeof S.OperationsFilters.Type;
export interface SendOperationsMessages {
  readonly title: string;
  readonly description: string;
  readonly refresh: string;
  readonly loading: string;
  readonly failed: string;
  readonly empty: string;
  readonly views: Readonly<Record<View, string>>;
  readonly metrics: Readonly<
    Record<keyof typeof S.SendingOverview.Type, string>
  >;
  readonly statuses: Readonly<
    Record<(typeof S.DeliveryActivity.Type)["status"], string>
  >;
  readonly kinds: Readonly<
    Record<(typeof S.FeedbackRecord.Type)["kind"] | "bounces", string>
  >;
  readonly outcomes: Readonly<
    Record<
      NonNullable<
        (typeof S.DeliveryInspection.Type)["attempts"][number]["outcome"]
      >["_tag"],
      string
    >
  >;
  readonly search: string;
  readonly since: string;
  readonly until: string;
  readonly apply: string;
  readonly all: string;
  readonly status: string;
  readonly campaign: string;
  readonly campaignId: string;
  readonly email: string;
  readonly subject: string;
  readonly provider: string;
  readonly providerMessageId: string;
  readonly attempts: string;
  readonly created: string;
  readonly scheduled: string;
  readonly updated: string;
  readonly accepted: string;
  readonly reason: string;
  readonly inspect: string;
  readonly close: string;
  readonly previous: string;
  readonly next: string;
  readonly correlation: string;
  readonly pending: string;
  readonly applied: string;
  readonly occurred: string;
  readonly received: string;
  readonly checked: string;
  readonly eventId: string;
  readonly deliveryId: string;
  readonly contactId: string;
  readonly addSuppression: string;
  readonly removeSuppression: string;
  readonly suppressionWarning: string;
  readonly confirm: string;
  readonly active: string;
  readonly expired: string;
  readonly expires: string;
  readonly never: string;
  readonly purpose: string;
  readonly actor: string;
  readonly action: string;
  readonly add: string;
  readonly remove: string;
  readonly previousReason: string;
  readonly requestId: string;
  readonly recipientsHint: string;
  readonly recipientStatuses: Readonly<
    Record<(typeof S.CampaignRecipient.Type)["status"], string>
  >;
  readonly generation: string;
  readonly outcome: string;
  readonly started: string;
  readonly completed: string;
  readonly id: string;
}
export interface SendOperationsProps {
  readonly tableState?: DataTablePublicState;
  readonly onTableStateChange?: (state: DataTablePublicState) => void;
  readonly total?: number;
  readonly view: View;
  readonly filters: Filters;
  readonly messages: SendOperationsMessages;
  readonly overview?: typeof S.SendingOverview.Type;
  readonly activity?: typeof S.ActivityPage.Type;
  readonly feedback?: typeof S.FeedbackPage.Type;
  readonly suppressions?: typeof S.SuppressionPage.Type;
  readonly audit?: typeof S.SuppressionAuditPage.Type;
  readonly recipients?: typeof S.RecipientPage.Type;
  readonly inspection?: typeof S.DeliveryInspection.Type;
  readonly inspecting?: boolean;
  readonly pending?: boolean;
  readonly error?: string;
  readonly onView: (view: View) => void;
  readonly onFilters: (filters: Filters) => void;
  readonly onRefresh: () => void;
  readonly onInspect: (id: string) => void;
  readonly onCloseInspection: () => void;
  readonly onDeliveryFeedback: (id: string) => void;
  readonly onCampaign?: (id: string) => void;
  readonly onContact?: (id: string) => void;
  readonly onAddSuppression: (
    input: typeof S.AddSuppression.Type,
  ) => Promise<typeof S.SuppressionChange.Type | void>;
  readonly onRemoveSuppression: (input: {
    id: string;
    payload: typeof S.RemoveSuppression.Type;
  }) => Promise<typeof S.SuppressionChange.Type | void>;
}
const views = S.OperationsView.literals;
const metricKeys = [
  "total",
  "queued",
  "processing",
  "retrying",
  "accepted",
  "failed",
  "suppressed",
  "cancelled",
  "confirmed",
  "hardBounced",
  "softBounced",
  "complained",
  "pendingFeedback",
  "activeSuppressions",
] satisfies ReadonlyArray<keyof typeof S.SendingOverview.Type>;
const tableFeatures = {
  pagination: { mode: "client" },
} as const;
const Records = <T extends { readonly id: string }>({
  items,
  columns,
  m,
  table,
}: {
  items: ReadonlyArray<T> | undefined;
  columns: DataTableColDef<T>[];
  m: SendOperationsMessages;
  table?: Pick<
    DataTableProps<T>,
    "state" | "onStateChange" | "status" | "features"
  >;
}) => (
  <DataTable
    rowData={items ?? []}
    columnDefs={columns.map((column) =>
      column.colId === "inspect" || column.colId === "remove"
        ? {
            ...column,
            sortable: false,
            filterable: false,
            searchable: false,
            hideable: false,
          }
        : column,
    )}
    getRowId={(row) => row.id}
    features={tableFeatures}
    messages={{
      en: { empty: m.empty, loading: m.loading },
      fr: { empty: m.empty, loading: m.loading },
    }}
    {...table}
  />
);

const OverviewWindowForm = ({
  filters,
  m,
  onFilters,
}: {
  filters: Filters;
  m: SendOperationsMessages;
  onFilters: (filters: Filters) => void;
}) => {
  const defaultValues: typeof S.OverviewWindowForm.Encoded = {
    since: filters.since?.toISOString() ?? "",
    until: filters.until?.toISOString() ?? "",
  };
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: Schema.toStandardSchemaV1(S.OverviewWindowForm) },
    onSubmit: async ({ value }) => {
      const v = await Effect.runPromise(
        Schema.decodeEffect(S.OverviewWindowForm)(value),
      );
      onFilters({
        since: v.since || undefined,
        until: v.until || undefined,
      });
    },
  });
  return (
    <form.AppForm>
      <form
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <>
          <form.AppField name="since">
            {(field) => <field.TextField label={m.since} />}
          </form.AppField>
          <form.AppField name="until">
            {(field) => <field.TextField label={m.until} />}
          </form.AppField>
        </>
        <form.SubmitButton>{m.apply}</form.SubmitButton>
      </form>
    </form.AppForm>
  );
};

const SuppressionDialog = ({
  record,
  m,
  onAdd,
  onRemove,
  onClose,
}: {
  record: typeof S.SuppressionRecord.Type | null;
  m: SendOperationsMessages;
  onAdd: SendOperationsProps["onAddSuppression"];
  onRemove: SendOperationsProps["onRemoveSuppression"];
  onClose: () => void;
}) => {
  const [requestId] = useState(() => crypto.randomUUID());
  const [failure, setFailure] = useState<string>();
  const form = useAppForm({
    defaultValues: { email: record?.email ?? "", reason: "" },
    validators: { onSubmit: Schema.toStandardSchemaV1(S.SuppressionForm) },
    onSubmit: async ({ value }) => {
      setFailure(undefined);
      try {
        if (record)
          await onRemove({
            id: record.id,
            payload: {
              requestId,
              version: record.version,
              reason: value.reason,
            },
          });
        else
          await onAdd({ requestId, email: value.email, reason: value.reason });
        onClose();
      } catch {
        setFailure(m.failed);
      }
    },
  });
  // The request key is stable across retries. Removal uses the exact version
  // reviewed by the operator, never a silently refreshed provider suppression.
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {record ? m.removeSuppression : m.addSuppression}
          </DialogTitle>
          <DialogDescription>{m.suppressionWarning}</DialogDescription>
        </DialogHeader>
        {record && (
          <dl>
            <dt>{m.email}</dt>
            <dd>{record.email}</dd>
            <dt>{m.previousReason}</dt>
            <dd>{record.reason ?? "—"}</dd>
          </dl>
        )}
        <form.AppForm>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
          >
            {!record && (
              <form.AppField name="email">
                {(field) => <field.TextField label={m.email} type="email" />}
              </form.AppField>
            )}
            <form.AppField name="reason">
              {(field) => <field.TextAreaField label={m.reason} />}
            </form.AppField>
            {failure && <p role="alert">{failure}</p>}
            <form.SubmitButton>{m.confirm}</form.SubmitButton>
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
};

export const SendOperationsAdmin = (p: SendOperationsProps) => {
  const { messages: m, view } = p;
  const tableControls = {
    state: p.tableState,
    onStateChange: p.onTableStateChange,
    status: { loading: p.pending, error: p.error },
    features: {
      pagination:
        p.total === undefined
          ? { mode: "client" as const }
          : { mode: "server" as const, rowCount: p.total },
      refresh: p.onRefresh,
    },
  };
  const [manage, setManage] = useState<
    typeof S.SuppressionRecord.Type | null | undefined
  >();
  const date = (value: Date | null) =>
    value ? value.toLocaleString() : m.never;
  const activityColumns: DataTableColDef<typeof S.DeliveryActivity.Type>[] = [
    { field: "email", headerName: m.email },
    { field: "subject", headerName: m.subject },
    {
      field: "status",
      headerName: m.status,
      filterOptions: Object.entries(m.statuses).map(([value, label]) => ({
        value,
        label,
      })),
      cellRenderer: ({ data }) => m.statuses[data.status],
    },
    {
      field: "campaignName",
      headerName: m.campaign,
      cellRenderer: ({ data }) =>
        data.campaignId && p.onCampaign ? (
          <Button
            variant="link"
            onClick={() => p.onCampaign?.(data.campaignId!)}
          >
            {data.campaignName}
          </Button>
        ) : (
          (data.campaignName ?? "—")
        ),
    },
    { field: "attempts", headerName: m.attempts, type: "number" },
    { field: "provider", headerName: m.provider },
    { field: "errorMessage", headerName: m.reason },
    { field: "createdAt", headerName: m.created, type: "date" },
    { field: "scheduledFor", headerName: m.scheduled, type: "date" },
    { field: "sentAt", headerName: m.accepted, type: "date" },
    {
      colId: "inspect",
      headerName: m.inspect,
      cellRenderer: ({ data }) => (
        <Button variant="outline" onClick={() => p.onInspect(data.id)}>
          {m.inspect}
        </Button>
      ),
    },
  ];
  const feedbackColumns: DataTableColDef<typeof S.FeedbackRecord.Type>[] = [
    { field: "recipientAddress", headerName: m.email },
    {
      field: "kind",
      headerName: m.views.feedback,
      filterOptions: Object.entries(m.kinds)
        .filter(([value]) => value !== "bounces")
        .map(([value, label]) => ({ value, label })),
      cellRenderer: ({ data }) => m.kinds[data.kind],
    },
    {
      colId: "correlation",
      headerName: m.correlation,
      filterOptions: [
        { value: "pending", label: m.pending },
        { value: "applied", label: m.applied },
      ],
      filterValueGetter: ({ data }) => (data.appliedAt ? "applied" : "pending"),
      cellRenderer: ({ data }) => (data.appliedAt ? m.applied : m.pending),
    },
    { field: "provider", headerName: m.provider },
    { field: "providerMessageId", headerName: m.providerMessageId },
    { field: "eventId", headerName: m.eventId },
    {
      field: "occurredAt",
      type: "date",
      headerName: m.occurred,
      cellRenderer: ({ data }) => date(data.occurredAt),
    },
    {
      field: "receivedAt",
      type: "date",
      headerName: m.received,
      cellRenderer: ({ data }) => date(data.receivedAt),
    },
    {
      field: "checkedAt",
      type: "date",
      headerName: m.checked,
      cellRenderer: ({ data }) => date(data.checkedAt),
    },
    {
      field: "appliedAt",
      type: "date",
      headerName: m.applied,
      cellRenderer: ({ data }) => date(data.appliedAt),
    },
    { field: "deliveryId", headerName: m.deliveryId },
    { field: "contactId", headerName: m.contactId },
    { field: "campaignId", headerName: m.campaign },
    {
      colId: "inspect",
      headerName: m.inspect,
      cellRenderer: ({ data }) =>
        data.deliveryId ? (
          <Button
            variant="outline"
            onClick={() => p.onInspect(data.deliveryId!)}
          >
            {m.inspect}
          </Button>
        ) : (
          "—"
        ),
    },
  ];
  const suppressionColumns: DataTableColDef<typeof S.SuppressionRecord.Type>[] =
    [
      { field: "email", headerName: m.email },
      {
        field: "purpose",
        headerName: m.purpose,
        cellRenderer: ({ data }) => data.purpose ?? m.all,
      },
      { field: "reason", headerName: m.reason },
      {
        field: "active",
        type: "boolean",
        typeOptions: { trueLabel: m.active, falseLabel: m.expired },
        headerName: m.status,
        cellRenderer: ({ data }) => (data.active ? m.active : m.expired),
      },
      {
        field: "createdAt",
        type: "date",
        headerName: m.created,
        cellRenderer: ({ data }) => date(data.createdAt),
      },
      {
        field: "expiresAt",
        type: "date",
        headerName: m.expires,
        cellRenderer: ({ data }) => date(data.expiresAt),
      },
      {
        colId: "remove",
        headerName: m.removeSuppression,
        cellRenderer: ({ data }) => (
          <Button variant="destructive" onClick={() => setManage(data)}>
            {m.removeSuppression}
          </Button>
        ),
      },
    ];
  const auditColumns: DataTableColDef<
    typeof S.SuppressionAudit.Type & { id: string }
  >[] = [
    { field: "email", headerName: m.email },
    {
      field: "action",
      headerName: m.action,
      filterOptions: [
        { value: "add", label: m.add },
        { value: "remove", label: m.remove },
      ],
      cellRenderer: ({ data }) => (data.action === "add" ? m.add : m.remove),
    },
    { field: "reason", headerName: m.reason },
    { field: "previousReason", headerName: m.previousReason },
    { field: "actor", headerName: m.actor },
    {
      field: "occurredAt",
      type: "date",
      headerName: m.occurred,
      cellRenderer: ({ data }) => date(data.occurredAt),
    },
    { field: "requestId", headerName: m.requestId },
    { field: "suppressionId", headerName: m.id },
  ];
  const recipientColumns: DataTableColDef<typeof S.CampaignRecipient.Type>[] = [
    { field: "email", headerName: m.email },
    {
      field: "status",
      headerName: m.status,
      cellRenderer: ({ data }) => m.recipientStatuses[data.status],
      filterOptions: Object.entries(m.recipientStatuses).map(
        ([value, label]) => ({ value, label }),
      ),
    },
    { field: "reason", headerName: m.reason },
    {
      colId: "inspect",
      headerName: m.inspect,
      cellRenderer: ({ data }) =>
        data.deliveryId ? (
          <Button
            variant="outline"
            onClick={() => p.onInspect(data.deliveryId!)}
          >
            {m.inspect}
          </Button>
        ) : (
          "—"
        ),
    },
  ];
  const delivery = p.inspection?.delivery;
  return (
    <section className="space-y-4" aria-busy={p.pending}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{m.title}</h1>
          <p>{m.description}</p>
        </div>
        <Button variant="outline" onClick={p.onRefresh}>
          {m.refresh}
        </Button>
      </header>
      <Tabs
        value={view}
        onValueChange={(value) =>
          p.onView(Schema.decodeUnknownSync(S.OperationsView)(value))
        }
      >
        <TabsList className="h-auto flex-wrap" aria-label={m.title}>
          {views.map((v) => (
            <TabsTrigger key={v} value={v}>
              {m.views[v]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {view === "overview" && (
        <OverviewWindowForm
          key={`${view}:${JSON.stringify(p.filters)}`}
          filters={p.filters}
          m={m}
          onFilters={p.onFilters}
        />
      )}
      {p.filters.contactId && (
        <p>
          {m.contactId}: <code>{p.filters.contactId}</code>
        </p>
      )}
      {p.filters.deliveryId && (
        <p>
          {m.deliveryId}: <code>{p.filters.deliveryId}</code>
        </p>
      )}
      {p.error && <p role="alert">{p.error}</p>}
      {p.pending && <p role="status">{m.loading}</p>}
      {view === "overview" && p.overview && (
        <dl className="grid gap-3 sm:grid-cols-3">
          {metricKeys.map((key) => (
            <div
              key={key}
              role="group"
              aria-label={m.metrics[key]}
              className="rounded border p-3"
            >
              <dt>{m.metrics[key]}</dt>
              <dd className="text-2xl font-semibold">{p.overview?.[key]}</dd>
            </div>
          ))}
        </dl>
      )}
      {view === "activity" && (
        <Records
          items={p.activity?.items}
          columns={activityColumns}
          m={m}
          table={tableControls}
        />
      )}
      {view === "feedback" && (
        <Records
          items={p.feedback?.items}
          columns={feedbackColumns}
          m={m}
          table={tableControls}
        />
      )}
      {view === "suppressions" && (
        <>
          <Button onClick={() => setManage(null)}>{m.addSuppression}</Button>
          <Records
            items={p.suppressions?.items}
            columns={suppressionColumns}
            table={tableControls}
            m={m}
          />
        </>
      )}
      {view === "audit" && (
        <Records
          items={p.audit?.items.map((row) => ({ ...row, id: row.requestId }))}
          columns={auditColumns}
          table={tableControls}
          m={m}
        />
      )}
      {view === "recipients" &&
        (p.filters.campaignId ? (
          <Records
            items={p.recipients?.items}
            columns={recipientColumns}
            table={tableControls}
            m={m}
          />
        ) : (
          <p>{m.recipientsHint}</p>
        ))}
      <Dialog
        open={p.inspecting}
        onOpenChange={(open) => {
          if (!open) p.onCloseInspection();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{m.inspect}</DialogTitle>
          </DialogHeader>
          {p.error && <p role="alert">{p.error}</p>}
          {!delivery && !p.error && <p role="status">{m.loading}</p>}
          {delivery && (
            <>
              {p.onContact && (
                <Button
                  variant="outline"
                  onClick={() => p.onContact?.(delivery.contactId)}
                >
                  {m.contactId}
                </Button>
              )}
              <dl className="grid gap-2 break-all sm:grid-cols-2">
                {[
                  [m.id, delivery.id],
                  [m.contactId, delivery.contactId],
                  [m.email, delivery.email],
                  [m.subject, delivery.subject],
                  [m.status, m.statuses[delivery.status]],
                  [m.purpose, delivery.purpose],
                  [m.campaign, delivery.campaignName],
                  [m.provider, delivery.provider],
                  [m.providerMessageId, delivery.providerMessageId],
                  [m.reason, delivery.errorMessage],
                  [
                    m.attempts,
                    `${delivery.attempts} / ${delivery.maxAttempts}`,
                  ],
                  [m.created, date(delivery.createdAt)],
                  [m.scheduled, date(delivery.scheduledFor)],
                  [m.updated, date(delivery.updatedAt)],
                  [m.accepted, date(delivery.sentAt)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-semibold">{label}</dt>
                    <dd>{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
              <dl>
                {(
                  [
                    "confirmed",
                    "hardBounced",
                    "softBounced",
                    "complained",
                  ] satisfies ReadonlyArray<keyof typeof delivery>
                ).map((key) => (
                  <div key={key}>
                    <dt>{m.metrics[key]}</dt>
                    <dd>{delivery[key] ? 1 : 0}</dd>
                  </div>
                ))}
              </dl>
              <h3>{m.attempts}</h3>
              <Records
                items={p.inspection?.attempts}
                m={m}
                columns={[
                  { field: "generation", headerName: m.generation },
                  { field: "attempt", headerName: m.attempts },
                  {
                    colId: "outcome",
                    headerName: m.outcome,
                    cellRenderer: ({ data }) =>
                      data.outcome ? m.outcomes[data.outcome._tag] : m.pending,
                  },
                  {
                    colId: "reason",
                    headerName: m.reason,
                    cellRenderer: ({ data }) => {
                      const outcome = data.outcome;
                      if (!outcome) return "—";
                      switch (outcome._tag) {
                        case "Sent":
                          return outcome.providerMessageId ?? "—";
                        case "Skipped":
                          return outcome.reason;
                        case "RetryableFailure":
                        case "PermanentFailure":
                        case "Unavailable":
                          return outcome.message;
                      }
                    },
                  },
                  {
                    colId: "started",
                    headerName: m.started,
                    cellRenderer: ({ data }) => date(data.startedAt),
                  },
                  {
                    colId: "completed",
                    headerName: m.completed,
                    cellRenderer: ({ data }) => date(data.completedAt),
                  },
                ]}
              />
              <Button
                onClick={() => {
                  p.onCloseInspection();
                  p.onDeliveryFeedback(delivery.id);
                }}
              >
                {m.views.feedback}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={p.onRefresh}>
            {m.refresh}
          </Button>
          <Button variant="outline" onClick={p.onCloseInspection}>
            {m.close}
          </Button>
        </DialogContent>
      </Dialog>
      {manage !== undefined && (
        <SuppressionDialog
          record={manage}
          m={m}
          onAdd={p.onAddSuppression}
          onRemove={p.onRemoveSuppression}
          onClose={() => setManage(undefined)}
        />
      )}
    </section>
  );
};
