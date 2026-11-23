import type * as S from "@krak-stack/notifications/admin/delivery.schema";
import { CodeBlock } from "@krak-stack/registry/code-block";
import type {
  DataTableColDef,
  DataTablePublicState,
  DataTableRowAction,
} from "@krak-stack/registry/data-table";
import { useKrakstackLocale } from "@krak-stack/registry/krakstack-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, type ReactNode } from "react";
import { useAtomValue } from "@effect/atom-react";
import { Effect } from "effect";
import { FetchHttpClient } from "effect/http";
import { HttpApiClient } from "effect/http-api";
import { AsyncResult, Atom } from "effect/reactivity";
import { DeliveryPreviewApi } from "@krak-stack/notifications/admin/delivery-preview.api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
export interface NotificationDeliverySelection {
  readonly id: string;
  readonly view: "details" | "preview";
}

interface DeliveryActivityProps extends ReadState {
  readonly messages?: NotificationDeliveryActivityMessages;
  readonly activity?: typeof S.AdminDeliveryPage.Type;
  readonly total: number;
  readonly onInspect?: (id: string) => void;
  readonly onPreview?: (id: string) => void;
  readonly selection?: NotificationDeliverySelection;
  readonly onSelectionChange?: (
    selection: NotificationDeliverySelection | undefined,
  ) => void;
  readonly details?: Omit<NotificationDeliveryDetailsProps, "messages">;
  readonly onRefresh?: () => void;
  readonly tableOptions?: NotificationTableOptions<typeof S.AdminDelivery.Type>;
}
export type NotificationDeliveryActivityProps = DeliveryActivityProps &
  (
    | {
        readonly state: DataTablePublicState;
        readonly onStateChange: (state: DataTablePublicState) => void;
        readonly table?: never;
        readonly onTable?: never;
      }
    | {
        readonly state?: never;
        readonly onStateChange?: never;
        /** @deprecated Use state. */
        readonly table: DataTablePublicState;
        /** @deprecated Use onStateChange. */
        readonly onTable: (state: DataTablePublicState) => void;
      }
  );
