# @krak-stack/notifications-admin

Optional React administration screens and Effect Atom helpers for
`@krak-stack/notifications`. TanStack Start hosts can mount them in protected web
routes. The backend remains an independent Effect package: it has no React,
TanStack or registry dependency.

## Install

```sh
bun add @krak-stack/notifications @krak-stack/notifications-admin @krak-stack/registry
```

Install the React, Effect, Effect Atom, Effect browser platform, TanStack, Base UI and icon peer dependencies
listed in `package.json`. The UI reuses registry's shared DataTable and form
primitives; registry is not another notification engine. It is not required by
backend-only consumers of `@krak-stack/notifications`.

Import the Tailwind source from the host stylesheet, alongside its existing
KrakStack theme/base styles:

```css
@import "@krak-stack/notifications-admin/tailwind.css";
```

The package does not reset application styles or install a theme. It shares the
host's `KrakstackProvider` from `@krak-stack/registry/krakstack-provider` for locale
and component defaults. Language switchers must display `English` and `Français`.
Supported backend lines are notifications `0.3.x` and `0.4.x`; supported registry
lines are `0.2.x` (from `0.2.2`) and `0.10.x` (from `0.10.3`). Use one shared
registry instance so tables, forms and the host see the same locale context.

## Imports

```tsx
import { NotificationContacts } from "@krak-stack/notifications-admin/contacts";
import { NotificationCampaigns } from "@krak-stack/notifications-admin/campaigns";
import { NotificationOperations } from "@krak-stack/notifications-admin/operations";
import { NotificationDeliveries } from "@krak-stack/notifications-admin/deliveries";
import {
  makeNotificationContactAtoms,
  makeNotificationCampaignAtoms,
  makeNotificationOperationsAtoms,
  makeNotificationDeliveryAtoms,
} from "@krak-stack/notifications-admin/atoms";
```

The root entry point exports the controlled views and their prop/message types.
`/atoms` is separate so custom host data loading does not require using the bundled
factories. The existing `Send*` names remain aliases for compatibility.

## Compose sections instead of copying screens

The existing `NotificationDeliveries` and `NotificationOperations` screens remain
available with their original defaults. Focused sections can instead be placed in
host-owned layouts, navigation, dialogs, drawers or routes:

| Import                                        | Focused interface                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/deliveries`: `NotificationDeliveryOverview` | Messages, overview, loading/error; optional metric groups and `variant: "cards" \| "rows"`    |
| `/deliveries`: `NotificationDeliveryActivity` | Messages, activity page, controlled table state/total, inspect and optional refresh callbacks |
| `/deliveries`: `NotificationDeliveryDetails`  | Messages, inspection, loading/error and optional contact/campaign navigation; no dialog shell |
| `/deliveries`: `NotificationAttemptHistory`   | Common messages and attempts; no screen callbacks                                             |
| `/operations`: `NotificationFeedbackTable`    | Messages, feedback items, table state and inspection callback                                 |
| `/operations`: `NotificationSuppressions`     | Messages, suppression items, table state and optional block/unblock callbacks                 |
| `/operations`: `NotificationSuppressionAudit` | Messages, audit items and table state; no mutation callbacks                                  |

Each module exports its corresponding `*Props` and focused `*Messages` types.
Standalone modules require only their own labels, not every full-console
translation; existing complete message objects remain accepted. No module fetches records,
infers permissions, installs routes or resolves product identities.
`NotificationSuppressions` is read-only when mutation callbacks are omitted.
When provided, its existing confirmation form still requires an audit reason,
uses the reviewed row version and retains its idempotency key across retries.

```tsx
import {
  NotificationDeliveryOverview,
  NotificationDeliveryActivity,
  NotificationDeliveryDetails,
} from "@krak-stack/notifications-admin/deliveries";

// The host owns messages, state, queries, navigation and the dialog shell.
<main>
  <NotificationDeliveryOverview
    messages={messages}
    overview={overview}
    pending={pending}
    error={error}
    variant="rows"
    groups={[
      { metrics: ["total", "accepted", "failed"] },
      {
        label: messages.feedbackCovered,
        metrics: ["feedbackCovered", "feedbackUnavailable", "confirmed"],
      },
    ]}
  />
  <NotificationDeliveryActivity
    messages={messages}
    activity={activity}
    table={table}
    total={total}
    onTable={setTable}
    onInspect={setSelected}
    pending={pending}
    error={error}
  />
  {/* Mount inside the host's accessible dialog/drawer when a row is selected. */}
  {selected && (
    <NotificationDeliveryDetails
      messages={messages}
      inspection={inspection}
      error={inspectionError}
    />
  )}
</main>;
```

Keep the activity module mounted behind inspection to preserve its local column
settings and controlled page/filter state. The full delivery screen already does
this. `messages.sections` optionally supplies localized summary/sending section
headings; existing message objects work unchanged. Dates and metric counts use the
host's shared registry locale.

For the default screens, set `navigation={false}` and/or `header={false}` when the
host owns those elements. `NotificationDeliveries` also accepts
`sourcePicker={false}`; its controlled `source` still selects the data.
`NotificationOperations` accepts, for example,
`views={["suppressions", "feedback", "audit"]}`. An excluded current view renders
no content; the host selects a valid initial view. These options are presentation,
**not authorization**. Protect every mounted backend capability independently.

### Typed tables and stable identities

Standalone tables and the full delivery screen accept `tableOptions`:

```tsx
<NotificationDeliveryActivity
  {...activityProps}
  tableOptions={{
    initialState: { columnVisibility: { source: false, provider: false } },
    columns: (defaults) =>
      defaults
        .filter((column) => column.field !== "eventKey")
        .map((column) =>
          column.field === "organizationId"
            ? {
                ...column,
                sortable: false,
                filterable: false,
                searchable: false,
                valueGetter: ({ data }) =>
                  organizationNames.get(data.organizationId ?? ""),
                cellRenderer: ({ data }) =>
                  renderOrganization(data.organizationId),
              }
            : column,
        ),
  }}
