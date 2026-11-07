# Legacy administration compatibility workspace

> This private workspace now contains only compatibility adapters and regression
> tests. The implementation is part of `@krak-stack/notifications/admin`.
> Use [the notification administration guide](../notifications/ADMIN.md) and the
> `notifications-contacts`, `notifications-campaigns`, `notifications-operations`
> registry items. The historical notes below describe the original implementation;
> old package names and custom cursor UI integration are no longer installation guidance.

KrakSend is installed inside a host application. It adds communication tooling,
not accounts, organizations, a project directory, or a separate login system.
KrakAuth is not a dependency. The host owns administrative access and any tenant
isolation. Use separate databases/schemas for independent installations and
environments; this initial interface is installation-wide, not tenant-aware.

## Status

This is an initial email release, not a complete communication platform.
It includes contacts with one immutable email endpoint, profile updates,
paginated browsing, explicit optional-email consent and history, idempotent
rendered-email publications, worker-side consent enforcement, a protected admin
HTTP contract, a controlled contact admin view, and authenticated delivery-feedback
ingestion with bounce/complaint suppression. It also includes immutable bilingual
campaigns, audience snapshots, resumable batch publication, pause/resume/cancel,
sender/environment safeguards, a protected campaign view, and delivery reports.

Not implemented yet: verification and
signup flows, endpoint replacement, topics, imports, reusable templates, open/click
analytics, productized push installation management, or SMS. Production use still
requires the host integrations and operational review below.

The engine's policy hook supports deferral for future campaign orchestration;
this does **not** mean a campaign module already exists.

## Installation and release ordering

The workspace is currently unpublished. Build with `bun run send:build` from the
repository root. The pending changesets target notifications 0.3.x and the initial
send 0.1.x release. Publish the compatible notification engine before KrakSend,
then release the registry component. Do not add sibling `file:` dependencies to
consuming applications.

Exports:

- `@krak-stack/send`: `KrakSend` Effect service.
- `/schema`: validated inputs/results and typed domain errors.
- `/migrations`: versioned product migrations.
- `/policy`: `sendDispatchPolicyLayer` and `sendRuntimeLayer`.
- `/unsubscribe`: `SendUnsubscribe`, signed contact-specific email withdrawal links.
- `/unsubscribe.routes`: `makeSendUnsubscribeRoutes`, public confirmation and one-click POST routes.
- `/feedback`: `SendFeedback` and the scoped `feedbackReconciliationLayer`.
- `/feedback.ses`: normalization of supported SES event-publishing notifications.
- `/feedback.api`, `/feedback.api.builder`: optional host-authenticated feedback ingestion API.
- `/api`: `SendAdminApi`, `SendAdminGroup`, `SendAdmin`, `CurrentSendAdmin`.
- `/api.builder`: `sendAdminHandlers`, `sendAdminRoutes`.

## Compose the runtime

```ts
import { NodeServices } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { NotificationService } from "@krak-stack/notifications";
import { notificationWorkersLayer, ReminderHandlerRegistry } from "@krak-stack/notifications/runtime";
import { sesEmailTransportRegistryLayer } from "@krak-stack/notifications/transport/email-ses";
import { KrakSend } from "@krak-stack/send";
import { sendRuntimeLayer } from "@krak-stack/send/policy";

// postgresLayer is the host's shared PgClient layer.
const domain = KrakSend.layer.pipe(
  Layer.provideMerge(NotificationService.layer),
);
const runtime = sendRuntimeLayer.pipe(
  Layer.provideMerge(domain),
  Layer.provide(sesEmailTransportRegistryLayer),
  Layer.provide(ReminderHandlerRegistry.emptyLayer),
  Layer.provide(postgresLayer),
  Layer.provide(NodeServices.layer),
);
const running = notificationWorkersLayer.pipe(Layer.provideMerge(runtime));
```

Keep the scoped runtime alive. For bounded jobs, provide the same composed
runtime to `NotificationRuntime.runBatch` instead of starting the worker layer.
Run the scheduler as well as delivery workers for scheduled sends and retries.

`KrakSend.layer` acquires the engine, runs its own PostgreSQL migrations, then
exposes methods. `PgMigrator.run` currently requires the platform services shown
above. All producers/workers must use the same pool/schema and migration
ownership. Do not also operate legacy notification workers for these deliveries.

**Always use `sendRuntimeLayer` for KrakSend deliveries.** Publications require
the named `kraksend.v1` policy. A plain worker fails closed instead of delivering
without contact consent. Original engine suppressions and account preferences
still run, and consumers without required policies keep their existing behavior.

