import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option, Schema } from "effect";
import {
  TableState,
  initialTableState,
} from "@krak-stack/notifications/admin/table.schema";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";

import {
  SendContacts,
  type SendContactsMessages,
} from "@krak-stack/notifications-admin/contacts";
import * as m from "@/paraglide/messages";
import type { makeSendContactAtoms } from "./atom";
import { useTableTotal } from "./table";

// This is not a public route. The host must protect both the route mounting
// this panel and the SendAdmin API, using its existing authorization.
export const SendContactsPanel = ({
  atoms,
  locale,
  onInspect,
}: {
  atoms: ReturnType<typeof makeSendContactAtoms>;
  locale: "en" | "fr";
  onInspect?: (id: string) => void;
}) => {
  const [table, setTable] = useState<typeof TableState.Type>(initialTableState);
  const cursor = Schema.encodeSync(Schema.fromJsonString(TableState))(table);
  const result = useAtomValue(atoms.contacts(cursor));
  const refresh = useAtomRefresh(atoms.contacts(cursor));
  const page = Option.getOrUndefined(AsyncResult.value(result));
  const total = useTableTotal(page?.total);
  const create = useAtomSet(atoms.create, { mode: "promise" });
  const withdraw = useAtomSet(atoms.withdraw(cursor), { mode: "promise" });
  const options = { locale };
  const messages: SendContactsMessages = {
    title: m.kraksend_contacts_title({}, options),
    description: m.kraksend_contacts_description({}, options),
    create: m.kraksend_contacts_create({}, options),
    name: m.kraksend_contacts_name({}, options),
    email: m.kraksend_contacts_email({}, options),
    consent: m.kraksend_contacts_consent({}, options),
    unknown: m.kraksend_contacts_unknown({}, options),
    subscribed: m.kraksend_contacts_subscribed({}, options),
    unsubscribed: m.kraksend_contacts_unsubscribed({}, options),
    withdraw: m.kraksend_contacts_withdraw({}, options),
    save: m.kraksend_contacts_save({}, options),
    savingFailed: m.kraksend_contacts_failed({}, options),
    loading: m.kraksend_contacts_loading({}, options),
    empty: m.kraksend_contacts_empty({}, options),
    previous: m.kraksend_contacts_previous({}, options),
    next: m.kraksend_contacts_next({}, options),
  };
  return (
    <SendContacts
      page={page}
      table={{
        state: table,
        onStateChange: setTable,
        features: { pagination: { mode: "server", rowCount: total }, refresh },
      }}
      pending={AsyncResult.isInitial(result) || AsyncResult.isWaiting(result)}
      error={AsyncResult.isFailure(result) ? messages.savingFailed : undefined}
      messages={messages}
      defaultContactLocale={locale}
      inspection={
        onInspect
          ? {
              label: m.kraksend_ops_contact_history({}, options),
              onSelect: (contact) => onInspect(contact.id),
            }
          : undefined
      }
      onCreate={create}
      onWithdraw={(contact) =>
        withdraw({ contactId: contact.id, requestId: crypto.randomUUID() })
      }
    />
  );
};
