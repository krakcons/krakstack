# @krak-stack/notifications

PostgreSQL-backed Effect primitives for notification inboxes, preferences,
durable deliveries, and one-shot reminders. The package owns no product auth,
HTTP API, UI, provider credentials, or rendered product copy.

## Exports

- `@krak-stack/notifications` provides `NotificationService` and the public domain schemas.
- `@krak-stack/notifications/schema` provides schemas, records, inputs, statuses, and typed errors.
- `@krak-stack/notifications/migrations` provides the package migration loader, runner, and layer.
- `@krak-stack/notifications/runtime` provides due-work enqueueing, workers, retry policy, and reminder handlers.
- `@krak-stack/notifications/transport` provides the transport contract and channel registry.
- `@krak-stack/notifications/transport/email` provides the provider-free rendered email payload v1 schema.
- `@krak-stack/notifications/transport/email-ses` provides the optional AWS SESv2 email adapter.
- `@krak-stack/notifications/transport/email-smtp` provides the optional Nodemailer SMTP adapter.
- `@krak-stack/notifications/direct` provides transient dispatch without SQL or a queue.
- `@krak-stack/notifications/testing` provides fake transport and reminder-handler layers.

## Database Ownership

Consumers provide one `SqlClient` from `effect/unstable/sql`.
`NotificationService.layer` runs domain migrations before exposing the service.
Domain migrations use `krakstack_notification_migrations` and own these tables:

- `notifications`
- `notification_settings`
- `notification_deliveries`
- `notification_delivery_attempts`
- `notification_delivery_references`
- `notification_suppressions`
- `notification_reminders`
- `notification_publications`

The migrations use additive columns and versioned corrected indexes so an
installation with the legacy notification tables can be adopted without
trusting pre-existing index names. Legacy `processing` deliveries without a
current queue job become due `retrying` deliveries while budget remains, or
`failed` deliveries when their application attempt budget is exhausted. Claims
are cleared in both cases. Disabled rows from a compatible
`email_preferences` table become notification-purpose email suppressions.
Legacy publications and reminders are not assigned invented fingerprints when
their original immutable request cannot be derived safely.

Effect `PersistedQueue` owns `krakstack_notification_jobs` and its associated
migration table. Its startup DDL is created by service/runtime layer
construction with the same supplied `SqlClient`.

## Composition

```ts
import { Layer } from "effect";
import { NotificationService } from "@krak-stack/notifications";
import {
  NotificationRuntime,
  ReminderHandlerRegistry,
  type ReminderHandler,
  notificationWorkersLayer,
} from "@krak-stack/notifications/runtime";
import {
  NotificationTransportRegistry,
  type NotificationTransport,
} from "@krak-stack/notifications/transport";
import type { SqlClient } from "effect/unstable/sql";

declare const sqlLayer: Layer.Layer<SqlClient.SqlClient>;
declare const emailTransport: NotificationTransport;
declare const reminderHandler: ReminderHandler;

const transports = NotificationTransportRegistry.layer([emailTransport]);
const handlers = ReminderHandlerRegistry.layer([reminderHandler]);

const domain = NotificationService.layer;

const runtime = NotificationRuntime.makeLayer({
  schedulerIntervalMillis: 10_000,
}).pipe(Layer.provide(transports), Layer.provide(handlers));

export const notificationsLayer = notificationWorkersLayer.pipe(
  Layer.provideMerge(runtime),
  // Complete package migrations before acquiring the worker layer.
  Layer.provideMerge(domain),
  Layer.provide(sqlLayer),
);
```

The placeholders above only illustrate layer ownership. A transport and a
reminder handler capture credentials and provider dependencies in their own
layers; their `send` and `handle` methods have no remaining environment.
`Layer.provideMerge(domain)` makes successful package migration acquisition a
prerequisite for starting the worker fibers.