## Contacts and consent

```ts
const contact = yield* KrakSend.use((send) => send.createContact({
  email: "person@example.com", name: "Person", locale: "en",
}));

yield* KrakSend.use((send) => send.recordEmailConsent({
  contactId: contact.id,
  requestId: consentRequestId,
  status: "subscribed",
  source: "host-signup",
  actor: trustedHostActor,
  noticeVersion: "optional-email-v1",
}));
```

New contacts start with **unknown** consent. Creating/updating a profile never
subscribes it. Duplicate normalized addresses fail instead of merging records or
restoring consent. Email addresses are trimmed/lowercased like the engine; no
provider-specific dot/plus normalization is performed.

Consent changes are explicit trusted-server operations, not a public signup API.
The host must validate the evidence/authorization before granting consent. The
history records source, actor, notice version, timestamp, and request ID; richer
evidence and topic-specific choices remain future work. Replaying an old grant
does not overwrite a later withdrawal. Reusing a request ID with changed input
fails. This first release controls all optional email, not push/SMS.

## Queue rendered email

```ts
const result = yield* KrakSend.use((send) => send.queueEmail({
  requestId: messageRequestId,
  contactId: contact.id,
  purpose: "notification",
  eventKey: "application.update",
  email: { subject, html, text, unsubscribeUrl: hostContactUnsubscribeUrl },
}));
```

Optional notification/marketing email requires a subscribed contact and an HTTPS
unsubscribe URL. Use `SendUnsubscribe.createLink({ id: contact.id })` and render
a visible escaped link in the email. Do not use an account unsubscribe token for
a contact. Generate the URL once and persist it with the rendered message for
idempotent publication replays.

### Public contact unsubscribe

Provide `SendUnsubscribe.makeLayer({ secret, audience, endpoint, tokenTtlMillis })`
with the same `KrakSend` layer used by the host. `secret` is a redacted,
installation-specific random secret of at least 32 characters; `audience` must
uniquely identify the installation and environment. Use a dedicated key, not an
account unsubscribe key. `endpoint` must be HTTPS with no credentials or fragment;
the default token lifetime is 180 days. Key replacement invalidates existing links.

Mount `makeSendUnsubscribeRoutes` outside login, cookie-CSRF, locale redirects,
request-URL logging, tracing that records URLs, and analytics middleware. Pass
the path matching `endpoint`, escaped confirmation HTML, and localized messages.
`src/agent-examples/send/unsubscribe.tsx` supplies an English/French Paraglide
example. It is not mounted on the public documentation site. The HTML must POST
to the same URL and include `List-Unsubscribe=One-Click`. Keep the token in the
query, do not place it in logs, analytics, or third-party resources.

GET validates the capability without changing consent. POST accepts browser and
RFC 8058 form bodies without cookies, login, or redirects, with an 8 KiB body
limit. Responses disable caching, referrers and indexing; confirmation pages use
a restrictive CSP. Invalid tokens receive a generic 400 and persistence failures
receive a retryable 503, never a false success. Host edge rate limits are still
required. Exempt only this capability-based endpoint from cookie-CSRF, not admin
writes. Configure provider unsubscribe headers and DKIM according to RFC 8058.

Tokens bind the contact ID, purpose, audience and expiry, never an email address.
They are signed bearer capabilities, not encrypted data: do not treat contact IDs
as secrets. Repeated and concurrent POSTs while unsubscribed do not add duplicate
events. A still-valid old link withdraws again after re-subscription. Withdrawal
affects all optional email for this contact in this installation, not accounts,
other contacts, push, SMS or essential transactional email. In-flight provider
calls cannot be recalled. This release has no individual-token revocation or key
ring; plan rotation and expiry accordingly.

Transactional classification is trusted server policy and bypasses optional-email
consent, but never endpoint suppression. This operation is intentionally absent
from the browser admin API. Do not expose a client-controlled transactional bypass.

Replays return the original delivery ID without rebuilding a publication from
changed profile data. Changed immutable input fails. Persist the rendered email,
URL, schedule, and expiry before replaying; do not regenerate tokens each time.
Product request and engine publication are in one shared SQL transaction; tests
cover rollback and concurrent replay. Queueing from a host business transaction
also requires the same client/transaction context, otherwise use an outbox.

Provider calls remain **at least once**. The engine's `sent` means provider
**accepted**, not inbox/device delivery or reading. No delivery rate is inferred.

## Host-protected administrative HTTP

