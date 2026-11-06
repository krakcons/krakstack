import { Atom, AtomHttpApi, AsyncResult } from "effect/reactivity";
import { FetchHttpClient } from "effect/http";
import { SendAdminApi } from "@krak-stack/send/api";
import type { Contact, CreateContact } from "@krak-stack/send/schema";

// Construct once per host application, using its trusted API origin. The host
// adds its own HttpClient authentication/CSRF middleware where needed.
export const makeSendContactAtoms = (baseUrl: string) => {
  class SendClient extends AtomHttpApi.Service<SendClient>()(
    "example/SendClient",
    {
      api: SendAdminApi,
      baseUrl,
      httpClient: FetchHttpClient.layer,
    },
  ) {}

  const contacts = Atom.family((after: string) =>
    Atom.optimistic(
      SendClient.query("send", "listContacts", {
        query: { limit: 25, after: after || undefined },
        timeToLive: "30 seconds",
        reactivityKeys: ["kraksend.contacts"],
      }),
    ),
  );
  const createMutation = SendClient.mutation("send", "createContact");
  // The server generates IDs and determines page membership; do not guess where
  // a new contact belongs in a paginated result.
  const create = Atom.fn((payload: CreateContact, get) =>
    get.setResult(createMutation, {
      payload,
      reactivityKeys: ["kraksend.contacts"],
    }),
  );
  const consentMutation = SendClient.mutation("send", "recordEmailConsent");
  const withdraw = Atom.family((after: string) =>
    Atom.optimisticFn(contacts(after), {
      reducer: (state, input: { contactId: string; requestId: string }) =>
        AsyncResult.map(state, (page) => ({
          ...page,
          items: page.items.map((contact): Contact =>
            contact.id === input.contactId
              ? { ...contact, emailConsent: "unsubscribed" }
              : contact,
          ),
        })),
      fn: Atom.fn((input: { contactId: string; requestId: string }, get) =>
        get.setResult(consentMutation, {
          params: { id: input.contactId },
          payload: {
            requestId: input.requestId,
            status: "unsubscribed",
            noticeVersion: "admin-withdrawal-v1",
          },
          reactivityKeys: ["kraksend.contacts"],
        }),
      ),
    }),
  );
  return { contacts, create, withdraw };
};
