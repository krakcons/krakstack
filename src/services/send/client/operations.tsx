import { useState } from "react";
import { Effect, Schema } from "effect";
import * as S from "@krak-stack/send/operations.schema";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColDef } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  readonly onNext?: () => void;
  readonly onPrevious?: () => void;
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
  toolbar: false,
  search: false,
  filtering: false,
  sorting: false,
  pagination: false,
  columnVisibility: false,
} as const;
const Records = <T extends { readonly id: string }>({
  items,
  columns,
  m,
}: {
  items: ReadonlyArray<T> | undefined;
  columns: DataTableColDef<T>[];
  m: SendOperationsMessages;
}) =>
  items ? (
    items.length ? (
      <DataTable
        rowData={items}
        columnDefs={columns}
        getRowId={(row) => row.id}
        features={tableFeatures}
      />
    ) : (
      <p>{m.empty}</p>
    )
  ) : null;

// Keep filter selects controlled without modifying registry-managed form fields.
const FilterSelect = <T extends Schema.ConstraintDecoder<unknown, never>>({
  schema,
  value,
  onChange,
  name,
  label,
  options,
}: {
  schema: T;
  value: T["Type"];
  onChange: (value: T["Type"]) => void;
  name: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}) => (
  <div className="space-y-2">
    <label htmlFor={name}>{label}</label>
    <Select
      items={[...options]}
      value={value}
      onValueChange={(raw) =>
        onChange(Schema.decodeUnknownSync(schema)(raw ?? ""))
      }
    >
      <SelectTrigger id={name}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const FiltersForm = ({
  filters,
  view,
  m,
  onFilters,
}: {
  filters: Filters;
  view: View;
  m: SendOperationsMessages;
  onFilters: (filters: Filters) => void;
}) => {
  const defaultValues: typeof S.OperationsFilterForm.Encoded = {
    search: filters.search ?? "",
    since: filters.since?.toISOString() ?? "",
    until: filters.until?.toISOString() ?? "",
    campaignId: filters.campaignId ?? "",
    status: filters.status ?? "",
    kind: filters.kind ?? "",
    correlation: filters.correlation ?? "",
    state: filters.state ?? "active",
    recipientStatus: filters.recipientStatus ?? "",
  };
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: Schema.toStandardSchemaV1(S.OperationsFilterForm) },
    onSubmit: async ({ value }) => {
      const v = await Effect.runPromise(
        Schema.decodeEffect(S.OperationsFilterForm)(value),
      );
      onFilters({
        search: v.search || undefined,
        since: v.since || undefined,
        until: v.until || undefined,
        campaignId: v.campaignId || undefined,
        status: v.status || undefined,
        kind: v.kind || undefined,
        correlation: v.correlation || undefined,
        state: v.state,
        recipientStatus: v.recipientStatus || undefined,
        deliveryId: undefined,
        contactId: undefined,
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
        {view !== "overview" && (
          <form.AppField name="search">
            {(field) => <field.TextField label={m.search} />}
          </form.AppField>
        )}
        {view !== "recipients" && (
          <>
            <form.AppField name="since">
              {(field) => <field.TextField label={m.since} />}
            </form.AppField>
            <form.AppField name="until">
              {(field) => <field.TextField label={m.until} />}
            </form.AppField>
          </>
        )}
        {(view === "activity" || view === "recipients") && (
          <form.AppField name="campaignId">
            {(field) => <field.TextField label={m.campaignId} />}
          </form.AppField>
        )}
        {view === "activity" && (
          <form.AppField name="status">
            {(field) => (
              <FilterSelect
                schema={S.OperationsFilterForm.fields.status}
                name={field.name}
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                label={m.status}
                options={[
                  { value: "", label: m.all },
                  ...Object.entries(m.statuses).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ]}
              />
            )}
          </form.AppField>
        )}
        {view === "feedback" && (
          <>
            <form.AppField name="kind">
              {(field) => (
                <FilterSelect
                  schema={S.OperationsFilterForm.fields.kind}
                  name={field.name}
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  label={m.views.feedback}
                  options={[
                    { value: "", label: m.all },
                    ...Object.entries(m.kinds).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                />
              )}
            </form.AppField>
            <form.AppField name="correlation">
              {(field) => (
                <FilterSelect
                  schema={S.OperationsFilterForm.fields.correlation}
                  name={field.name}
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  label={m.correlation}
                  options={[
                    { value: "", label: m.all },
                    { value: "pending", label: m.pending },
                    { value: "applied", label: m.applied },
                  ]}
                />
              )}
            </form.AppField>
          </>
        )}
        {view === "suppressions" && (
          <form.AppField name="state">
            {(field) => (
              <FilterSelect
                schema={S.OperationsFilterForm.fields.state}
                name={field.name}
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                label={m.status}
                options={[
                  { value: "active", label: m.active },
                  { value: "expired", label: m.expired },
                  { value: "all", label: m.all },
                ]}
              />
            )}
          </form.AppField>
        )}
        {view === "recipients" && (
          <form.AppField name="recipientStatus">
            {(field) => (
              <FilterSelect
                schema={S.OperationsFilterForm.fields.recipientStatus}
                name={field.name}
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                label={m.status}
                options={[
                  { value: "", label: m.all },
                  ...Object.entries(m.recipientStatuses).map(
                    ([value, label]) => ({ value, label }),
                  ),
                ]}
              />
            )}
          </form.AppField>
        )}
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
    { field: "attempts", headerName: m.attempts },
    { field: "provider", headerName: m.provider },
    { field: "errorMessage", headerName: m.reason },
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
      cellRenderer: ({ data }) => m.kinds[data.kind],
    },
    {
      colId: "correlation",
      headerName: m.correlation,
      cellRenderer: ({ data }) => (data.appliedAt ? m.applied : m.pending),
    },
    { field: "provider", headerName: m.provider },
    { field: "providerMessageId", headerName: m.providerMessageId },
    { field: "eventId", headerName: m.eventId },
    {
      colId: "occurred",
      headerName: m.occurred,
      cellRenderer: ({ data }) => date(data.occurredAt),
    },
    {
      colId: "received",
      headerName: m.received,
      cellRenderer: ({ data }) => date(data.receivedAt),
    },
    {
      colId: "checked",
      headerName: m.checked,
      cellRenderer: ({ data }) => date(data.checkedAt),
    },
    {
      colId: "applied",
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
        colId: "active",
        headerName: m.status,
        cellRenderer: ({ data }) => (data.active ? m.active : m.expired),
      },
      {
        colId: "created",
        headerName: m.created,
        cellRenderer: ({ data }) => date(data.createdAt),
      },
      {
        colId: "expires",
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
      cellRenderer: ({ data }) => (data.action === "add" ? m.add : m.remove),
    },
    { field: "reason", headerName: m.reason },
    { field: "previousReason", headerName: m.previousReason },
    { field: "actor", headerName: m.actor },
    {
      colId: "occurred",
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
  const next =
    view === "activity"
      ? p.activity?.nextCursor
      : view === "feedback"
        ? p.feedback?.nextCursor
        : view === "suppressions"
          ? p.suppressions?.nextCursor
          : view === "audit"
            ? p.audit?.nextCursor
            : p.recipients?.nextCursor;
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
      <FiltersForm
        key={`${view}:${JSON.stringify(p.filters)}`}
        filters={p.filters}
        view={view}
        m={m}
        onFilters={p.onFilters}
      />
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
        <Records items={p.activity?.items} columns={activityColumns} m={m} />
      )}
      {view === "feedback" && (
        <Records items={p.feedback?.items} columns={feedbackColumns} m={m} />
      )}
      {view === "suppressions" && (
        <>
          <Button onClick={() => setManage(null)}>{m.addSuppression}</Button>
          <Records
            items={p.suppressions?.items}
            columns={suppressionColumns}
            m={m}
          />
        </>
      )}
      {view === "audit" && (
        <Records
          items={p.audit?.items.map((row) => ({ ...row, id: row.requestId }))}
          columns={auditColumns}
          m={m}
        />
      )}
      {view === "recipients" &&
        (p.filters.campaignId ? (
          <Records
            items={p.recipients?.items}
            columns={recipientColumns}
            m={m}
          />
        ) : (
          <p>{m.recipientsHint}</p>
        ))}
      {view !== "overview" && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!p.onPrevious || p.pending}
            onClick={p.onPrevious}
          >
            {m.previous}
          </Button>
          <Button
            variant="outline"
            disabled={!next || !p.onNext || p.pending}
            onClick={p.onNext}
          >
            {m.next}
          </Button>
        </div>
      )}
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