The API is `/api/send/contacts`, contact detail/profile updates, and contact email
consent history/change endpoints. `SendAdmin` has no default implementation.
`sendAdminRoutes` cannot be acquired without the host-provided middleware.

```ts
import { Effect, Layer } from "effect";
import { SendAdmin, CurrentSendAdmin } from "@krak-stack/send/api";
import { sendAdminRoutes } from "@krak-stack/send/api.builder";

const guard = Layer.effect(SendAdmin, Effect.gen(function* () {
  const host = yield* HostAdminAccess;
  return (httpEffect) => Effect.gen(function* () {
    const actor = yield* host.requireCommunicationAdmin;
    return yield* httpEffect.pipe(
      Effect.provideService(CurrentSendAdmin, { reference: actor.auditReference }),
    );
  });
}));

// Add to the host HTTP router; supply KrakSend and its domain dependencies.
const routes = sendAdminRoutes.pipe(Layer.provide(guard));
```

`HostAdminAccess` is illustrative host-owned policy, not a shipped service.
Map its failures to the declared Unauthorized/Forbidden errors. Protect the
frontend route too. Keep host CSRF/origin controls for cookie-authenticated writes.
Do not mount these admin routes on the public documentation site. The initial
group requires full communication-admin authority; narrower permissions belong
in the host guard using endpoint metadata. Administrative consent events get
their actor from middleware, not browser-supplied identity fields.

## Delivery feedback

Provider acceptance remains the engine's `sent` state. Delivery confirmations,
permanent bounces, transient/undetermined bounces and complaints are separate
immutable facts; they do not rewrite delivery status or grant/withdraw consent.
No opening, reading, or delivery-rate metric is inferred from acceptance.

`SendFeedback.layer` depends on the host's shared `KrakSend`, `NotificationService`
and `SqlClient` layers. Acquiring KrakSend runs the additive feedback migration.
Call `feedback.record({ provider, eventId, providerMessageId, recipientAddress,
kind, occurredAt })` only from trusted server code after authenticating the source.
Kinds are `delivered`, `hard_bounce`, `soft_bounce`, and `complaint`.

The deduplication key is `(provider, eventId, normalized recipientAddress)` so one
provider envelope can describe several recipients. Keep the original stable
provider/envelope event ID through retries and dead-letter redrives. A duplicate
returns the stored result; changed message ID, kind or event timestamp fails with
`SendConflict`. Received time is stored separately from provider occurrence time.
Only normalized facts are retained, not raw envelopes or email content.

Feedback must match exactly one accepted email attempt by provider, provider
message ID and normalized recipient address, and the delivery must belong to
KrakSend. Address-only matching is never used. Historical accepted attempts can
match even when the delivery snapshot contains another provider message ID.
Unknown, early, mismatched and ambiguous events remain `pending`, with no guessed
suppression. Do not translate `pending` into a confirmed delivery or rejection.

Permanent bounces and complaints set an indefinite engine endpoint suppression
for **all** email purposes, including transactional messages. Already-queued
messages are checked before transport invocation. Other contacts are unaffected.
Soft bounces and delivery confirmations do not create or clear suppressions.
Events, correlation and suppression commit in one transaction. Repeated applied
events do not recreate a suppression that an operator explicitly reset; a new
adverse provider event can suppress again. Suppression review/reset remains a
trusted operational responsibility, not a public contact action.

### Authenticate ingestion

`sendFeedbackRoutes` exposes `POST /api/send/feedback` for normalized events.
It requires a `SendFeedbackAccess` implementation and has **no default guard**.
The host must authenticate a provider or a private ingestion worker and provide
`CurrentFeedbackSource` with its trusted `provider`. The payload cannot select
the provider identity. This is separate from `SendAdmin`: granting a browser
administrator access does not grant provider-ingestion authority.

This endpoint is **not a raw SNS webhook**. For SES, prefer a host-owned,
IAM-protected SNS-to-SQS pipeline. Verify the expected topic, AWS account, region,
configuration set and environment before normalizing a notification. If the host
accepts SNS HTTP notifications, it must verify signatures and subscription/topic
ownership itself. Do not trust a JSON `TopicArn` without authentication, blindly
follow certificate/subscription URLs, or expose normalization as authentication.
One installation currently assumes one sending account per provider key. Use
separate installations for independent accounts/environments; multi-account
provider-ID routing is not implemented.

