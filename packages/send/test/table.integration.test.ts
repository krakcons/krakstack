import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { withSend } from "./fixtures/send.js";
import { initialTableState } from "../../notifications/src/admin/table.schema.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "notification administration tables",
  () => {
    it.effect(
      "searches and filters the full dataset, returns real totals for empty pages, and sorts deterministically",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            for (let n = 0; n < 23; n++)
              yield* f.send.createContact({
                email: `person-${String(n).padStart(2, "0")}@example.com`,
                name: n === 22 ? "Needle" : "Same",
              });
            const first = yield* f.send.contactsTable({
              ...initialTableState,
              pageSize: 10,
              sort: [{ id: "email", direction: "desc" }],
            });
            expect(first.total).toBe(23);
            expect(first.items).toHaveLength(10);
            expect(first.items[0].email).toBe("person-22@example.com");
            const last = yield* f.send.contactsTable({
              ...initialTableState,
              page: 2,
              pageSize: 10,
              sort: [{ id: "email", direction: "desc" }],
            });
            expect(last.total).toBe(23);
            expect(last.items).toHaveLength(3);
            expect(last.items.at(-1)?.email).toBe("person-00@example.com");
            const search = yield* f.send.contactsTable({
              ...initialTableState,
              globalFilter: "needle",
            });
            expect(search.total).toBe(1);
            expect(search.items[0].name).toBe("Needle");
            const empty = yield* f.send.contactsTable({
              ...initialTableState,
              page: 5,
              globalFilter: "needle",
            });
            expect(empty).toEqual({ items: [], total: 1 });
            const literal = yield* f.send.contactsTable({
              ...initialTableState,
              globalFilter: "%",
            });
            expect(literal.total).toBe(0);
            const equal = yield* f.send.contactsTable({
              ...initialTableState,
              filters: [
                {
                  id: "name",
                  kind: "text",
                  operator: "equals",
                  value: "Needle",
                },
              ],
            });
            expect(equal.total).toBe(1);
            const sort = {
              ...initialTableState,
              pageSize: 5,
              sort: [{ id: "name", direction: "asc" as const }],
            };
            const a = yield* f.send.contactsTable(sort);
            const b = yield* f.send.contactsTable(sort);
            expect(a.items.map((r) => r.id)).toEqual(b.items.map((r) => r.id));
          }),
        ),
    );
    it.effect(
      "rejects arbitrary columns, filter type mismatches, invalid ranges and oversized pages",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            for (const table of [
              {
                ...initialTableState,
                sort: [
                  {
                    id: "email; DROP TABLE kraksend_contacts",
                    direction: "asc" as const,
                  },
                ],
              },
              {
                ...initialTableState,
                filters: [
                  {
                    id: "payload",
                    kind: "text" as const,
                    operator: "contains" as const,
                    value: "secret",
                  },
                ],
              },
              {
                ...initialTableState,
                filters: [
                  {
                    id: "createdAt",
                    kind: "text" as const,
                    operator: "contains" as const,
                    value: "2026",
                  },
                ],
              },
              {
                ...initialTableState,
                filters: [
                  {
                    id: "createdAt",
                    kind: "date" as const,
                    from: "2026-02-30",
                  },
                ],
              },
              { ...initialTableState, pageSize: 101 },
            ])
              expect(
                (yield* f.send.contactsTable(table).pipe(Effect.flip))._tag,
              ).toBe("SendValidationError");
          }),
        ),
    );
    it.effect(
      "preserves operational scope and supports boolean/date/number/enum filters",
      () =>
        withSend((f) =>
          Effect.gen(function* () {
            const contact = yield* f.send.createContact({
              email: "visible@example.com",
            });
            yield* f.send.queueEmail({
              requestId: "table-message",
              contactId: contact.id,
              purpose: "transactional",
              eventKey: "table",
              email: { subject: "Visible", text: "Never exposed" },
            });
            const result = yield* f.operations.activityTable({
              table: {
                ...initialTableState,
                filters: [
                  { id: "status", kind: "values", values: ["queued"] },
                  { id: "attempts", kind: "number", min: 1, max: 1 },
                  { id: "confirmed", kind: "boolean", value: false },
                  {
                    id: "createdAt",
                    kind: "date",
                    from: "1960-01-01",
                    to: "2099-12-31",
                  },
                ],
              },
            });
            expect(result.total).toBe(1);
            expect(JSON.stringify(result)).not.toContain("Never exposed");
            const other = yield* f.operations.activityTable({
              contactId: crypto.randomUUID(),
              table: initialTableState,
            });
            expect(other.total).toBe(0);
            yield* f.notifications.setSuppression({
              scope: {
                recipientUserId: "private",
                organizationId: null,
                workspaceId: null,
              },
              channel: "email",
              purpose: null,
              recipientAddress: "hidden@example.com",
              reason: "private",
              expiresAt: null,
            });
            expect(
              (yield* f.operations.suppressionsTable(initialTableState)).total,
            ).toBe(0);
            yield* f.operations.addSuppression({
              payload: {
                requestId: "block",
                email: contact.email,
                reason: "Reviewed",
              },
              actor: "host:admin",
            });
            expect(
              (yield* f.operations.suppressionsTable({
                ...initialTableState,
                filters: [{ id: "active", kind: "boolean", value: true }],
              })).total,
            ).toBe(1);
            expect(
              (yield* f.operations.auditTable({
                ...initialTableState,
                globalFilter: "Reviewed",
              })).total,
            ).toBe(1);
          }),
        ),
    );
    it.effect("keeps consent history scoped to the selected contact", () =>
      withSend((f) =>
        Effect.gen(function* () {
          const contact = yield* f.send.createContact({
            email: "consent@example.com",
          });
          const other = yield* f.send.createContact({
            email: "other@example.com",
          });
          yield* f.send.recordEmailConsent({
            contactId: contact.id,
            requestId: "grant",
            status: "subscribed",
            source: "table-test",
            actor: "host:test",
            noticeVersion: "v1",
          });
          expect(
            (yield* f.send.consentTable({
              contactId: contact.id,
              table: { ...initialTableState, globalFilter: "table-test" },
            })).total,
          ).toBe(1);
          expect(
            (yield* f.send.consentTable({
              contactId: other.id,
              table: initialTableState,
            })).total,
          ).toBe(0);
        }),
      ),
    );
  },
);