/>
```

Return columns in the desired order, omit unwanted columns, or override typed
renderers/value getters. Keep IDs in records and callbacks. Use `valueGetter` for
display/export labels as well as `cellRenderer`; a renderer alone does not change
exported values. A display override does not add server-side sorting, searching or
filtering by resolved names: leave those capabilities disabled unless the backend
contract supports them. Hidden columns are not a security mechanism.

The presentation provider's `Table` additionally receives optional
`notificationTable` metadata. Stable values are `delivery-activity`,
`delivery-attempts`, `operations-activity`, `feedback`, `suppressions`,
`suppression-audit`, `campaign-recipients` and `operations-attempts`.
Hosts can select table defaults by identity rather than guessing from column
names. Existing `Table={DataTable}` adapters still work. Public table prop,
renderer, identity and customization types are exported from `/presentation`.

### Optional query lifecycle hook

`useNotificationQuery` from `/hooks` works with the package atom resources or an
equivalent host resource:

```tsx
const { data, total, pending, failed, refresh } = useNotificationQuery(
  resource,
  {
    retentionKey: JSON.stringify([authorizationKey, scope, source, view]),
    total: (data) => data.activity?.total,
    refreshIntervalMillis: 15_000,
  },
);
```

The resource supplies `atom` and `refresh`. The hook retains the authoritative
total while another page/filter loads, preventing premature page clamping. It hides
`data` and resets the retained total on a failed read, even if the result contains
previous successful data. Changing `retentionKey` resets the retained count.
Include session/grant identity, scope, source and view in that key; page/search
changes normally share it. This key does not authorize reads or partition the
underlying query cache. Recreate factories and remount authorized content when
sessions/grants change. Use the hook's guarded `data`, not a retained value
extracted manually from its diagnostic `result`.

Polling is opt-in, stops when disabled/unmounted and refreshes only the subscribed
resource. The hook does not infer whether an error is safe to display stale data
for: all failures hide data. Pass a localized host error message to the controlled
view when `failed` is true.

### Atom transport, scope and session identity

Delivery atoms accept `{ baseUrl, authorizationKey, scope?, httpClient? }`.
A configured exact `scope` now applies to overview, activity and inspection even
when omitted from a query key. Conflicting explicit scopes fail before dispatch;
use another factory for another configured scope. With no configured scope,
selection remains query-owned and subject to backend grants.

Operations atoms accept `{ baseUrl, authorizationKey, httpClient? }` as well as
the existing base-URL string. The object form makes session/grant identity explicit;
the string form generates a fresh non-secret cache identity per construction.
Keep either factory stable while mounted; do not construct it on every render.
The host/base URL and authorization key partition client and refresh identities.

`httpClient` is an optional fully provided Effect `HttpClient` layer for host
cookie/CSRF behavior. Defaults remain `FetchHttpClient.layer`. These factories do
not store credentials in query keys. Block/unblock mutations remain authoritative,
not optimistic restorations of deliverability.

## Host integration

Hosts can wrap delivery and operations views with `NotificationPresentationProvider`
from `@krak-stack/notifications-admin/presentation`. Supply `Table` (the registry
DataTable interface) to share application table defaults, columns and safe exports.
Optional `renderReference(kind, id)` resolves inspection references to host-owned
names or links. These hooks are useful to both product admin workspaces and
embedded sending consoles. They contain no product labels, record lookups,
authentication or policy. Default rendering remains backwards compatible.

- Protect the page with the host's existing authentication and authorization.
  These components confer no permissions and create no routes.
- Mount the Effect backend groups from `@krak-stack/notifications/admin/*` with
  their mandatory host middleware. Hiding a tab is not API authorization.
- Supply data, mutation callbacks, messages and controlled table state to the
  views. Shared server-backed tables apply search, filtering, sorting and pagination
  to the full authorized dataset, not just loaded rows.
- Supply English and French messages using the host's Paraglide integration. The
  package does not embed the KrakStack site's generated translations.
- Use the Effect Atom factories for the existing protected API contracts, or
  supply host-owned atoms/HttpClient layers when authentication or CSRF transport
  requires customization. Default factories use FetchHttpClient and same-origin
  browser credentials; they do not store provider credentials or auth tokens.
- For staff delivery reads, provide a non-secret `authorizationKey`. Recreate
  factories when the session or grants change; unmount on sign-out. This key
  partitions caches and is not authorization evidence. The host must clear/hide
  retained data on authorization failures and prevent shared HTTP caching.
- Dangerous mutations remain authoritative. Removing a suppression does not
  subscribe, republish or resend; an audit reason and reviewed row version remain
  required by the backend.

The bilingual [host console example](https://github.com/krakcons/krakstack/blob/main/src/agent-examples/send/console.tsx)
shows complete composition with Effect Atom, query retention, explicit mutation
invalidation, inspection dialogs and authorization-revocation clearing. It is an
example, not a public route or a mandatory router integration.

## Package boundary

Notification administration screens and Atom helpers are available exclusively
from this package, not registry exports or shadcn registry items. Registry supplies
only the shared primitives used by these screens and does not depend on either
notification SDK. Existing supported registry releases work; no new registry
release is required. Already published packages and legacy notification engine exports
remain unchanged.

See the backend's [administration guide](https://github.com/krakcons/krakstack/blob/main/packages/notifications/ADMIN.md)
for grants, feedback coverage, consent and suppression semantics.