`normalizeSesFeedback` accepts an `eventId` plus a schema-validated SES
**event-publishing** notification with `eventType` `Bounce`, `Complaint`, or
`Delivery`. Configure the SES sending identity's default configuration set to
publish these events to the trusted pipeline. Decode the verified SNS `Message`
with `Schema.fromJsonString(SesFeedbackNotification)` from `/schema`, then
normalize it and call `SendFeedback.record` for every returned recipient.
Use the original SNS `MessageId` as the stable event ID, not a newly generated ID.
Legacy `notificationType` envelopes and unrelated SES event types are not handled
by this adapter. Transient and undetermined bounce types normalize to soft bounces.

### Reconcile early callbacks

Keep `feedbackReconciliationLayer` running with the same `SendFeedback` layer as
ingestion. It checks up to 25 pending facts every 30 seconds and retries typed
failures without logging addresses or raw payloads. The database backlog survives
worker restarts. Alternatively, schedule `feedback.reconcile({ limit: 100 })`
through the host's existing worker infrastructure. The limit is bounded at 100.
Parallel workers use row locks with `SKIP LOCKED`; last-checked ordering rotates
unmatched events instead of letting an old batch starve newer facts.

Monitor the pending backlog and failed batches. A callback arriving before
acceptance cannot suppress until acceptance is persisted and reconciliation
runs; in-flight messages cannot be recalled. Permanent mismatches and ambiguous
provider IDs need operator investigation. Retention, dead-letter review tooling,
provider-signature verification and source-specific rate limits remain host-owned.

## Campaigns

Provide `SendCampaigns.layer` with the same `KrakSend`, `SendUnsubscribe`, SQL and
sender safety layers as the notification workers. Draft creation is idempotent by
request ID and trusted actor. Content is immutable, with English and French plain
text copies and localized visible unsubscribe links. There is no template or HTML
editor in this increment. The controlled view creates an all-subscribed audience;
the service also supports explicit contact IDs (up to 1,000).

Scheduling checks sender verification and snapshots currently subscribed contacts
exactly once. Later subscribers are not added. Profile locale/address and consent
are checked during publication; consent, suppression, campaign status, sender
verification and environment allowlisting are checked again before dispatch.
Unknown consent never counts as subscribed.

### Sender and environment safety

`SendCampaignSafety` defaults to denying campaign sends. Supply
`makeCampaignSafetyLayer({ environment, sendingEnabled, allowedRecipients },
verifySender)` to **both publication and notification workers**. Configuration and
verification are trusted host inputs, never browser-controlled flags. Non-production
recipients must be explicitly allowlisted. An empty list denies all non-production
recipients; production still requires sending enablement and verified senders.
Blocked recipients are recorded as skipped, not silently sent.

`src/agent-examples/send/ses-safety.ts` is a real SESv2 `GetEmailIdentity` adapter:
the host maps each approved exact sender address to its SES identity, supplies a
regional authenticated client, and needs `ses:GetEmailIdentity` permission. A
verified domain does not approve every address. Missing identities, revoked
verification, malformed responses and provider errors fail closed. The adapter
does not cache verification; account/region, sandbox recipient restrictions,
quotas, DKIM/SPF/DMARC, credentials and production access remain host-owned.

### Durable worker composition

Run `campaignWorkflowLayer` and `campaignSchedulerLayer` from `/campaign.workflows`
with the host's persistent Effect `WorkflowEngine` and shared `SendCampaigns` layer.
Provide the scheduler with the registered workflow engine/layer before acquiring
it. The scheduler scans due work every 10 seconds; each versioned workflow publishes
at most 25 recipients in one SQL transaction. `batchNumber` advances with committed
publication; concurrent/replayed generations cannot duplicate a publication.
Failures retry through durable clocks. Paused-generation races consume their
generation so resuming does not get stuck behind a completed workflow ID.
The memory workflow engine is only a test fixture, not production durability.

Keep the existing notification scheduler/delivery worker and feedback reconciliation
worker running too. Campaign completion means **fan-out finished**, not provider
acceptance or delivery. Pausing also defers already-queued messages without spending
provider attempts. Cancellation skips pending recipients and suppresses queued
messages at dispatch; already in-flight or provider-accepted sends cannot be recalled.
Completed campaigns can still be paused/cancelled to control undelivered queue work.
Resuming a completed/paused campaign may briefly return it to scheduled state until
the next batch confirms there are no pending recipients.

### API, view and reports

`sendCampaignRoutes` from `/campaign.api.builder` exposes `/api/send/campaigns`,
detail, report, schedule and transition endpoints. They require the same host-owned
`SendAdmin` middleware as contacts; creation gets its audit actor from middleware.
Add `SendCampaignGroup` to a combined host HttpApi if desired. There is no default
authorization, public administration route, KrakSend account or KrakAuth dependency.

