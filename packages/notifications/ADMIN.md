# Notification administration

Administration is part of `@krak-stack/notifications`, not a separately hosted or
branded product. Import `NotificationContacts` from
`@krak-stack/notifications/admin`. The host owns authentication, authorization,
provider credentials, CSRF protection, installation isolation and retention.
Acquiring the contact layer runs the administration migrations before use.

Subpaths under `@krak-stack/notifications/admin/` expose schemas, protected API
contracts/handlers, campaigns, durable workflows, sender safeguards, provider
feedback, dispatch policy and signed public unsubscribe routes. Existing engine
account unsubscribe, inbox and APNs/FCM integrations are unchanged.

## Frontend

Install `@krak-stack/notifications-contacts`, `@krak-stack/notifications-campaigns`
and `@krak-stack/notifications-operations` through the KrakStack registry, or import
`NotificationContacts`, `NotificationCampaigns` and `NotificationOperations` from
the corresponding `@krak-stack/registry/notifications/*` exports.

`src/agent-examples/send/console.tsx` exports `NotificationsAdminPanel` and
`makeNotificationsAdminAtoms` for a unified English/French host integration.
It is deliberately not mounted on a public documentation route. Lists use shared
KrakStack DataTable search, typed filters, sorting, column visibility and pagination.
Operations and campaigns refresh every 15 seconds; manual refresh is available.

## Server-backed tables

The protected APIs expose `/api/send/tables/contacts`, `/campaigns`, `/activity`,
`/feedback`, `/suppressions`, `/suppression-history` and `/recipients`, plus
`/api/send/contacts/:id/consent-table`. The existing `/api/send` prefix is retained
for compatibility. Every endpoint uses the same mandatory host admin middleware.

The `table` query parameter is an Effect-schema JSON codec for KrakStack table
state: zero-based `page`, `pageSize` (1–100), `globalFilter`, `sort` and `filters`.
The response is `{ items, total }`. Count and page use one SQL statement/snapshot;
even an empty page retains its correct count. Only explicitly exposed columns
and matching filter types are accepted. Inputs are parameterized and text search
treats SQL wildcard characters literally. Sorting has a deterministic tie-breaker.
Date column filters use inclusive UTC calendar dates. Overview windows remain
half-open ISO instants. Filters/search apply to the full authorized dataset.

Pass controlled table state and authoritative totals to the views. Keep prior
totals during loading so pagination does not incorrectly clamp to page zero.
Drill-down IDs constrain contact, campaign and delivery queries at the server;
client column filters cannot widen that scope. Legacy cursor APIs remain available.

## Visibility and safety

Canonical recipient/policy publication is documented in [PUBLICATION.md](./PUBLICATION.md).
Native publications can combine contact, account, organization and workspace context
without legacy contact-request records. `queueEmail` is now a deprecated compatibility
entry point; accepted legacy work and its consent/policy interpretation remain stable.

- Contacts are independent of login accounts. Creation never grants consent.
  Grants/withdrawals and suppression changes are distinct audited facts.
- Campaigns snapshot subscribed audiences. Completion means publication finished,
  not confirmed delivery or reading. Sender/environment safeguards default to deny.
- Compose workers with `sendRuntimeLayer` from `admin/policy`. Protected deliveries
  fail closed when their named policy is missing. Durable workflow activities,
  caller request IDs and publication idempotency keys remain stable across retries.
- Global statistics count distinct owned installation-scope email deliveries.
  Feedback shows individual confirmations, bounces, complaints and unmatched events.
  Account/organization/workspace deliveries and push suppressions stay excluded
  from these existing contact operations. Opt-in staff email reads are described below.
- Operations omit rendered bodies, unsubscribe capabilities, credentials, arbitrary
  references and worker leases. Protected campaign content is separately inspectable.
- Block/removal requires a trusted actor and audit reason. Removal also requires the
  exact reviewed opaque row version. Mutations and audits commit atomically; stale
  requests cannot undo intervening provider blocks. Replays do not repeat side effects.
- Unblocking never restores consent, clears account opt-outs, revives a delivery or
  resends mail. Provider acceptance, confirmed delivery, reading, consent and
  suppression remain separate facts. In-flight messages cannot be recalled.
- Public unsubscribe and provider feedback require their respective signed-token
  and host/provider-authentication boundaries, not browser-supplied trust.

## Staff administration of engine-published emails

Product emails published with `NotificationService.publish()` can be inspected
without republishing, changing idempotency keys or creating marketing contacts.
This is an opt-in **read-only** module. Existing contact/campaign routes and
`SendAdmin` permissions are unchanged; they do not grant product-email access.

```ts
import { NotificationDeliveryAdmin } from "@krak-stack/notifications/admin/deliveries";
import {
  DeliveryAdmin,
  CurrentDeliveryAdmin,
} from "@krak-stack/notifications/admin/delivery.api";
import { DeliveryAdminAccess } from "@krak-stack/notifications/admin/delivery.schema";
import { deliveryAdminRoutes } from "@krak-stack/notifications/admin/delivery.api.builder";
```

Provide `NotificationDeliveryAdmin.layer` with the existing `NotificationContacts`,
`NotificationService` and `SqlClient` layers. Contact acquisition ensures the
existing administration migrations have run. Package layers run the required additive
migrations; historical deliveries need no association backfill or republishing.
Mount `deliveryAdminRoutes` alongside the existing protected routes.
`DeliveryAdminApi`, `DeliveryAdminGroup` and `deliveryAdminHandlers` are also exported
for host composition.

Implement `DeliveryAdmin` in the host. After authenticating and authorizing the
staff request, provide `CurrentDeliveryAdmin` with a trusted actor reference and
an explicit access value, for example:

