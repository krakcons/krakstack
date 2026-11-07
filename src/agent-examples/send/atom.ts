import { Atom, AtomHttpApi, AsyncResult } from "effect/reactivity";
import { Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { SendAdminApi } from "@krak-stack/notifications/admin/api";
import {
  TableState,
  initialTableState,
} from "@krak-stack/notifications/admin/table.schema";
const TableCodec = Schema.fromJsonString(TableState);
import {
  SendId,
  type Contact,
  type CreateContact,
} from "@krak-stack/notifications/admin/schema";

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
      Atom.map(
        SendClient.query("send", "contactsTable", {
          query: {
            table: after
              ? Schema.decodeSync(TableCodec)(after)
              : initialTableState,
          },
          timeToLive: "30 seconds",
          reactivityKeys: ["kraksend.contacts"],
        }),
        (result) =>
          AsyncResult.map(result, (page) => ({ ...page, nextCursor: null })),
      ),
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
    Schema.Struct({ id: SendId, table: TableState }).annotate({
      identifier: "SendContactHistoryKey",
    }),
  );
  const historyQuery = Atom.family((key: string) => {
    const { id, table } = Schema.decodeSync(HistoryKey)(key);
    return Atom.optimistic(
      Atom.map(
        SendClient.query("send", "consentTable", {
          params: { id },
          query: { table },
          reactivityKeys: ["kraksend.contacts"],
          timeToLive: "10 seconds",
        }),
        (result) =>
          AsyncResult.map(result, (page) => ({ ...page, nextCursor: null })),
      ),
    );
  });
  const history = (
    id: string,
    table: typeof TableState.Type = initialTableState,
  ) => historyQuery(Schema.encodeSync(HistoryKey)({ id, table }));
  return { contacts, contact, history, create, withdraw };
};