Install `@krak-stack/kraksend-campaigns` or import
`@krak-stack/registry/send/campaigns`. The controlled `SendCampaignAdmin` accepts
authorized page/detail/report data, English/French messages and mutation callbacks.
The host examples `campaign.atom.ts`, `campaign.admin.tsx` and `campaign.messages.ts`
show query retention, detail-scoped optimistic pause/resume with rollback,
authoritative creation/scheduling/cancellation and mutation-owned invalidation.
The host panel refreshes mounted lists/details/reports every 15 seconds.
Protect the frontend route and cookie-authenticated writes with host
authorization and CSRF controls.

Reports count distinct snapshot recipients/publications: pending, published, skipped,
accepted, failed, suppressed, delivery-confirmed, hard-bounced and complained.
Repeated provider events do not inflate counts. Feedback categories can overlap;
they are facts, not mutually exclusive delivery states. Accepted is not confirmed,
and confirmed is not read. No open/click tracking or inferred delivery rate exists.

## Admin view

### Sending operations and visibility

`SendOperations.layer` depends on the same `KrakSend`, `NotificationService` and
SQL layers. Acquiring KrakSend applies additive migration `0004_operations_visibility`:
feedback ingestion sequence IDs, a correlated-feedback index, and administrative
suppression audit history. Existing feedback/delivery records remain intact.

Mount `sendOperationsRoutes` from `/operations.api.builder` with host-owned
`SendAdmin` middleware. `/api/send/operations` provides:

- `/overview`: global KrakSend email publication/current-state statistics, distinct
  delivery confirmations, hard/soft bounces and complaints, unmatched feedback
  event counts, and current active suppression-record counts.
- `/deliveries` and `/deliveries/:id`: server-filtered activity and inspection of
  recipient/contact, campaign, subject, purpose, status, scheduling, provider IDs,
  error diagnostics, attempt generations/outcomes and timestamps.
- `/feedback`: individual recipient feedback records, including hard/soft bounces,
  complaints, confirmations and **pending/unmatched** events. Provider occurrence,
  receipt, reconciliation and application times are distinct. Default frontend
  browsing shows bounces; filters expose every supported kind/correlation state.
- `/suppressions`: active, expired or all installation-wide email suppression
  records, with endpoint, purpose, reason and expiry. Includes provider and manual
  suppressions, including endpoints without a contact profile.
- `/suppression-history`: paginated administrative additions/removals with audit
  request ID, trusted actor, reason, previous reason and occurrence time. Automatic
  provider blocks retain their evidence in feedback, not a fabricated admin event.
- `/recipients`: pending, published or skipped members of a campaign snapshot,
  including skip reason and delivery links. These are not just successful deliveries.

Activity, recipient and suppression pagination is descending UUID order; feedback
and audit history use descending ingestion sequence. Date windows are half-open
(`since <= timestamp < until`). Global delivery statistics use publication time;
pending feedback uses receipt time. Active suppression counts are current and do
not use the date window. Feedback categories may overlap and duplicates cannot
inflate delivery-level statistics. Suppression counts count records, not unique
addresses. No metric means read/opened or guaranteed inbox placement.

The boundary only exposes KrakSend-owned, installation-scope email deliveries.
Account/organization/workspace deliveries, push suppressions and unrelated engine
publications are not exposed. Suppression management is restricted to null-scope
email records; narrower host permissions can be enforced in the host middleware
per endpoint. Keep cookie-CSRF/origin checks on every administrative mutation.

Install `@krak-stack/kraksend-operations` or import
`@krak-stack/registry/send/operations`. `SendOperationsAdmin` is a controlled view;
the host owns data/filters/pagination and mutations. The `operations.atom.ts`,
`operations.admin.tsx` and `operations.messages.ts` examples retain previous query
successes and refresh only mounted operations/inspection views every 15 seconds.
Manual refresh is also available. Fetch/mutation errors remain visible, never
presented as empty successful results or successful unblocking.

`src/agent-examples/send/console.tsx` provides one **host-protected** frontend
entry point for contacts, campaigns and sending operations. It includes contact
profiles and paginated consent evidence, read-only bilingual campaign content,
campaign-to-recipient and delivery-to-campaign/contact/feedback drill-downs.
Campaign lists/reports refresh every 15 seconds. This is deliberately an integration
example, not a publicly mounted documentation-site admin route.