`NotificationService`, `NotificationRuntime`, and the queue Layer must receive
the same `PgClient` service and pool. Queue offers rely on Effect's contextual
SQL transaction to commit atomically with ledger and attempt rows. Constructing
an unrelated client Layer for the queue breaks that transaction boundary.

Deployments that run migrations separately can use
`NotificationService.layerWithoutMigrations` and invoke
`notificationMigrationsLayer` in their deployment lifecycle.

## Email Adapters

Publisher code can validate and persist rendered email without installing or
configuring a provider. The payload contains content and sender metadata only:

```ts
import { Schema } from "effect";
import { EmailPayloadV1 } from "@krak-stack/notifications/transport/email";

const payload = Schema.decodeUnknownSync(EmailPayloadV1)({
  subject: "Application received",
  text: "Your rendered text body.",
  html: "<p>Your rendered HTML body.</p>",
});
```

For durable SES delivery, provide the adapter registry to the runtime. The SES
Layer reads `SES_REGION`, `SES_ACCESS_KEY_ID`, `SES_SECRET_ACCESS_KEY`, and the
optional `NOTIFICATION_EMAIL_FROM`:

```ts
import { Layer } from "effect";
import {
  NotificationRuntime,
  ReminderHandlerRegistry,
  notificationWorkersLayer,
} from "@krak-stack/notifications/runtime";
import { sesEmailTransportRegistryLayer } from "@krak-stack/notifications/transport/email-ses";

const runtime = NotificationRuntime.layer.pipe(
  Layer.provide(sesEmailTransportRegistryLayer),
  Layer.provide(ReminderHandlerRegistry.emptyLayer),
);

export const sesWorkers = notificationWorkersLayer.pipe(Layer.provide(runtime));
```

SMTP is an alternative email provider, not an additional email channel. Replace
the SES registry with `smtpEmailTransportRegistryLayer`. Its Layer reads
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and
`EMAIL_SENDER_ADDRESS`, verifies the connection at startup, and requires TLS:

```ts
import { Layer } from "effect";
import {
  NotificationRuntime,
  ReminderHandlerRegistry,
} from "@krak-stack/notifications/runtime";
import { smtpEmailTransportRegistryLayer } from "@krak-stack/notifications/transport/email-smtp";

const smtpRuntime = NotificationRuntime.layer.pipe(
  Layer.provide(smtpEmailTransportRegistryLayer),
  Layer.provide(ReminderHandlerRegistry.emptyLayer),
);
```

Direct mode uses the same provider registry without SQL, migrations, or a
persisted queue. It does not consult endpoint suppressions:

```ts
import { Effect, Layer } from "effect";
import {
  DirectNotificationDispatcher,
  dispatchDirect,
} from "@krak-stack/notifications/direct";
import { sesEmailTransportRegistryLayer } from "@krak-stack/notifications/transport/email-ses";

const directSesLayer = DirectNotificationDispatcher.layer.pipe(
  Layer.provide(sesEmailTransportRegistryLayer),
);

export const sendDirect = dispatchDirect({
  scope: {
    recipientUserId: null,
    organizationId: null,
    workspaceId: null,
  },
  eventKey: "application.received",
  eventVersion: 1,
  channel: "email",
  template: null,
  recipientAddress: "volunteer@example.com",
  recipientName: null,
  payloadVersion: 1,
  payload: {
    subject: "Application received",
    text: "Your rendered text body.",
  },
}).pipe(Effect.provide(directSesLayer));
```

SES and Nodemailer are optional peer dependencies. Consumers install only the
provider imported through their selected subpath. One email delivery row always
represents one recipient: SES and SMTP derive their sole destination from the
ledger's `recipientAddress` and optional `recipientName`. Payload `to`, `cc`, or
`bcc` fields are not part of `EmailPayloadV1` and cannot override that
destination. Email recipient addresses are trimmed and lowercased before
persistence, suppression matching, and dispatch. Explicit SES access keys are
supported for this release; AWS
default-chain credentials and session tokens remain future work.

