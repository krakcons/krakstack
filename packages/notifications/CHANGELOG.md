# @krak-stack/notifications

## 0.1.2

### Patch Changes

- Use `PgClient.json` for JSON SQL parameters and reconcile persisted jobs against Effect 4.1's queue state column. Declare `@effect/sql-pg` as a required peer dependency.
- Upgrade to Effect 4.1.0 and use Effect crypto services for UUIDv7 entity IDs, hashing, and secure capability generation. Preserve existing deterministic fingerprints and random upload capability tokens.