Maximum operational visibility does **not** mean exposing secrets: the operations
API omits rendered message bodies, signed unsubscribe URLs, arbitrary publication
references, worker claims and credentials. It shows the subject and operational
facts; campaign-authored plain text is visible in the protected campaign view.
Treat recipient addresses, diagnostics and evidence as private administrative data.

### Safe suppression management

POST `/operations/suppressions` with `{ requestId, email, reason }` creates an
indefinite all-purpose endpoint block. It refuses to overwrite an existing
all-purpose suppression, including provider evidence. Expired existing records can
be reviewed/removed before creating a new block. No consent event is generated.

POST `/operations/suppressions/:id/remove` with `{ requestId, version, reason }`
requires the exact opaque `version` returned by the reviewed list record. A later
provider update invalidates the version **even if the reason is unchanged**; refresh
and review before retrying. The version uses PostgreSQL's row transaction version,
not a long-lived identifier. Never cache removal authority across database restores
or re-use it as authentication. The host's admin authorization remains mandatory.

Mutations and actor-attributed audit evidence commit together. Repeated immutable
requests replay without duplicating history or undoing later changes. Request IDs
must be unique per administrative intent and retained across transport retries.
Removing a suppression does **not** subscribe the contact, clear account opt-outs,
alter feedback evidence, revive a failed/suppressed delivery, or resend mail.
A new adverse provider event can block the endpoint again. Provider-accepted or
in-flight messages cannot be recalled. There is no bulk unblock or feedback-delete UI.

Focused browser coverage:
`TEST_DATABASE_URL=postgresql://... bun run test:e2e -- e2e/send-operations.spec.ts`.
The English/French journeys use the unified console, real protected API/Postgres,
simulated provider feedback and fake transport. No production messages are sent.

The `kraksend-contacts` registry item installs the controlled `SendContacts` view.
Package consumers use `@krak-stack/registry/send/contacts`. Supply authorized page
data, locale/messages, create/withdraw callbacks, and pagination callbacks.
Creating a contact does not subscribe it; there is no bulk grant button.

`src/agent-examples/send/atom.ts` and `admin.tsx` show scoped Effect Atom queries,
optimistic withdrawal/rollback, authoritative invalidation, and English/French
Paraglide integration. New contacts have server-generated IDs and unknown page
membership, so creation waits for authoritative data. These examples are not
automatically mounted routes. Configure the client's trusted API base URL and
host authentication/CSRF transport before mounting.

## Tests and operational limits

`TEST_DATABASE_URL=postgresql://... bun run send:check` runs the package checks.
Never use the application's `DATABASE_URL` for tests. Isolated test schemas cover
consent, duplicate contacts, pagination, rollback, concurrency, and dispatch-time
withdrawal. HTTP tests verify host denial, trusted actor attribution, and error
redaction. No live provider calls occur.

Before production: configure sender verification, authenticated provider wiring,
retention, rate limits, environment allowlisting, and a host-specific security
review. This first schema keeps rendered requests/history; it does not yet ship
retention or erasure jobs. Do not put OTPs or other sensitive material here without
an appropriate retention strategy. Keep provider secrets out of requests/logs.

Focused browser regression tests use real PostgreSQL in isolated schemas:
`TEST_DATABASE_URL=postgresql://... bun run test:e2e -- e2e/send-unsubscribe.spec.ts`.
Install Chromium first with `bunx playwright install chromium`. The test starts a
loopback-only server per journey, never the public documentation app; it verifies
English/French confirmation, read-only GET, persistent withdrawal and suppression
of already-queued optional email. Failed runs retain traces/screenshots under
`test-results/`. Use a disposable test database, never `DATABASE_URL`.

`TEST_DATABASE_URL=postgresql://... bun run test:e2e -- e2e/send-campaign.spec.ts`
exercises the real React panel, Effect Atom client, protected API and PostgreSQL in
English/French, including creation, scheduling, pause/resume and confirmed
cancellation of queued work. Its guarded Vite host runs only on loopback and is
not mounted in the deployed application. All provider operations use fake transport.

Operational release checklist: migrate before starting workers; register all
versioned workflows on the persistent engine; check sender identity and environment
configuration in every worker; authenticate feedback and monitor pending events;
monitor overdue campaigns, pending recipients, queue retries and failed deliveries;
test pause/cancel and public unsubscribe; define retention/erasure and provider quota
limits before production rollout. This release does not implement a rate-control
dashboard, automated retention, alert provisioning or provider credential setup.
