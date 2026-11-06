import { Atom, AtomHttpApi, AsyncResult } from "effect/reactivity";
import { Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { SendAdminApi } from "@krak-stack/send/api";
import {
  SendId,
  RequestId,
  type Contact,
  type CreateContact,
} from "@krak-stack/send/schema";

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
  const contact = Atom.family((id: string) =>
    Atom.optimistic(
      SendClient.query("send", "getContact", {
        params: { id },
        reactivityKeys: ["kraksend.contacts"],
        timeToLive: "10 seconds",
      }),
    ),
  );
  const HistoryKey = Schema.fromJsonString(
    Schema.Struct({ id: SendId, before: Schema.optional(RequestId) }).annotate({
      identifier: "SendContactHistoryKey",
    }),
  );
  const historyQuery = Atom.family((key: string) => {
    const { id, before } = Schema.decodeSync(HistoryKey)(key);
    return Atom.optimistic(
      SendClient.query("send", "listEmailConsentEvents", {
        params: { id },
        query: { before, limit: 25 },
        reactivityKeys: ["kraksend.contacts"],
        timeToLive: "10 seconds",
      }),
    );
  });
  const history = (id: string, before?: string) =>
    historyQuery(Schema.encodeSync(HistoryKey)({ id, before }));
  return { contacts, contact, history, create, withdraw };
};
