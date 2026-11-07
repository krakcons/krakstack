import { useState } from "react";
import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import {
  initialTableState,
  type TableState,
} from "@krak-stack/notifications/admin/table.schema";
import type * as S from "@krak-stack/notifications/admin/operations.schema";
import { Button } from "@/components/ui/button";
import { KrakstackProvider } from "@/components/ui/krakstack-provider";
import * as m from "@/paraglide/messages";
import { makeSendContactAtoms } from "./atom";
import { makeSendCampaignAtoms } from "./campaign.atom";
import { makeSendOperationsAtoms } from "./operations.atom";
import { SendContactsPanel } from "./admin";
import { SendCampaignPanel } from "./campaign.admin";
import { SendOperationsPanel } from "./operations.admin";
import { SendContactDetails } from "@/services/send/client/contacts";
import { useTableTotal } from "./table";

export {
  SendAdminPanel as NotificationsAdminPanel,
  makeSendAdminAtoms as makeNotificationsAdminAtoms,
};

export const makeSendAdminAtoms = (baseUrl: string) => ({
  contacts: makeSendContactAtoms(baseUrl),
  campaigns: makeSendCampaignAtoms(baseUrl),
  operations: makeSendOperationsAtoms(baseUrl),
});

// Mount this entire console only in the host's authorized admin route. Every
// backend group must also receive SendAdmin; hiding a frontend tab is not auth.
export const SendAdminPanel = ({
  atoms,
  locale,
}: {
  atoms: ReturnType<typeof makeSendAdminAtoms>;
  locale: "en" | "fr";
}) => {
  const [area, setArea] = useState<"contacts" | "campaigns" | "operations">(
    "operations",
  );
  const [campaignId, setCampaignId] = useState<string>();
  const [contactId, setContactId] = useState<string>();
  const [operations, setOperations] = useState<{
    view: typeof S.OperationsView.Type;
    filters: typeof S.OperationsFilters.Type;
  }>({ view: "overview", filters: {} });
  const o = { locale };
  return (
    <KrakstackProvider locale={locale} locales={["en", "fr"]}>
      <div className="space-y-6">
        <nav
          className="flex flex-wrap gap-2"
          aria-label={m.kraksend_ops_title({}, o)}
        >
          <Button
            variant={area === "operations" ? "default" : "outline"}
            onClick={() => setArea("operations")}
          >
            {m.kraksend_ops_title({}, o)}
          </Button>
          <Button
            variant={area === "contacts" ? "default" : "outline"}
            onClick={() => {
              setContactId(undefined);
              setArea("contacts");
            }}
          >
            {m.kraksend_contacts_title({}, o)}
          </Button>
          <Button
            variant={area === "campaigns" ? "default" : "outline"}
            onClick={() => {
              setCampaignId(undefined);
              setArea("campaigns");
            }}
          >
            {m.kraksend_campaign_title({}, o)}
          </Button>
        </nav>
        {area === "contacts" &&
          (contactId ? (
            <ContactDetail
              key={contactId}
              id={contactId}
              atoms={atoms.contacts}
              locale={locale}
              onClose={() => setContactId(undefined)}
              onActivity={(id) => {
                setOperations({ view: "activity", filters: { contactId: id } });
                setArea("operations");
              }}
            />
          ) : (
            <SendContactsPanel
              atoms={atoms.contacts}
              locale={locale}
              onInspect={setContactId}
            />
          ))}
        {area === "campaigns" && (
          <SendCampaignPanel
            key={campaignId ?? "campaigns"}
            atoms={atoms.campaigns}
            locale={locale}
            initialSelected={campaignId}
            onRecipients={(id) => {
              setOperations({
                view: "recipients",
                filters: { campaignId: id },
              });
              setArea("operations");
            }}
          />
        )}
        {area === "operations" && (
          <SendOperationsPanel
            key={JSON.stringify(operations)}
            atoms={atoms.operations}
            locale={locale}
            initialView={operations.view}
            initialFilters={operations.filters}
            onCampaign={(id) => {
              setCampaignId(id);
              setArea("campaigns");
            }}
            onContact={(id) => {
              setContactId(id);
              setArea("contacts");
            }}
          />
        )}
      </div>
    </KrakstackProvider>
  );
};

const ContactDetail = ({
  id,
  atoms,
  locale,
  onClose,
  onActivity,
}: {
  id: string;
  atoms: ReturnType<typeof makeSendContactAtoms>;
  locale: "en" | "fr";
  onClose: () => void;
  onActivity: (id: string) => void;
}) => {
  const [table, setTable] = useState<typeof TableState.Type>(initialTableState);
  const contact = useAtomValue(atoms.contact(id));
  const history = useAtomValue(atoms.history(id, table));
  const page = Option.getOrUndefined(AsyncResult.value(history));
  const total = useTableTotal(page?.total);
  const o = { locale };
  return (
    <SendContactDetails
      contact={Option.getOrUndefined(AsyncResult.value(contact))}
      history={page}
      table={{
        state: table,
        onStateChange: setTable,
        status: {
          loading:
            AsyncResult.isInitial(history) || AsyncResult.isWaiting(history),
        },
        features: { pagination: { mode: "server", rowCount: total } },
      }}
      error={
        AsyncResult.isFailure(contact) || AsyncResult.isFailure(history)
          ? m.kraksend_ops_failed({}, o)
          : undefined
      }
      onClose={onClose}
      onActivity={onActivity}
      messages={{
        title: m.kraksend_ops_contact_history({}, o),
        id: m.kraksend_ops_contact_id({}, o),
        email: m.kraksend_contacts_email({}, o),
        name: m.kraksend_contacts_name({}, o),
        locale: m.kraksend_ops_locale({}, o),
        consent: m.kraksend_contacts_consent({}, o),
        created: m.kraksend_ops_created({}, o),
        updated: m.kraksend_ops_updated({}, o),
        requestId: m.kraksend_ops_request_id({}, o),
        status: m.kraksend_campaign_status({}, o),
        source: m.kraksend_ops_source({}, o),
        actor: m.kraksend_ops_actor({}, o),
        noticeVersion: m.kraksend_ops_notice_version({}, o),
        occurred: m.kraksend_ops_occurred({}, o),
        previous: m.kraksend_contacts_previous({}, o),
        next: m.kraksend_contacts_next({}, o),
        close: m.kraksend_campaign_close({}, o),
        activity: m.kraksend_ops_activity({}, o),
        states: {
          unknown: m.kraksend_contacts_unknown({}, o),
          subscribed: m.kraksend_contacts_subscribed({}, o),
          unsubscribed: m.kraksend_contacts_unsubscribed({}, o),
        },
      }}
    />
  );
};
