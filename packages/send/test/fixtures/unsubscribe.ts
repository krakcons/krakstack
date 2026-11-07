import { Effect, Layer } from "effect";
import { KrakSend } from "../../src/index.js";
import { SendStorageError } from "../../src/schema.js";

export const contactId = "019a0000-0000-7000-8000-000000000001";
export const makeUnsubscribeFixture = (failure?: SendStorageError) => {
  const withdrawals: string[] = [];
  const unused = () => Effect.die(new Error("Unexpected operation"));
  const layer = Layer.succeed(KrakSend, {
    contactsTable: unused,
    consentTable: unused,
    createContact: unused,
    updateContact: unused,
    listContacts: unused,
    recordEmailConsent: unused,
    listEmailConsentEvents: unused,
    queueEmail: unused,
    checkDelivery: unused,
    getContact: ({ id }) =>
      Effect.succeed({
        id,
        name: "Private Person",
        email: "private@example.com",
        locale: "en",
        emailConsent: "subscribed",
        createdAt: new Date(0),
        updatedAt: new Date(0),
      }),
    withdrawEmailConsent: ({ id }) =>
      failure
        ? Effect.fail(failure)
        : Effect.sync(() => {
            withdrawals.push(id);
          }),
  });
  return { withdrawals, layer };
};
