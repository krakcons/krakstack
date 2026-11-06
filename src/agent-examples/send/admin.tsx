import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";

import {
  SendContacts,
  type SendContactsMessages,
} from "@/services/send/client/contacts";
import * as m from "@/paraglide/messages";
import type { makeSendContactAtoms } from "./atom";

// This is not a public route. The host must protect both the route mounting
// this panel and the SendAdmin API, using its existing authorization.
export const SendContactsPanel = ({
  atoms,
  locale,
}: {
  atoms: ReturnType<typeof makeSendContactAtoms>;
  locale: "en" | "fr";
}) => {
  const [cursors, setCursors] = useState([""]);
  const cursor = cursors.at(-1) ?? "";
  const result = useAtomValue(atoms.contacts(cursor));
  const page = Option.getOrUndefined(AsyncResult.value(result));
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
      pending={AsyncResult.isInitial(result) || AsyncResult.isWaiting(result)}
      error={AsyncResult.isFailure(result) ? messages.savingFailed : undefined}
      messages={messages}
      defaultContactLocale={locale}
      onCreate={create}
      onWithdraw={(contact) =>
        withdraw({ contactId: contact.id, requestId: crypto.randomUUID() })
      }
      onNext={() => {
        if (page?.nextCursor) setCursors([...cursors, page.nextCursor]);
      }}
      onPrevious={
        cursors.length > 1 ? () => setCursors(cursors.slice(0, -1)) : undefined
      }
    />
  );
};
