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
- `@krak-stack/notifications/transport/push` provides push payload v1 and a composite APNs/FCM transport.
- `@krak-stack/notifications/transport/push-apns` provides the HTTP/2 APNs adapter.
- `@krak-stack/notifications/transport/push-fcm` provides the FCM HTTP v1 adapter.
- `@krak-stack/notifications/direct` provides transient dispatch without SQL or a queue.
- `@krak-stack/notifications/unsubscribe` provides signed account-wide email unsubscribe links and one-click form schemas.
- `@krak-stack/notifications/testing` provides fake transport and reminder-handler layers.

## Database Ownership

Consumers provide one `PgClient` layer from `@effect/sql-pg`, exposing both
`PgClient` and `SqlClient` from the same pool. The domain uses `PgClient.json`
for JSON SQL parameters; canonical JSON remains reserved for idempotency checks.
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
- `notification_email_unsubscribes`

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
import type { SqlClient } from "effect/sql";
import type { PgClient } from "@effect/sql-pg";

declare const sqlLayer: Layer.Layer<SqlClient.SqlClient | PgClient.PgClient>;
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

## Scheduled batch execution

`NotificationRuntime.runBatch()` (also exported as `runBatch` from `/runtime`)
processes durable delivery and reminder queues without starting permanent worker
fibers. Provide the same runtime and transport layers as above, but **do not**
start `notificationWorkersLayer`. Acquire `NotificationService.layer` before
the runtime on a fresh database; deployed jobs can use `layerWithoutMigrations`
after the web migration step completes. All layers must share one SQL pool.

```ts
const summary =
  yield * NotificationRuntime.use((runtime) => runtime.runBatch());
yield * Effect.logInfo("Notification batch finished", summary);
```

Defaults: two passes, 30,000ms between target start times, 50,000ms to claim work,
10,000ms additional shutdown grace, 2,000ms empty-queue wait, one delivery worker.
Override these with `passes`, `intervalMillis`, `maxRunMillis`,
`shutdownGraceMillis`, `idleMillis`, and `deliveryConcurrency` (1–8).
`dueBatchSize` remains a runtime-layer option, defaulting to 100. Each pass calls
`enqueueDue` once; durable overflow and future retries remain for later runs.
An empty pass exits promptly but still waits for the next configured pass.

The result reports completed passes, elapsed time, delivery outcomes (`sent`,
`retrying`, `failed`, `suppressed`, `skipped`), completed reminder jobs and
`stopReason` (`completed` or `time-limit`). `sent` means provider acceptance,
not confirmed receipt. Counts describe this invocation, not global queue totals.
Reminder-job counts include acknowledged stale/skipped work.

Empty-queue timeouts stop waiting without interrupting an acquired provider
call. At the claim deadline no new iteration starts; in-flight work can finish
within grace. Exceeding the hard limit fails with `NotificationBatchTimeoutError`;
infrastructure failures also fail the invocation. Individual provider failures
are recorded as outcomes and do not fail the job. Abrupt shutdown remains
recoverable and at least once: a provider-accepted message may be duplicated.

Run the command every minute with cron `* * * * *`, no overlapping jobs, zero
infrastructure retries and an infrastructure deadline of 90 seconds. The SDK
performs the second pass 30 seconds after the first pass's target start; it does
not add a 30-second sleep after processing completes. Slow passes do not overlap.
Container startup, backlog and skipped overlapping jobs mean this is an
approximate cadence, not a 30-second delivery SLA. Do not use `*/30 * * * *`.

When upgrading from the Effect RC runtime, stop old workers and pause old web
publishers before running web migrations and starting stable-Effect jobs. Use a
maintenance cutover, not a mixed-RC/stable rolling deployment. Effect owns the queue schema
upgrade from `completed` to `state`; old and new runtime processes must not share
the upgraded queue concurrently. No notification ledger reset is needed.

## Email Adapters

Publisher code can validate and persist rendered email without installing or
configuring a provider. The payload contains content, sender metadata, and an optional unsubscribe URL:

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

## Native Push Adapters

Push adapters use Effect Crypto for ES256/RS256 signing and Effect HttpClient for
provider calls. APNs uses `@effect/platform-node`'s scoped Undici dispatcher with
HTTP/2 enabled; install that optional peer when importing the APNs adapter.
FCM uses the fetch-backed Effect client and needs no provider SDK.

