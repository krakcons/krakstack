# @krak-stack/notifications-admin

## 0.2.0

### Minor Changes

- Add an optional NotificationPresentationProvider for host-owned table defaults and named inspection references. Delivery and operations screens retain their existing controlled data, actions, authorization boundaries and backwards-compatible default rendering.

## 0.1.0

### Minor Changes

- Provide optional React notification contact, campaign, operations and scoped-delivery administration screens, built from shared KrakStack table/form primitives.
- Provide Effect Atom query and mutation factories, including authorization-key-partitioned staff queries, without prescribing application routing or authorization.
- Keep the Effect backend in `@krak-stack/notifications`. This package exclusively owns notification administration screens and Atom helpers, reusing shared primitives from the published registry 0.2.2 release without adding registry notification-admin exports or dependencies.
