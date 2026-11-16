# @krak-stack/notifications-admin

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