```ts
import { Effect, Layer } from "effect";
import { ApnsPushTransport } from "@krak-stack/notifications/transport/push-apns";
import { FcmPushTransport } from "@krak-stack/notifications/transport/push-fcm";
import { makePushTransport } from "@krak-stack/notifications/transport/push";
import { NotificationTransportRegistry } from "@krak-stack/notifications/transport";

export const pushRegistry = Layer.unwrap(
  Effect.gen(function* () {
    const apns = yield* ApnsPushTransport;
    const fcm = yield* FcmPushTransport;
    return NotificationTransportRegistry.layer([
      makePushTransport({ apns, fcm }),
    ]);
  }),
).pipe(
  Layer.provide(Layer.merge(ApnsPushTransport.layer, FcmPushTransport.layer)),
);
```

Both adapters expose `layerWithClient` for injecting an Effect HttpClient in tests
or custom deployments. A custom APNs client must support HTTP/2. The optional Node
client is loaded only when acquiring `ApnsPushTransport.layer`; importing
`layerWithClient` does not require `@effect/platform-node` to be installed.

On Bun, install `@effect/platform-bun` and replace the APNs layer above with:

```ts
import { BunHttpClient } from "@effect/platform-bun";

const apnsLayer = ApnsPushTransport.layerWithClient.pipe(
  Layer.provide(BunHttpClient.layerOptions({ protocol: "http2" })),
);
```

Do not use Bun's Node/Undici compatibility shim for the default APNs client.
Publishers only need the domain service and SQL; provider credentials and HTTP
clients belong to the dispatching process, not to publication code.