export type NotificationDeliveryMetric = keyof typeof S.DeliveryOverview.Type;
export interface NotificationDeliveryOverviewProps extends ReadState {
  readonly messages?: NotificationDeliveryOverviewMessages;
  readonly overview?: typeof S.DeliveryOverview.Type;
  readonly variant?: "cards" | "rows";
  readonly groups?: ReadonlyArray<{
    readonly label?: string;
    readonly metrics: ReadonlyArray<NotificationDeliveryMetric>;
  }>;
}
export interface NotificationAttemptHistoryProps extends ReadState {
  readonly messages?: NotificationAttemptHistoryMessages;
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
  readonly messages?: NotificationDeliveryDetailsMessages;
  readonly inspection?: typeof S.AdminDeliveryInspection.Type;
  readonly onContact?: (id: string) => void;
  readonly onCampaign?: (id: string) => void;
}
export interface NotificationDeliveriesProps {
  readonly messages?: NotificationDeliveryMessages;
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
  readonly onPreview?: (id: string) => void;
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

type DeliveryMessages = Omit<NotificationDeliveryMessages, "common"> &
  NotificationDeliveryActivityMessages &
  NotificationDeliveryDetailsMessages &
  NotificationDeliveryOverviewMessages & {
    readonly common: Pick<SendOperationsMessages, "refresh" | "close"> & {
      readonly preview: string;
      readonly views: Pick<SendOperationsMessages["views"], "activity">;
    };
    readonly dialog: {
      readonly details: string;
      readonly detailsDescription: string;
      readonly preview: string;
      readonly previewDescription: string;
      readonly subject: string;
      readonly from: string;
      readonly loading: string;
      readonly failed: string;
      readonly unavailable: string;
      readonly deliveryInput: string;
    };
  };

const messages = {
  en: {
    dialog: {
      details: "Delivery details",
      detailsDescription:
        "Review the delivery status, provider, and send attempts for this email.",
      preview: "Email preview",
      previewDescription:
        "View the saved email subject and body. Links and remote images are disabled.",
      subject: "Subject",
      from: "From",
      loading: "Loading email preview…",
      failed: "Could not load the email preview.",
      unavailable:
        "Email preview unavailable. No supported email body was saved for this delivery.",
      deliveryInput: "Delivery input",
    },
    title: "Staff email administration",
    description:
      "Read-only access to email deliveries in your authorized scopes. Acceptance does not confirm delivery or reading.",
    source: "Publication source",
    sources: {
      all: "All authorized emails",
      contacts: "Legacy contact publications",
      engine: "Native publications",
    },
    recipientUserId: "Recipient account",
    organizationId: "Organization",
    workspaceId: "Workspace",
    template: "Template",
    purposes: {
      transactional: "Transactional",
      notification: "Notification",
      marketing: "Marketing",
    },
    eventKey: "Event key",
    references: "Authorized domain references",
    feedbackNotice:
      "Confirmation and bounce counts cover only deliveries with configured provider feedback. Missing feedback does not prove delivery or rule out bounces.",
    feedbackCovered: "Emails covered by feedback reconciliation",
    feedbackUnavailable: "Emails without feedback coverage",
    common: {
      refresh: "Refresh",
      close: "Close",
      views: { overview: "Overview", activity: "Delivery activity" },
      metrics: {
        total: "Total publications",
        queued: "Queued",
        processing: "Processing",
        retrying: "Retrying or deferred",
        accepted: "Provider accepted",
        failed: "Failed",
        suppressed: "Suppressed",
        cancelled: "Cancelled",
        confirmed: "Provider confirmed delivery",
        hardBounced: "Hard bounced",
        softBounced: "Soft bounced",
        complained: "Complaints",
      },
      email: "Email",
      purpose: "Purpose",
      status: "Status",
      statuses: {
        queued: "Queued",
        processing: "Processing",
        retrying: "Retrying or deferred",
        sent: "Provider accepted",
        failed: "Failed",
        suppressed: "Suppressed",
        cancelled: "Cancelled",
      },
      attempts: "Provider attempts",
      provider: "Provider",
      created: "Created",
      accepted: "Provider accepted",
      inspect: "View delivery",
      preview: "Preview email",
      empty: "No matching records.",
      loading: "Loading deliveries…",
      generation: "Queue generation",
      outcome: "Outcome",
      outcomes: {
        Sent: "Provider accepted",
        RetryableFailure: "Retryable failure",
        PermanentFailure: "Permanent failure",
        Unavailable: "Unavailable",
        Skipped: "Skipped / deferred",
      },
      pending: "Pending",
      reason: "Reason / diagnostic",
      started: "Started",
      completed: "Completed",
      scheduled: "Scheduled for",
      id: "ID",
      providerMessageId: "Provider message ID",
      updated: "Updated",
      contactId: "Contact ID",
      campaign: "Campaign",
    },
  },
  fr: {
    dialog: {
      details: "Détails de l’envoi",
      detailsDescription:
        "Consultez l’état de l’envoi, le fournisseur et les tentatives d’envoi de ce courriel.",
      preview: "Aperçu du courriel",
      previewDescription:
        "Consultez l’objet et le contenu enregistrés du courriel. Les liens et les images distantes sont désactivés.",
      subject: "Objet",
      from: "Expéditeur",
      loading: "Chargement de l’aperçu du courriel…",
      failed: "Impossible de charger l’aperçu du courriel.",
      unavailable:
        "Aperçu indisponible. Aucun contenu de courriel pris en charge n’a été enregistré pour cet envoi.",
      deliveryInput: "Données d’entrée de l’envoi",
    },
    title: "Administration des courriels par le personnel",
    description:
      "Accès en lecture seule aux envois de courriels dans vos périmètres autorisés. L’acceptation ne confirme ni la livraison ni la lecture.",
    source: "Source de publication",
    sources: {
      all: "Tous les courriels autorisés",
      contacts: "Anciennes publications de contacts",
      engine: "Publications natives",
    },
    recipientUserId: "Compte destinataire",
    organizationId: "Organisation",
    workspaceId: "Espace de travail",
    template: "Modèle",
    purposes: {
      transactional: "Transactionnel",
      notification: "Notification",
      marketing: "Marketing",
    },
    eventKey: "Clé d’événement",
    references: "Références métier autorisées",
    feedbackNotice:
      "Les confirmations et rebonds concernent uniquement les envois dont les retours du fournisseur sont configurés. L’absence de retours ne prouve pas la livraison et n’exclut pas les rebonds.",
    feedbackCovered: "Courriels couverts par le rapprochement des retours",
    feedbackUnavailable: "Courriels sans couverture des retours",
    common: {
      refresh: "Actualiser",
      close: "Fermer",
      views: {
        overview: "Vue d’ensemble",
        activity: "Activité des livraisons",
      },
      metrics: {
        total: "Publications totales",
        queued: "En file d’attente",
        processing: "En traitement",
        retrying: "Nouvelle tentative ou envoi différé",
        accepted: "Accepté par le fournisseur",
        failed: "Échec",
        suppressed: "Bloqué",
        cancelled: "Annulé",
        confirmed: "Livraison confirmée par le fournisseur",
        hardBounced: "Rebond définitif",
        softBounced: "Rebond temporaire",
        complained: "Plaintes",
      },
      email: "Courriel",
      purpose: "Finalité",
      status: "État",
      statuses: {
        queued: "En file d’attente",
        processing: "En traitement",
        retrying: "Nouvelle tentative ou envoi différé",
        sent: "Accepté par le fournisseur",
        failed: "Échec",
        suppressed: "Bloqué",
        cancelled: "Annulé",
      },
      attempts: "Tentatives fournisseur",
      provider: "Fournisseur",
      created: "Création",
      accepted: "Accepté par le fournisseur",
      inspect: "Voir la livraison",
      preview: "Prévisualiser le courriel",
      empty: "Aucun enregistrement correspondant.",
      loading: "Chargement des livraisons…",
      generation: "Génération de la file",
      outcome: "Résultat",
      outcomes: {
        Sent: "Accepté par le fournisseur",
        RetryableFailure: "Échec réessayable",
        PermanentFailure: "Échec permanent",
        Unavailable: "Indisponible",
        Skipped: "Ignoré / différé",
      },
      pending: "En attente",
      reason: "Motif / diagnostic",
      started: "Début",
      completed: "Fin",
      scheduled: "Envoi prévu",
      id: "ID",
      providerMessageId: "ID du message fournisseur",
      updated: "Mise à jour",
      contactId: "ID du contact",
      campaign: "Campagne",
    },
  },
} as const satisfies Record<"en" | "fr", DeliveryMessages>;

const useDeliveryMessages = (): DeliveryMessages =>
  useKrakstackLocale().toLowerCase().split("-")[0] === "fr"
    ? messages.fr
    : messages.en;

const activityColumnVisibility = {
  source: false,
  recipientUserId: false,
  organizationId: false,
  workspaceId: false,
  template: false,
  purpose: false,
  sentAt: false,
} satisfies Partial<Record<keyof typeof S.AdminDelivery.Type, boolean>>;

export const NotificationDeliveryOverview = (
  p: NotificationDeliveryOverviewProps,
) => {
  const locale = useKrakstackLocale();
  const defaults = useDeliveryMessages();
  const m = p.messages ?? defaults;
  const labels = {
    ...m.common.metrics,
    feedbackCovered: m.feedbackCovered,
    feedbackUnavailable: m.feedbackUnavailable,
  };
  if (p.error) return <p role="alert">{p.error}</p>;
  if (!p.overview)
    return p.pending ? <p role="status">{m.common.loading}</p> : null;
  const overview = p.overview;
  return (
    <div className="space-y-4" aria-busy={p.pending}>
      <p>{m.feedbackNotice}</p>
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

const ProviderBadge = ({ provider }: { provider: string | null }) =>
  provider ? <Badge variant="secondary">{provider}</Badge> : "—";

const deliveryColumns = (
  m: NotificationDeliveryActivityMessages,
): DataTableColDef<typeof S.AdminDelivery.Type>[] => {
  const c = m.common;
  return [
    { field: "recipientAddress", headerName: c.email },
    { field: "eventKey", headerName: m.eventKey },
    {
      field: "status",
      headerName: c.status,
      filterOptions: Object.entries(c.statuses).map(([value, label]) => ({
        value,
        label,
      })),
      cellRenderer: ({ data }) => c.statuses[data.status],
    },
    {
      field: "provider",
      headerName: c.provider,
      cellRenderer: ({ data }) => <ProviderBadge provider={data.provider} />,
    },
    { field: "attempts", headerName: c.attempts, type: "number" },
    { field: "createdAt", headerName: c.created, type: "date" },
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
    { field: "sentAt", headerName: c.accepted, type: "date" },
  ];
};

export const NotificationDeliveryActivity = (
  p: NotificationDeliveryActivityProps,
) => {
  const defaults = useDeliveryMessages();
  const m = p.messages ?? defaults;
  const {
    activity,
    error,
    onInspect,
    onPreview,
    onRefresh,
    onSelectionChange,
    pending,
    selection,
    tableOptions,
    total,
  } = p;
  const state = p.state ?? p.table;
  const onStateChange = p.onStateChange ?? p.onTable;
  const previewLabel = defaults.common.preview;
  // The table rebuilds its model when its config changes. Dialog state isn't
  // part of that config, including while a delivery's details are loading.
  const tableContent = useMemo(() => {
    const c = m.common;
    const inspect =
      onInspect ??
      (onSelectionChange
        ? (id: string) => onSelectionChange({ id, view: "details" })
        : undefined);
    const preview =
      onPreview ??
      (onSelectionChange
        ? (id: string) => onSelectionChange({ id, view: "preview" })
        : undefined);
    const columns = deliveryColumns(m);
    const actions: DataTableRowAction<typeof S.AdminDelivery.Type>[] = [];
    if (inspect)
      actions.push({
        id: "inspect",
        name: c.inspect,
        onClick: (row) => inspect(row.id),
      });
    if (preview)
      actions.push({
        id: "preview",
        name: previewLabel,
        onClick: (row) => preview(row.id),
      });
    return (
      <DataTable
        notificationTable="delivery-activity"
        rowData={error ? [] : (activity?.items ?? [])}
        columnDefs={tableOptions?.columns?.(columns) ?? columns}
        initialState={{
          ...tableOptions?.initialState,
          columnVisibility: {
            ...activityColumnVisibility,
            ...tableOptions?.initialState?.columnVisibility,
          },
        }}
        className={tableOptions?.className}
        getRowId={(row) => row.id}
        state={state}
        onStateChange={onStateChange}
        status={{ loading: pending, error }}
        features={{
          pagination: { mode: "server", rowCount: error ? 0 : total },
          rowActions: actions.length > 0 ? { items: actions } : false,
          refresh: onRefresh,
        }}
        messages={{
          en: { empty: c.empty, loading: c.loading },
          fr: { empty: c.empty, loading: c.loading },
        }}
      />
    );
  }, [
    activity,
    error,
    m,
    onInspect,
    onPreview,
    onRefresh,
    onSelectionChange,
    onStateChange,
    pending,
    previewLabel,
    state,
    tableOptions,
    total,
  ]);
  return (
    <>
      {tableContent}
      {selection?.view === "details" && onSelectionChange && !error && (
        <NotificationDeliveryDialog
          key={selection.id}
          onClose={() => onSelectionChange(undefined)}
          details={<NotificationDeliveryDetails {...p.details} />}
        />
      )}
      {selection?.view === "preview" && onSelectionChange && !error && (
        <NotificationEmailPreviewDialog
          key={selection.id}
          id={selection.id}
          onClose={() => onSelectionChange(undefined)}
        />
      )}
    </>
  );
};

export const NotificationAttemptHistory = (
  p: NotificationAttemptHistoryProps,
) => {
  const defaults = useDeliveryMessages();
  const c = p.messages ?? defaults.common;
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
  const defaults = useDeliveryMessages();
  const m = p.messages ?? defaults;
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
    {
      label: c.provider,
      value: <ProviderBadge provider={delivery.provider} />,
    },
    { label: c.providerMessageId, value: delivery.providerMessageId },
    {
      label: c.attempts,
      value: `${delivery.attempts} / ${delivery.maxAttempts}`,
    },
    { label: c.updated, value: date(delivery.updatedAt) },
  ];
  return (
    <div className="flex flex-col gap-5" aria-busy={p.pending}>
      {[
        { label: m.sections?.summary ?? c.views.overview, fields: summary },
        { label: m.sections?.sending ?? c.provider, fields: sending },
      ].map((section) => (
        <section
          key={section.label}
          aria-label={section.label}
          className="flex flex-col gap-3 rounded-lg border p-4"
        >
          <h2 className="font-medium">{section.label}</h2>
          <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.label} className="min-w-0">
                <dt className="text-muted-foreground text-xs">{field.label}</dt>
                <dd className="mt-0.5 wrap-anywhere">{field.value ?? "—"}</dd>
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
      <section aria-label={c.attempts} className="flex min-w-0 flex-col gap-3">
        <h2 className="font-medium">{c.attempts}</h2>
        <NotificationAttemptHistory messages={c} attempts={attempts} />
      </section>
      {p.inspection.input && <DeliveryInputJson input={p.inspection.input} />}
    </div>
  );
};

export interface NotificationDeliveryDialogProps {
  readonly onClose: () => void;
  readonly details: ReactNode;
}

const DeliveryDialog = ({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) => (
  <Dialog
    open
    onOpenChange={(open) => {
      if (!open) onClose();
    }}
  >
    <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 text-sm sm:max-w-3xl">
      <DialogHeader className="shrink-0 border-b px-5 py-4 pe-14 text-start sm:px-6 sm:pe-14">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
        {children}
      </div>
    </DialogContent>
  </Dialog>
);

export const NotificationDeliveryDialog = ({
  onClose,
  details,
}: NotificationDeliveryDialogProps) => {
  const { dialog: labels } = useDeliveryMessages();
  return (
    <DeliveryDialog
      title={labels.details}
      description={labels.detailsDescription}
      onClose={onClose}
    >
      {details}
    </DeliveryDialog>
  );
};

export const NotificationEmailPreviewDialog = ({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) => {
  const { dialog: labels } = useDeliveryMessages();
  return (
    <DeliveryDialog
      title={labels.preview}
      description={labels.previewDescription}
      onClose={onClose}
    >
      <SavedEmailPreview id={id} />
    </DeliveryDialog>
  );
};

export interface NotificationEmailPreviewProps {
  readonly pending?: boolean;
  readonly failed?: boolean;
  /** The host must authorize the read and sanitize HTML before supplying it. */
  readonly preview?: {
    readonly from?: string;
    readonly fromName?: string;
    readonly subject: string;
    readonly html: string | null;
    readonly text: string | null;
  } | null;
}

const previewPolicy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">`;

export const NotificationEmailPreview = ({
  pending,
  failed,
  preview,
}: NotificationEmailPreviewProps) => {
  const { dialog: labels } = useDeliveryMessages();
  if (failed) return <p role="alert">{labels.failed}</p>;
  if (pending) return <p role="status">{labels.loading}</p>;
  if (!preview) return <p>{labels.unavailable}</p>;
  const { from, fromName } = preview;
  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-2">
        {(from || fromName) && (
          <div>
            <dt className="text-muted-foreground">{labels.from}</dt>
            <dd className="wrap-anywhere">
              {fromName && from ? `${fromName} <${from}>` : fromName || from}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">{labels.subject}</dt>
          <dd className="font-medium wrap-anywhere">{preview.subject}</dd>
        </div>
      </dl>
      {preview.html ? (
        <iframe
          title={labels.preview}
          sandbox=""
          referrerPolicy="no-referrer"
          className="h-[55dvh] w-full rounded-md border bg-white"
          srcDoc={`${previewPolicy}${preview.html}`}
        />
      ) : (
        <p className="rounded-md border p-4 break-words whitespace-pre-wrap">
          {preview.text}
        </p>
      )}
    </div>
  );
};

function SavedEmailPreview({ id }: { id: string }) {
  // This query belongs to this dialog instance, not a cross-session cache.
  const atom = useMemo(
    () =>
      Atom.make(
        Effect.gen(function* () {
          const client = yield* HttpApiClient.make(DeliveryPreviewApi, {
            baseUrl: globalThis.location.origin,
          });
          return yield* client.deliveryPreview.get({ params: { id } });
        }).pipe(
          Effect.catchTag("NotFound", () => Effect.succeed(null)),
          Effect.provide(FetchHttpClient.layer),
        ),
      ),
    [id],
  );
  const result = useAtomValue(atom);
  return (
    <NotificationEmailPreview
      preview={AsyncResult.isSuccess(result) ? result.value : undefined}
      pending={AsyncResult.isInitial(result)}
      failed={AsyncResult.isFailure(result)}
    />
  );
}

const DeliveryInputJson = ({
  input,
}: {
  input: NonNullable<(typeof S.AdminDeliveryInspection.Type)["input"]>;
}) => {
  const { dialog: labels } = useDeliveryMessages();
  return (
    <Collapsible className="rounded-lg border p-2">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="group w-full justify-between" />
        }
      >
        {labels.deliveryInput}
        <ChevronDownIcon
          aria-hidden="true"
          className="group-data-panel-open:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pt-2 pb-2">
        <div
          className="[&_[data-code-theme]>div:has(>pre)]:max-h-[min(16rem,40dvh)]"
          role="region"
          aria-label={labels.deliveryInput}
        >
          <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

/** Backwards-compatible default composition; hosts can mount the sections alone. */
export const NotificationDeliveries = (p: NotificationDeliveriesProps) => {
  const defaults = useDeliveryMessages();
  const m = p.messages ?? defaults;
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
            state={p.table}
            total={p.total}
            onStateChange={p.onTable}
            onInspect={p.onInspect}
            onPreview={p.onPreview}
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
        <DialogContent className="max-h-[90vh] overflow-auto text-sm sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{defaults.dialog.details}</DialogTitle>
            <DialogDescription>
              {defaults.dialog.detailsDescription}
            </DialogDescription>
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
