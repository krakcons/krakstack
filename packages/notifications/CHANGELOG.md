# @krak-stack/notifications

## 0.4.0

### Minor Changes

- 09d03cc: Expose the notification menu through the browser-safe `@krak-stack/notifications/client` entry point using the optional registry peer. Keep one shared menu implementation. Constrain popover and notification content overflow, place archive actions inside notification cards, and show a labeled Archive all button beneath the tabs. Use the standard rounded trigger button.

### Patch Changes

- 09d03cc: Add optional `EmailPayloadV1.fromName` to preserve sender display names with the built-in SES and SMTP transports. SES uses UTF-8 MIME encoded words, including safe chunking for long names; SMTP uses a structured sender mailbox. Reject empty names and CR/LF header injection while preserving address-only payload compatibility.
- Updated dependencies
- Updated dependencies [09d03cc]
  - @krak-stack/registry@0.8.1

## 0.3.0

### Minor Changes

- Unify publication through the existing delivery engine with immutable address/contact associations, independent account/organization/workspace scope, explicit transactional, notification and marketing policies, audited exact-scope consent, and versioned fail-closed policy extensions.
- Add protected server-side integration operations with separate publish, inspect, cancel and retry permissions and mandatory host authorization. Keep authentication, trusted recipient resolution, templates and business classification application-owned.
- Add host-protected contact and consent administration, signed contact unsubscribe, bilingual campaigns, durable audience publication, sender/environment safeguards, and email operations with audited suppression changes.
- Keep this package Effect-only. Optional React screens and Effect Atom helpers are distributed separately as `@krak-stack/notifications-admin@0.1.0`; backend `/admin/*` subpaths remain server contracts and handlers.
- Add source-independent, scope-authorized staff metrics, activity tables and attempt inspection. Use shared server-backed KrakStack tables without republishing messages or manufacturing contact requests.
- Extend authenticated provider feedback to opted-in native publications with exact-scope bounce/complaint suppression and explicit feedback coverage. Preserve legacy broad blocks while adding explicit suppression matching modes.
- Add account-wide optional-email opt-out and signed unsubscribe links, enforced at publication and dispatch without changing transactional email, push or direct-dispatch behavior.
- Preserve legacy publication fingerprints, queued IDs, retries, migration identifiers, tokens and workflow names. Existing publication shapes and `NotificationContacts.queueEmail()` remain compatibility entry points; see [PUBLICATION.md](./PUBLICATION.md) for migration and retirement guidance. Existing `0.2.x` releases remain unchanged; upgrading to `0.3.0` is explicit for consumers using `^0.2.x`.

## 0.2.1

### Patch Changes

- Add APNs and FCM transports with Effect Crypto signing, provider-neutral push payloads, explicit invalid-recipient errors, serialized OAuth refresh, and provider-aware retry deadlines. Support injected HTTP/2 clients on Bun without loading the optional Node client. Keep installation authentication, native channels, preferences, localization, and navigation application-owned.
- Classify non-JSON provider errors by HTTP status and make the Android channel override application-owned. Document Node and Bun HTTP/2 composition.

## 0.2.0

### Minor Changes

- Add bounded `NotificationRuntime.runBatch()` execution for scheduled containers, with two passes approximately 30 seconds apart, configurable concurrency and runtime limits, idle-safe acquisition, shutdown grace, and per-run delivery outcomes. Preserve durable retries and existing continuous workers. Document minute-level cron setup and the maintenance cutover from Effect RC queues.

## 0.1.2

### Patch Changes

- Use `PgClient.json` for JSON SQL parameters and reconcile persisted jobs against Effect 4.1's queue state column. Declare `@effect/sql-pg` as a required peer dependency.
- Upgrade to Effect 4.1.0 and use Effect crypto services for UUIDv7 entity IDs, hashing, and secure capability generation. Preserve existing deterministic fingerprints and random upload capability tokens.
