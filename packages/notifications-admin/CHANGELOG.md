# @krak-stack/notifications-admin

## 0.1.0

### Minor Changes

- Provide optional React notification contact, campaign, operations and scoped-delivery administration screens, built from shared KrakStack table/form primitives.
- Provide Effect Atom query and mutation factories, including authorization-key-partitioned staff queries, without prescribing application routing or authorization.
- Keep the Effect backend in `@krak-stack/notifications`. Existing registry notification component exports delegate to this package instead of maintaining duplicate implementations.