Configure APNs with `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_TOPIC` (bundle ID), and
`APNS_PRIVATE_KEY` (PKCS#8 PEM `.p8` contents). `APNS_SANDBOX` defaults to `false`;
set it to `true` for development-signed installations. Do not mix sandbox and
production tokens in one adapter's audience. Configure FCM with `FCM_PROJECT_ID`,
`FCM_CLIENT_EMAIL`, and `FCM_PRIVATE_KEY` (service account PKCS#8 PEM). Enable
Firebase Cloud Messaging HTTP v1 and grant that account messaging permission.
PEM configuration supports actual newlines or literal `\n` escapes.

Persist `channel: "push"`, `payloadVersion: 1`, and this payload:

```ts
const payload = {
  provider: "apns", // "fcm" for Android
  title: "Rendered title",
  body: "Rendered body",
  data: { url: "/your/application/path" },
  androidChannelId: "updates", // Optional; create this channel in the Android app.
};
```

The ledger's `recipientAddress` is the sole destination token. Payload data is a
string-to-string record; the application owns its meaning and validation. APNs
reserves `aps` for its generated alert envelope. Provider acceptance returns the
provider message ID, not a receipt confirmation. APNs enforces its 4096-byte
payload limit. Authentication failures are unavailable, throttling/server failures
are retryable, and rejected messages are permanent. Explicit APNs `BadDeviceToken`/
`Unregistered` and FCM `UNREGISTERED` failures set `invalidRecipient: true` on
`NotificationTransportPermanent`. Applications can wrap the adapter to clear a
matching token; a payload error or sender/topic mismatch never triggers cleanup.

FCM OAuth refreshes are serialized per adapter instance and reuse the cached token
until one minute before expiry; a 401 invalidates it for the next attempt. Both
adapters preserve `Retry-After` delays on retryable responses, including responses
without JSON bodies. FCM quota failures wait at least one minute. The durable
runtime uses the later of this provider deadline and its exponential backoff.
Without `androidChannelId`, FCM omits the channel override and Android uses its
configured fallback channel. Neither adapter creates native channels or requests
OS permission. Foreground display and notification-tap navigation are app-owned.

The package does not own installations, device authentication, permission state,
account linking, token rotation, localization, or application routes. Delivery-only
publications can set `recipientUserId: null`. In that case, applications must enforce
device preferences themselves and should recheck eligibility before dispatch.

## Email unsubscribe

`NotificationService.unsubscribeEmail({ recipientUserId })` stops all
`channel: "email"`, `purpose: "notification"` deliveries for that account,
across organizations, workspaces, event types, and future email-address changes.
It is idempotent and preserves the first unsubscribe timestamp.
`getEmailSubscription({ recipientUserId })` returns `{ recipientUserId,
unsubscribedAt }`; `null` means no account-wide opt-out (individual preferences
and endpoint suppressions can still block delivery).

Account opt-out takes precedence over even explicitly enabled event preferences.
It is checked at publication and again before provider dispatch, including
queued, scheduled, and retrying mail. Suppressed rows retain the
`email_unsubscribed` reason in the ledger. In-app notifications, other channels,
transactional mail, and existing endpoint suppression rules are unchanged.
An unsubscribe cannot recall mail already being dispatched or accepted by a
provider. Direct mode does not consult this state and should not be used to
bypass notification consent.

This state is separate from both `notification_settings` and address-based
`notification_suppressions`; resetting either does not undo an account opt-out.
This release adds no public resubscribe-token operation. Any future re-enable
flow must require explicit authenticated consent; an unsubscribe token must
never authorize resubscription or other account mutations.

### Generate a secure link

```ts
import { Config, Effect, Layer } from "effect";
import { NotificationService } from "@krak-stack/notifications";
import { EmailUnsubscribe } from "@krak-stack/notifications/unsubscribe";

const unsubscribeLayer = Layer.unwrap(
  Effect.gen(function* () {
    const secret = yield* Config.Redacted("NOTIFICATION_UNSUBSCRIBE_SECRET");
    const endpoint = yield* Config.NonEmptyString(
      "NOTIFICATION_UNSUBSCRIBE_URL",
    );
    return EmailUnsubscribe.makeLayer({
      secret,
      endpoint, // https://app.example.com/notifications/unsubscribe
      audience: "my-app:production",
      // Default: 180 days. Include any scheduling delay in the lifetime.
      tokenTtlMillis: 180 * 24 * 60 * 60 * 1000,
    });
  }),
).pipe(Layer.provideMerge(NotificationService.layer));
```

Provide the same shared PostgreSQL layer as the domain/runtime composition.
The signing secret must be a securely generated, server-only secret of at least
32 characters. Do not reuse an authentication secret. Keep it consistent across
web and publishing processes. Changing it invalidates old links; retain it for
the supported lifetime of already-sent mail. Use a distinct audience for each
application/environment, and never share package tables between independent
applications whose account identifiers can collide.

```ts
const unsubscribeUrl =
  yield *
  EmailUnsubscribe.use((unsubscribe) =>
    unsubscribe.createLink({ recipientUserId: user.id }),
  );
```

Derive `user.id` from trusted application policy. Links contain signed,
versioned HMAC-SHA-256 claims bound to that user and audience, and expire after
the configured lifetime. They are bearer capabilities for **unsubscribe only**:
anyone with a forwarded message can unsubscribe its original account. Claims
are encoded, not encrypted. Do not place email addresses or other sensitive
data in them, log the full URL/token, or send them to analytics.

Render the localized link in both text and HTML footers using the application's
escaped template renderer. Also persist it as `payload.unsubscribeUrl` in
`EmailPayloadV1`; the SDK does not edit rendered bodies. SES and SMTP emit exactly
one `List-Unsubscribe: <https://…>` header and one
`List-Unsubscribe-Post: List-Unsubscribe=One-Click` header when this optional
field is present. URLs must be printable ASCII (serialize Unicode URLs with
`new URL(value).toString()`) and at most 978 characters to fit SES header limits.
Payload version 1 without the field remains compatible.
Only attach these links to optional account notification emails, not to direct
authentication or transactional emails. Reuse the same rendered snapshot and
link on idempotent publication replays rather than generating a new expiry.

### Application-owned HTTP integration

The SDK intentionally registers no routes. See the complete
[KrakStack route example](https://github.com/krakcons/krakstack/blob/main/src/agent-examples/notification/unsubscribe.tsx)
and its adjacent schema and tests. The example is not mounted on the KrakStack
documentation site; integrate it into the consuming application and import
`@krak-stack/notifications/unsubscribe` instead of workspace source paths.

- Serve the configured HTTPS endpoint without login, cookies, CAPTCHA, or
  locale/HTTPS redirects. Exempt this capability-authenticated endpoint from
  session-based CSRF middleware, not the rest of the application.
- **GET** calls `validateToken({ token })` and displays an English/French
  confirmation form. It never changes state, so link scanners do not unsubscribe.
- **POST** decodes `EmailUnsubscribePost`, which requires
  `List-Unsubscribe=One-Click`, then calls `unsubscribe({ token })`. Accept both
  `application/x-www-form-urlencoded` and `multipart/form-data`. The same form
  supports manual confirmation and RFC 8058 mail-client one-click requests.
- Use only the verified token to select the user. Never use a user/tenant/email
  ID supplied separately in the request, or the logged-in browser's account.
- Return 200/204 after persistence, including repeated requests, without a
  redirect or further confirmation. Invalid/expired tokens return 400 with no
  account details; storage/crypto failures return 503 so requests can be retried.
- Use `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, no third-party
  content, and URL redaction in proxy/server/telemetry logs. Bound request sizes
  and rate-limit abuse without preventing legitimate one-click requests.
- Configure the sending provider to DKIM-sign both unsubscribe headers and
  verify the delivered message's `DKIM-Signature` `h=` list. Headers alone do
  not guarantee a native unsubscribe button; mailbox providers decide whether
  to offer one. SMTP operators must ensure their relay preserves and signs them.

Authenticated account-settings handlers can call `unsubscribeEmail` directly,
but must derive the account from trusted authentication and explicitly authorize
the application-wide effect. Organization/workspace roles alone do not authorize
changing a recipient's global consent.

## Delivery Semantics

### Application dispatch policies

`@krak-stack/notifications/policy` exports `NotificationDispatchPolicy`, an
optional Effect context reference. Its `check(delivery)` returns `Allow`,
`Suppress { reason }`, or `Defer { reason, until }`. Supply the implementation
when acquiring `NotificationRuntime`, after capturing its application dependencies.
Built-in preferences, account opt-outs, and endpoint suppressions still apply.
Errors and invalid/past deferrals fail closed and use infrastructure queue recovery.

For consent-sensitive publications set `delivery.dispatchPolicy` to the policy's
`key`. The requirement persists in reserved delivery references and participates
in the request fingerprint. A worker without the matching policy cannot dispatch
that delivery. Existing publications without this option keep their fingerprints
and default behavior. Caller references cannot use the reserved `krakstack.` prefix.

Deferral ends the current queue generation, records a skipped/deferred attempt,
releases the unused provider attempt budget, and schedules a new generation.
It does not report provider acceptance. The scheduler must run to resume it.
In-flight provider calls cannot be recalled; checks are not an atomic transaction
with the external provider. Direct mode does not apply dispatch policies.

- `publish` stores an optional rendered inbox and channel-neutral delivery snapshots under caller-provided idempotency keys.
- Publication and reminder idempotency keys are global. SHA-256 fingerprints cover immutable scope, event/handler, inbox, payload, schedule, expiry, attempt budget, and sorted caller references; changed replays fail with `NotificationIdempotencyConflictError`.
- Delivery-only publication supports non-account recipients by setting `recipientUserId` to `null`; inbox and preference operations require `RecipientNotificationScope`.
- Per-delivery references persist application, opportunity, organization, or other caller correlations transactionally; every public namespace beginning `krakstack.` is reserved for package metadata.
- Transactional delivery bypasses preferences and account email opt-outs. Notification-purpose delivery resolves event, workspace, organization, then recipient defaults deterministically; an account-wide email opt-out always wins over preferences.
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
dispatch, generation guards, push request envelopes, Effect signing, concurrent
OAuth refresh, and provider error/backoff handling. It does not send live pushes.
`test/integration.test.ts` runs only when
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

From the workspace root, run `bun run version:packages` for pending changesets,
review the resulting version/changelog and
lockfile, then run the package release checks and pack inspection again before
publishing from `packages/notifications` with `bun publish --access public`.
Publishing and consumer dependency upgrades are separate steps. The package does
not need live APNs/FCM credentials for release checks; physical-device delivery
still requires a separate smoke test in the consumer application.
