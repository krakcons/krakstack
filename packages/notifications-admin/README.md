# @krak-stack/notifications-admin

Optional React administration screens and Effect Atom helpers for
`@krak-stack/notifications`. TanStack Start hosts can mount them in protected web
routes. The backend remains an independent Effect package: it has no React,
TanStack or registry dependency.

## Install

```sh
bun add @krak-stack/notifications@0.3.0 @krak-stack/notifications-admin@0.1.0 @krak-stack/registry@0.2.2
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

## Host integration

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
notification SDK. Its published 0.2.2 release is supported; no new registry release
is required. Already published packages and legacy notification engine exports
remain unchanged.

See the backend's [administration guide](https://github.com/krakcons/krakstack/blob/main/packages/notifications/ADMIN.md)
for grants, feedback coverage, consent and suppression semantics.
