# @krak-stack/notifications

## 0.2.0

### Minor Changes

- Add bounded `NotificationRuntime.runBatch()` execution for scheduled containers, with two passes approximately 30 seconds apart, configurable concurrency and runtime limits, idle-safe acquisition, shutdown grace, and per-run delivery outcomes. Preserve durable retries and existing continuous workers. Document minute-level cron setup and the maintenance cutover from Effect RC queues.

## 0.1.2

### Patch Changes

- Use `PgClient.json` for JSON SQL parameters and reconcile persisted jobs against Effect 4.1's queue state column. Declare `@effect/sql-pg` as a required peer dependency.
- Upgrade to Effect 4.1.0 and use Effect crypto services for UUIDv7 entity IDs, hashing, and secure capability generation. Preserve existing deterministic fingerprints and random upload capability tokens.
