# @krak-stack/notifications

## 0.4.7

### Patch Changes

- Use a standard npm version range for the optional registry peer so notifications can be installed alongside the registry outside the KrakStack workspace.

## 0.4.6

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

- Add `ConsoleEmailTransport` for direct and queued email notifications. Applications can register it in development to print emails to the server console without sending them.

## 0.4.5

### Patch Changes

- Use `@krak-stack/registry@^0.10.14` for the notification menu, which renders destinations as native links and improves keyboard focus outlines.

## 0.4.4

### Patch Changes

- Support attachments on queued email deliveries. Attachments are stored in the existing PostgreSQL delivery payload, reused on retry, and removed on success. Upgrade workers before publishing queued attachments.

## 0.4.3

### Patch Changes

- Support in-memory attachments for direct email dispatch through SES and SMTP without storing attachment bytes in the notification queue.
- Updated dependencies
  - @krak-stack/registry@0.10.13

## 0.4.2

### Patch Changes

- Fix notification menu scrolling so overflowing notifications remain reachable, size short lists to their content, and leave space between notification actions and the scrollbar. Use notification button borders instead of separate dividers to keep the pointer cursor consistent between notifications.

## 0.4.1

### Patch Changes

- 8d013ab: Add opt-in per-delivery local-time sending windows through versioned publication
  policies and existing durable deferrals. Snapshot and fingerprint validated IANA
  timezone/window intent; support overnight windows and deterministic DST behavior.
  Recheck windows and expiry after other dispatch checks, and preserve later
  eligibility dates on manual retry. Existing unrestricted deliveries need no
  configuration or migration.

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