```ts
const access = {
  contactManaged: false,
  engineScopes: [
    {
      _tag: "Exact",
      scope: {
        recipientUserId: "account-123",
        organizationId: "org-456",
        workspaceId: null,
      },
    },
  ],
  referenceNamespaces: ["order"],
} satisfies typeof DeliveryAdminAccess.Type;

// Inside the host's DeliveryAdmin middleware, AFTER staff authorization:
return (
  yield *
  effect.pipe(
    Effect.provideService(CurrentDeliveryAdmin, {
      reference: staff.reference,
      access,
    }),
  )
);
```

Never construct grants from unverified browser scope parameters. There is no
default middleware and no fallback to `SendAdmin`. Empty grants expose no data.

- `Exact` matches all three fields, including exact nulls. Null is not a wildcard.
- `Organization` explicitly permits engine email reads for its `organizationId`,
  across recipients and workspaces. It does not include null-organization records.
- `Installation` explicitly permits engine email reads throughout the configured
  installation database/schema. The host still owns installation isolation.
- `contactManaged: true` independently grants the existing all-null-scope,
  contact-managed dataset. Engine grants do not confer this permission.
- `referenceNamespaces` is an exact allowlist of domain reference namespaces
  returned by inspection. Use `[]` to expose none.
- Optional `deliveryScopes` uses the same grant shapes for source-independent
  delivery access, including scoped contact-associated native publications. Existing
  `contactManaged` and `engineScopes` permissions are not silently expanded.

Protected GET endpoints under `/api/send/staff/deliveries`:

| Endpoint    | Result                                                            |
| ----------- | ----------------------------------------------------------------- |
| `/overview` | Delivery-state counts and explicit feedback-coverage counts       |
| `/activity` | Server-backed `{ items, total }` table                            |
| `/:id`      | Delivery projection, existing attempts and allowlisted references |

Each accepts optional `source=contacts\|engine\|all` (default `all`) and optional
`scope`, an Effect JSON codec of `NotificationScope`. Both only narrow authorized
data. Overview also accepts the half-open `since`/`until` ISO window; activity
requires the existing `table` JSON codec. The HttpApi client accepts decoded scope
and table values and encodes their query parameters automatically.

Authorization applies before aggregates, search, filters and pagination. An
inaccessible inspection ID returns not-found before attempts or references are
read. Inspection uses the delivery's stored exact scope. Each delivery counts once,
even with overlapping grants, multiple attempts, references or feedback events.
Engine source means no legacy contact-managed request is associated; a native
publication can still have a real contact/endpoint association. It is not inferred
from addresses, template names or idempotency-key prefixes.

Rows expose scope, source, nullable contact/campaign associations, engine purpose,
event key, template identifier, recipient and operational facts. Template payloads
need not contain a subject. Bodies, payloads, publication idempotency keys, signed
unsubscribe URLs, credentials and worker leases remain private. Arbitrary domain
references are neither returned nor searched. Templates, payloads and references
in the engine are never rewritten. Reads never publish, enqueue, retry, alter
account preferences/suppressions or create marketing consent.

Delivery-state metrics cover all selected authorized emails. `accepted` means
provider acceptance, not confirmed delivery or reading. Feedback reconciliation covers
legacy contact requests and native deliveries accepted with host-configured feedback
capability. Configure `notificationFeedbackLayer(["email"])` on the publisher only
when authenticated ingestion and reconciliation are deployed. Without this opt-in,
native emails remain `feedbackUnavailable`, even with a contact association. Coverage
is not inferred from contact membership. New native bounce/complaint blocks use exact
scope. Historical engine emails are not retroactively marked covered. Counts must
not be presented as complete product-email coverage. Unmatched feedback and
active-suppression metrics remain in the existing contact operations, not mixed
into the scope-aware overview.

### Staff frontend

`NotificationDeliveries` is exported by `@krak-stack/registry/notifications/operations`
and the `notifications-operations` registry item. It provides overview, shared
activity tables and attempt inspection, without consent, suppression or resend
controls. Contact/campaign links require real associations and their existing host
permissions.

The unified example supports opt-in staff administration:

```ts
const atoms = makeNotificationsAdminAtoms(origin, {
  authorizationKey: sessionPermissionEpoch,
  // Optional exact narrowing selector, NOT an authorization grant.
  scope: {
    recipientUserId: "account-123",
    organizationId: "org-456",
    workspaceId: null,
  },
});
```

Without the second argument, console behavior stays unchanged. Standalone examples
export `makeNotificationDeliveryAtoms` and `NotificationDeliveriesPanel`. Recreate
staff atoms with a new non-secret `authorizationKey` whenever the session or grants
change, and unmount the console on sign-out. Source, scope, table state and session
epoch partition cached reads. Previous rows, totals and inspection are not retained
across source/scope/session changes. Failed refreshes hide previous staff results.
Disable shared HTTP caching for these sensitive authenticated responses in the host.

Only the mounted view refreshes every 15 seconds. English and French messages use
Paraglide. Public documentation never mounts the console.

## Compatibility

The unpublished send workspace is private and retained only as a compatibility
adapter/test harness. New consumers need only the notifications package. Legacy
SQL tables, migration ledger names, `kraksend.v1`, publication prefixes, token
purposes and versioned workflow/activity names are deliberately unchanged: renaming
persisted identifiers would strand records, tokens, queued deliveries or workflows.
`KrakSend` remains a deprecated source alias for `NotificationContacts`.

Run database coverage against `TEST_DATABASE_URL`, never `DATABASE_URL`:
`bun run --cwd packages/send test`. Browser journeys are in
`e2e/send-operations.spec.ts`, `e2e/send-campaign.spec.ts` and
`e2e/send-unsubscribe.spec.ts`; they use isolated Postgres and fake transport.
