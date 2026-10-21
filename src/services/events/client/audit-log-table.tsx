import type { ReactNode } from "react";
import { ListFilterIcon } from "lucide-react";
import {
  DataTable,
  DataTableReferenceCell,
  type DataTableColDef,
  type DataTableStatus,
  type DataTableReferenceItem,
} from "@/components/ui/data-table";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import {
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
} from "@/components/ui/menubar";
import type { EventLogRecord, EventQuery } from "../schema";
import { eventTextAttribute } from "../record";

const translations = {
  en: {
    title: "Activity history",
    event: "Action",
    allEvents: "All actions",
    time: "Time",
    action: "Action",
    target: "Target",
    actor: "Actor",
    method: "Method",
    actorMember: "Member",
    impersonatedBy: "Impersonated by",
    actorOrganization: "Organization",
    methodApiKey: "API Key",
    methodSession: "User session",
    methodUnknown: "Unknown",
  },
  fr: {
    title: "Historique d’activité",
    event: "Action",
    allEvents: "Toutes les actions",
    time: "Date",
    action: "Action",
    target: "Cible",
    actor: "Acteur",
    method: "Méthode",
    actorMember: "Membre",
    impersonatedBy: "Identité empruntée par",
    actorOrganization: "Organisation",
    methodApiKey: "Clé API",
    methodSession: "Session utilisateur",
    methodUnknown: "Inconnue",
  },
};
export type AuditLogMessages = typeof translations.en;
export type AuditLogTableProps = DataTableStatus & {
  /** Full application-owned event catalog, with localized display labels. */
  events?: readonly { value: string; label: string }[];
  state?: EventQuery;
  onStateChange?: (state: EventQuery) => void;
  entries: readonly EventLogRecord[];
  /** Total matching records from the query response; paging lives in state. */
  rowCount: number;
  /** Display time zone for the dateTime column. Defaults to America/New_York. */
  timeZone?: string;
  /** Overrides the shared KrakstackProvider locale when supplied. */
  locale?: string;
  messages?: Readonly<Record<string, Partial<AuditLogMessages>>>;
  renderAction?: (entry: EventLogRecord) => ReactNode;
};

export const AuditLogTable = ({
  entries,
  events = [],
  rowCount,
  timeZone = "America/New_York",
  locale: localeOverride,
  messages,
  renderAction,
  state,
  onStateChange,
  ...status
}: AuditLogTableProps) => {
  const locale = useKrakstackLocale(localeOverride);
  const base = locale.split("-")[0];
  const labels = {
    ...translations.en,
    ...(base === "fr" ? translations.fr : translations.en),
    ...messages?.[base],
    ...messages?.[locale],
  };
  const methods = new Map([
    ["session", labels.methodSession],
    ["api_key", labels.methodApiKey],
  ]);
  const getActor = (entry: EventLogRecord): DataTableReferenceItem => {
    const type = eventTextAttribute(entry, "app.actor.type");
    const id =
      eventTextAttribute(entry, "app.actor.id") ??
      eventTextAttribute(entry, "user.id");
    if (type === "organization") {
      return { label: labels.actorOrganization, description: id };
    }
    if (type === "user" || eventTextAttribute(entry, "user.id") !== null) {
      const fullName = eventTextAttribute(entry, "user.full_name");
      const name = eventTextAttribute(entry, "user.name");
      const email = eventTextAttribute(entry, "user.email");
      return {
        label: fullName || name || email || labels.actorMember,
        description: fullName || name ? email || id : id,
      };
    }
    return { label: type ?? labels.actor, description: id };
  };
  const columns: DataTableColDef<EventLogRecord>[] = [
    {
      colId: "time",
      headerName: labels.time,
      type: "dateTime",
      typeOptions: { timeZone },
      valueGetter: ({ data }) =>
        new Date(Number(BigInt(data.timeUnixNano) / 1_000_000n)),
    },
    {
      field: "eventName",
      headerName: labels.action,
      cellRenderer: ({ data }) =>
        renderAction?.(data) ??
        events.find((event) => event.value === data.eventName)?.label ??
        data.eventName,
    },
    {
      colId: "record",
      headerName: labels.target,
      type: "reference",
      typeOptions: {
        imageVariant: "square",
        getItem: (entry) => {
          const id = eventTextAttribute(entry, "app.audit.target.id");
          const name = eventTextAttribute(entry, "app.audit.target.name");
          const type = eventTextAttribute(entry, "app.audit.target.type");
          return id === null
            ? null
            : {
                label: name && name !== id ? name : type || labels.target,
                description:
                  name && name !== id && type ? `${type} · ${id}` : id,
              };
        },
      },
    },
    {
      colId: "actor",
      headerName: labels.actor,
      sortable: false,
      type: "reference",
      typeOptions: {
        getItem: getActor,
      },
      cellRenderer: ({ data }) => {
        const impersonatorId = eventTextAttribute(
          data,
          "app.auth.impersonator.id",
        );
        return (
          <div className="flex min-w-0 flex-col gap-1">
            <DataTableReferenceCell item={getActor(data)} />
            {impersonatorId !== null ? (
              <span className="text-muted-foreground text-xs">
                {labels.impersonatedBy}: {impersonatorId}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      colId: "method",
      headerName: labels.method,
      sortable: false,
      valueGetter: ({ data }) => {
        const method = eventTextAttribute(data, "app.auth.method");
        return method === null
          ? labels.methodUnknown
          : (methods.get(method) ?? labels.methodUnknown);
      },
    },
  ];
  return (
    <section aria-label={labels.title} className="flex flex-col gap-4">
      <DataTable
        locale={locale}
        status={status}
        state={state}
        onStateChange={
          onStateChange
            ? (next) =>
                onStateChange({
                  ...next,
                  eventName: state?.eventName,
                })
            : undefined
        }
        features={{
          toolbar:
            state && onStateChange
              ? {
                  items: (
                    <MenubarMenu>
                      <MenubarTrigger>
                        <ListFilterIcon
                          aria-hidden="true"
                          data-icon="inline-start"
                        />
                        {labels.event}
                        {state.eventName
                          ? `: ${events.find((event) => event.value === state.eventName)?.label ?? state.eventName}`
                          : ""}
                      </MenubarTrigger>
                      <MenubarContent className="w-80">
                        <MenubarGroup>
                          <MenubarItem
                            onClick={() =>
                              onStateChange({
                                ...state,
                                eventName: undefined,
                                page: 0,
                              })
                            }
                          >
                            {labels.allEvents}
                          </MenubarItem>
                          {events.map((event) => (
                            <MenubarItem
                              key={event.value}
                              onClick={() =>
                                onStateChange({
                                  ...state,
                                  eventName: event.value,
                                  page: 0,
                                })
                              }
                            >
                              {event.label}
                            </MenubarItem>
                          ))}
                        </MenubarGroup>
                      </MenubarContent>
                    </MenubarMenu>
                  ),
                }
              : false,
          pagination: { mode: "server", rowCount },
        }}
        columnDefs={columns}
        rowData={entries}
        getRowId={(entry) =>
          eventTextAttribute(entry, "log.record.uid") ??
          `${entry.timeUnixNano}:${entry.eventName}`
        }
      />
    </section>
  );
};