## Delivery Semantics

- `publish` stores an optional rendered inbox and channel-neutral delivery snapshots under caller-provided idempotency keys.
- Publication and reminder idempotency keys are global. SHA-256 fingerprints cover immutable scope, event/handler, inbox, payload, schedule, expiry, attempt budget, and sorted caller references; changed replays fail with `NotificationIdempotencyConflictError`.
- Delivery-only publication supports non-account recipients by setting `recipientUserId` to `null`; inbox and preference operations require `RecipientNotificationScope`.
- Per-delivery references persist application, opportunity, organization, or other caller correlations transactionally; every public namespace beginning `krakstack.` is reserved for package metadata.
- Transactional delivery bypasses preferences. Notification-purpose delivery resolves event, workspace, organization, then recipient defaults deterministically.
- Active endpoint suppressions remain in the delivery ledger and can be managed through `listSuppressions`, `setSuppression`, and `resetSuppression`.
- Null suppression scope fields are broader wildcards. A null suppression purpose applies to every purpose; otherwise it applies only to `transactional` or `notification` delivery.
- Eligible immediate work allocates an attempt and random UUID queue job in the same SQL transaction as the queue offer.
- Future work remains in the ledger with no queue offer. Call `enqueueDue` from a scheduler before or alongside workers.
- Provider retryable/unavailable outcomes acknowledge the current queue item and schedule a fresh ledger generation while application attempt budget remains. Queue retries are reserved for infrastructure or unexpected failures.
- Every provider dispatch consumes one application attempt. Retryable and unavailable outcomes are bounded by `maxAttempts`; permanent outcomes fail immediately. The package never raises the configured budget automatically.
- Workers acknowledge stale, terminal, cancelled, suppressed, and expired jobs without invoking a provider.
- `notificationWorkersLayer` starts delivery, reminder, and scheduler fibers. Reconciliation inspects the exact Effect queue row and only replaces missing, completed, or queue-exhausted jobs after their refreshed lock has expired; ordinary backlog is never superseded.

Provider and handler calls are at least once. A process crash after the external
provider accepts a message but before the ledger success transaction commits can
send the same generation again. Provider idempotency should therefore use the
stable queue job/dispatch id when available.

Cancellation and reminder rescheduling are too late once status is
`processing`; those operations fail with `NotificationTransitionError` rather
than racing an in-flight provider or handler. Cancellation remains idempotent
for already-cancelled queued work.

Effect's SQL queue retains completed and exhausted rows and this package does
not currently delete them. Operators may clean old terminal queue rows only
after confirming no ledger `current_job_id` references them; deleting live
backlog causes reconciliation to allocate a replacement generation.

Reminder records are durable one-shot invocations keyed by handler name and
version. Recurrence and grouping are intentionally outside this package.

## Testing

```sh
bun run typecheck
bun run test
bun run build
```

The non-DB suite covers schemas, preference ranking, retry bounds, direct
dispatch, and generation guards. `test/integration.test.ts` runs only when
`TEST_DATABASE_URL` is exported and exercises migrations plus atomic
ledger/attempt/queue persistence. Existing-table adoption should additionally
be tested in an isolated database seeded with the three VolunteerConnector
legacy tables; the test file names that seam explicitly rather than modifying a
shared database schema.

## Release Boundary

Before publishing a version, run the complete package check and inspect the
packed file list:

```sh
TEST_DATABASE_URL=postgresql://... bun run check:release
TEST_DATABASE_URL=postgresql://... bun pm pack --dry-run
```

`prepack` runs the release check and fails when `TEST_DATABASE_URL` is absent, so
a package cannot be packed while silently skipping PostgreSQL coverage. Publish
the package before adding it to a sibling application; do not commit sibling
`file:` dependencies because their Docker and CI build contexts cannot resolve
this workspace. After publication, follow the consumer's migration runbook to
stop its old worker, adopt existing tables, and switch producers and workers
without dual delivery.
