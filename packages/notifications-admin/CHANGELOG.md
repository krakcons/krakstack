# @krak-stack/notifications-admin

## 0.2.3

### Patch Changes

- Use a standard npm version range for the notifications peer so the admin package can be installed outside the KrakStack workspace.

## 0.2.2

### Patch Changes

- Bundle English and French messages for the delivery history components. They use the shared KrakStack locale and no longer require a `messages` prop. Existing message overrides remain supported.

  Show recipient, event, status, provider, attempts, and creation date by default, with extra metadata available in the column picker. Require `@krak-stack/registry` 0.10.14 or newer within the 0.10 release line.

  Move View delivery into the row actions menu and add an optional host-provided Preview email action.

  Display the delivery provider as a badge.

  Show delivery details and email preview in separate dialogs.

  `NotificationDeliveryActivity` can own the details and preview dialog via `selection` and `onSelectionChange`. The preview loads from the standard protected route, without client setup in the host. Installation-wide admins must have the explicit server-side `emailPreview` grant to read saved bodies.

  `NotificationDeliveryActivity` now accepts the standard DataTable `state` and `onStateChange` props. The old `table` and `onTable` names remain supported for existing callers.

  Organize delivery details into clearer sections and add an expandable JSON view of the complete stored delivery input. The existing inspection response includes the input only with an explicit `deliveryInput` grant and installation-wide access.

  Use the KrakStack CodeBlock for delivery input and show the saved sender name and address in email previews when available.

  Declare `@tanstack/highlight` as a required peer dependency for CodeBlock rendering.

- Updated dependencies
- Updated dependencies
  - @krak-stack/notifications@0.4.6

## 0.2.1

### Patch Changes

- 14f7065: Expose focused delivery overview, activity, detail and attempt-history modules,
  plus standalone feedback, suppression and suppression-audit views. Retain existing
  screens with optional host navigation, selectable operations views and typed table
  customization with stable table identities.

  Add an optional query lifecycle hook for polling, retained pagination totals and
  failed-read clearing. Apply configured delivery scope consistently, isolate
  operations caches by host/session, support host HttpClient layers, and accept
  notifications 0.3.x/0.4.x and registry 0.2.x/0.10.x to avoid unnecessary nested peer
  copies. Existing screen exports and legacy operations factory
  calls remain supported.

- Updated dependencies [8d013ab]
  - @krak-stack/notifications@0.4.1

## 0.2.0

### Minor Changes

- Add an optional NotificationPresentationProvider for host-owned table defaults and named inspection references. Delivery and operations screens retain their existing controlled data, actions, authorization boundaries and backwards-compatible default rendering.

## 0.1.0

### Minor Changes

- Provide optional React notification contact, campaign, operations and scoped-delivery administration screens, built from shared KrakStack table/form primitives.
- Provide Effect Atom query and mutation factories, including authorization-key-partitioned staff queries, without prescribing application routing or authorization.
- Keep the Effect backend in `@krak-stack/notifications`. This package exclusively owns notification administration screens and Atom helpers, reusing shared primitives from the published registry 0.2.2 release without adding registry notification-admin exports or dependencies.
