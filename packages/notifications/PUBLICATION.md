# Canonical notification publication

`NotificationService.publish()` is the publication capability for applications and
server-side integrations. It uses one ledger, transaction, queue and delivery
runtime. Contacts are optional recipient associations, not another sending system.

The host owns business events, templates, recipient resolution, authentication,
authorization, installation isolation and message classification. KrakStack owns
publication persistence, immutable recipient associations, policy requirements,
scheduling, attempts, cancellation and retries. Inbox and APNs/FCM remain supported.

## Publication interface

```ts
import { NotificationService } from "@krak-stack/notifications";
import type { PublicationInput } from "@krak-stack/notifications/schema";

const receipt = {
  idempotencyKey: "orders:order-123:receipt:v1",
  scope: {
    recipientUserId: null,
    organizationId: "organization-1",
    workspaceId: null,
  },
  eventKey: "order.receipt", // Consumer-owned, not a KrakStack event.
  eventVersion: 1,
  deliveries: [
    {
      key: "email",
      channel: "email",
      recipient: { address: "buyer@example.com", name: null },
      policy: { kind: "transactional" },
      template: "order-receipt",
      payloadVersion: 1,
      payload: { subject: "Order receipt", text: "Your receipt…" },
      references: [{ namespace: "order", value: "order-123" }],
    },
  ],
} satisfies PublicationInput;

const published = yield * NotificationService.use((n) => n.publish(receipt));
```

Use the same interface for an account security notice: resolve the trusted account
address in the host and set `scope.recipientUserId` to that account identifier.
The host decides whether a notice is essential transactional mail or an optional
notification. Publication scope does not prove that an address belongs to an account.

For a newsletter, use `policy: { kind: "marketing", consent: ... }`, keep the
organization/workspace scope, and include unsubscribe support in `EmailPayloadV1`.
No login account or contact is required for either example.

## Recipient identity and scope

`recipient.address` and `recipient.name` are snapshots. A contact association is
optional: `recipient.contact: { id, endpointId }`. It coexists with all existing
scope fields, including an account association. Null fields match exact nulls;
they are not wildcard grants, tenant selectors or consent inheritance rules.

Contact resolution is available through
`NotificationContacts.resolveEmailRecipient({ id })`. It returns an address/name
snapshot and contact/endpoint identifiers. It does not grant publication permission
or create consent. The host must authorize contact access before resolving it.

Provide `contactRecipientPolicyLayer` from
`@krak-stack/notifications/admin/recipient` to **both** publisher and runtime when
using contact associations. This adapter validates the actual contact/endpoint/address
relationship and rechecks contact withdrawal. It is independent of the contact
publication adapter and campaigns. Missing adapters fail closed. Address-only
publication needs no contact layer or administration tables.

Never merge contacts/accounts by matching addresses. Account/contact relationships
are host-verified facts; KrakStack records the associations on accepted deliveries.
It does not introduce a universal person directory or assume one-to-one linking.

Changing a contact or account does not retarget existing deliveries. Endpoint
identifiers must represent immutable addresses. An address replacement needs a
different endpoint and applicable new consent; retain historical endpoint evidence.
The current contacts module does not expose an address-edit operation. If an
endpoint is deleted or changed outside that contract, its pending contact deliveries
are suppressed rather than sent to a different destination.

## Delivery policy

- `transactional`: bypasses subscription requirements, account email opt-out and
  optional preferences. Suppression, expiry, host authorization and additional
  required checks still apply.
- `notification`: account-linked delivery applies existing account opt-out and
  preference resolution. Contact-associated or non-account notifications must also
  declare a consent requirement.
- `marketing`: always requires an explicit consent requirement. Account opt-out
  and preferences also apply when account-linked. Marketing remains distinguishable
  in persisted deliveries and operations; it is not flattened into notification.

Optional email currently uses `EmailPayloadV1` with an absolute HTTPS
`unsubscribeUrl`. A URL alone is not consent. Its endpoint must withdraw the actual
applicable consent, not merely display a confirmation. Existing contact/account
signed unsubscribe routes retain their purposes and behavior. For contactless
consent, the host implements its authenticated or signed withdrawal endpoint and
records the exact consent subject/address/scope withdrawal described below.

### Built-in stored consent

```ts
import { NotificationEmailConsent } from "@krak-stack/notifications/consent";

// In a separately authorized consent-recording operation, never in publish:
yield *
  NotificationEmailConsent.use((consent) =>
    consent.record({
      requestId: "newsletter-opt-in-123",
      subject: { namespace: "newsletter", value: "subscriber-123" },
      recipientAddress: "reader@example.com",
      scope: {
        recipientUserId: null,
        organizationId: "organization-1",
        workspaceId: null,
      },
      purpose: "marketing",
      status: "granted", // "withdrawn" records withdrawal.
      actor: "verified-recipient-123",
      source: "explicit-opt-in",
      noticeVersion: "newsletter-notice-v1",
    }),
  );

// On the newsletter delivery:
const policy = {
  kind: "marketing",
  consent: {
    kind: "stored",
    subject: { namespace: "newsletter", value: "subscriber-123" },
  },
} as const;
```

The subject is a host-resolved consent identity, such as an immutable contact
endpoint identifier. Evidence is additionally bound to the exact normalized address,
scope and purpose. No subject naming convention grants permission. Unknown or
withdrawn evidence denies sending. Grants for another address, scope or purpose do
not apply. Creating/linking a contact never records a grant.

Consent events are audited, idempotent and append-only. Reusing a request ID with
different evidence conflicts. Replaying an old grant after withdrawal does not
subscribe again. A genuine later grant needs a new authorized consent operation
and request ID. Consent and publication can participate in an explicit host SQL
transaction, but publication never synthesizes consent evidence.

Existing contact consent is installation-wide historical evidence. It is not
automatically converted into endpoint/scoped consent. Existing contact-wide
withdrawal still blocks optional contact deliveries, even when a newer scoped grant
exists. Restoring that contact subscription requires its existing explicit consent
operation as well; linking or removing suppression does not restore it.

### Host policy extensions

Import `publicationPoliciesLayer` from
`@krak-stack/notifications/publication-policy`. Install versioned extensions on
both publisher and runtime. Each extension has `key`, `version` and
`check({ scope, eventKey, channel, publication, subject })`, returning the existing
`Allow`, `Suppress { reason }` or `Defer { reason, until }` decision.

Use `{ kind: "extension", key, version, subject }` for externally maintained
consent, or delivery `checks: [{ key, version, subject }]` for additional domain
eligibility. Extension subjects are serializable references, never callbacks or
caller-supplied permission booleans. The host must authorize which requirements
callers can select. A permissive extension must not be selectable to bypass a
message's required consent policy.

All requirements are conjunctive. Extensions cannot override built-in suppression,
preferences or withdrawal. Missing versions, invalid decisions and policy errors
fail closed. Eligibility is checked at acceptance and before every attempt;
scheduled work and retries do not freeze consent. Deferrals must be in the future.
Keep installed versions available for as long as persisted deliveries require them.
Checks should be read-only and idempotent: do not publish or perform irreversible
side effects from an eligibility check inside the publication transaction.

### Sending windows

`@krak-stack/notifications/sending-window` exports:

- `SendingWindow`: an Effect schema for `{ timeZone, start, end }`.
- `sendingWindowRequirement(configuration)`: validates and snapshots configuration
  into an existing publication-policy requirement. Returns an Effect; invalid
  configuration fails with `DispatchPolicyError`.
- `sendingWindowPolicy`: the package-owned `krakstack.sending-window@1` extension.

Register the policy on **both publisher and runtime**, alongside other extensions:

```ts
import { Layer } from "effect";
import { NotificationService } from "@krak-stack/notifications";
import { NotificationRuntime } from "@krak-stack/notifications/runtime";
import { publicationPoliciesLayer } from "@krak-stack/notifications/publication-policy";
import {
  sendingWindowPolicy,
  sendingWindowRequirement,
} from "@krak-stack/notifications/sending-window";

const policies = publicationPoliciesLayer([sendingWindowPolicy]);
const publisher = NotificationService.layer.pipe(Layer.provide(policies));
const runtime = NotificationRuntime.layer.pipe(Layer.provide(policies));
// Provide the existing shared Postgres, transport and reminder-handler layers
// to publisher/runtime as in the README composition example.

// Inside an Effect program, after resolving the recipient in trusted host code:
const overnight =
  yield *
  sendingWindowRequirement({
    timeZone: "America/Edmonton",
    start: "23:00",
    end: "05:00",
  });

const commonEmail = {
  channel: "email",
  recipient: { address: "reader@example.com", name: null },
  template: null,
  payloadVersion: 1,
};
const optionalEmail = {
  ...commonEmail,
  key: "optional-email",
  policy: { kind: "notification" },
  checks: [overnight],
  payload: {
    subject: "Optional update",
    text: "An update you requested.",
    unsubscribeUrl: "https://example.com/unsubscribe",
  },
} satisfies import("@krak-stack/notifications/schema").PublicationDeliveryInput;
const transactionalEmail = {
  ...commonEmail,
  key: "receipt-email",
  policy: { kind: "transactional" },
  payload: { subject: "Receipt", text: "Your receipt." },
} satisfies import("@krak-stack/notifications/schema").PublicationDeliveryInput;
```

Use these delivery definitions in the host's appropriate publications, with distinct
idempotency keys and event keys. The optional example assumes a verified account
recipient in `scope.recipientUserId`; non-account/contact optional mail must also
declare applicable consent. The window is an additional eligibility check, never
consent. The transactional delivery has no window check and is not delayed by
installing the policy. Any delivery can opt into its own window and timezone.

#### Local-time and DST semantics

- `start` and `end` must be zero-padded `HH:mm`, from `00:00` through `23:59`.
  Start is inclusive; end is exclusive, including at subsecond precision.
- `start < end` is an ordinary same-day interval. `start > end` crosses midnight.
  Equal endpoints are rejected, not interpreted as empty or all-day. Omit the check
  for unrestricted delivery.
- `timeZone` must be a named IANA timezone recognized by the runtime's timezone
  database, such as `America/Edmonton` or `UTC`. Raw numeric offsets and unknown
  zones are rejected. Worker-local time and `CurrentTimeZone` are never consulted.
- Eligibility follows the **actual local wall-clock reading** at the instant of
  the check. During fall-back, both occurrences of an included local time qualify.
  A narrow window can close between repeated intervals, then open again.
- Missing local times never qualify. For a `02:30`–`04:00` window on a day when
  the clock jumps from `01:59:59` to `03:00`, the first opening is `03:00`, not
  `03:30`. A window entirely within the gap waits for its next actual occurrence.
  Non-hour transitions and skipped calendar dates follow the same rule.

The host owns recipient timezone selection and any fallback decision. Pass the
resolved timezone explicitly; the package does not infer it from an address,
profile, server locale or organization. Keep runtime timezone databases current
and consistent across publishers and workers. The snapshot preserves the named
zone and local hours, not a frozen copy of timezone legislation. Future rule
updates can change the corresponding UTC opening.

#### Persistence, retries and compatibility

The helper encodes configuration deterministically in a package-owned policy subject.
Treat that subject as opaque and use the helper rather than constructing it manually.
This self-contained snapshot deliberately reuses existing publication metadata,
versioned checks and immutable fingerprints; no new columns or migrations are needed.
There is no mutable installation-wide window lookup. Do not replace or reuse the
package-owned policy identity for host implementations.

Identical publication replay returns the original delivery IDs. Changing hours,
timezone, policy version, adding or removing a check under the same publication key
conflicts. Preserve the original request when retrying publication; editing a
recipient's profile does not move accepted work into a new timezone. New intent
requires a new publication key and, where appropriate, cancellation of the old
delivery. Keep required policy versions installed while queued or retryable work
depends on them. Malformed persisted configuration, missing versions and calculation
errors fail closed.

Outside its window, the policy returns the existing `Defer` decision with the earliest
next actual opening. The engine durably records eligibility and does not spend a
provider attempt on deferral. Initial `scheduledFor` remains a lower bound; a later
schedule is rechecked when due, rather than being advanced to an earlier opening.
Manual retry also retains a later existing eligibility date.

At each provider attempt, including automatic/manual retries and restart recovery,
all applicable checks must allow. An allowed window does not skip other policies.
Another policy may defer beyond this window, in which case the next attempt checks
the window again. The runtime rechecks the built-in window after other eligibility
checks, and checks expiry again, so slow policy I/O cannot retain an earlier allow.
Expiry still cancels work; a next opening after expiry cannot revive it. Consent,
account unsubscribe, preferences and suppression are checked through existing paths,
including changes made while a delivery was deferred.

Run the existing scheduler and worker continuously, or use existing batch operations.
No window-specific worker schedule, queue or recurring-job system is required.
Offline workers, queue load, later policy deferrals and provider failures can delay
an attempt beyond an opening; the next attempt must still qualify. Windows govern
**provider-attempt eligibility**, not inbox arrival or an exact-time guarantee.
Provider calls cannot be recalled after they begin.

Existing publications without a window check retain their eligibility behavior and
need no window policy registration. This opt-in applies to canonical
`PublicationInput` deliveries; direct transient dispatch and legacy authoring shapes
do not acquire window enforcement implicitly. A window constrains an existing
delivery. Digest matching, grouping, content and recurring generation remain
consumer-owned and are not provided here.

## Transactions, replay and lifecycle

Call `publish` inside the application's existing `sql.withTransaction(...)` to
commit business changes, publication, associations, references and immediate queue
allocation together. Share the same SQL client/queue layers. No provider call occurs
in that transaction. A rollback leaves no dispatchable publication.

Publication keys remain globally unique within the installation. Same immutable
request returns the original delivery IDs. Changed address, associations, scope,
policy, checks, content, schedule or attempt budget conflicts. Reuse the original
snapshot on retries of the publication request; re-resolving an edited recipient
does not silently redirect an accepted message. Cancelled/failed keys are not reusable.

The canonical shape uses a versioned fingerprint. Legacy fingerprint interpretation
is unchanged. Host configuration such as feedback capability is not caller intent
and does not change a publication's replay identity.

A publication receipt means durably recorded, not necessarily queued or delivered.
Known consent/policy denials persist a suppressed delivery without a provider job.
Missing required adapters or policy versions fail the publication transaction.
Replaying a suppressed publication returns its original result; later consent or
unblocking does not revive it. Existing retry transition restrictions still apply.

Use existing `getDelivery`, `listDeliveries`, `cancelDelivery` and `retryDelivery`
with the stored exact scope. Delivery retries preserve identity and attempt history;
they do not publish again. Existing attempt-budget and transition rules still apply.
Processing work cannot be recalled. Initial `scheduledFor` is earliest eligibility,
not a promised delivery instant. External provider calls remain at least once;
ambiguous provider acceptance can result in duplicate delivery.

## External integration protection

`@krak-stack/notifications/integration` exports an optional server-side adapter:

- `NotificationPublicationIntegration`: `publish`, `inspect`, `cancel`, `retry`.
- `CurrentNotificationIntegration`: trusted actor reference and `PublicationAccess`.
- `NotificationIntegrationAuthorization`: mandatory host authorization implementation.

The adapter calls the same `NotificationService`, never another writer. It accepts
only the canonical publication shape. The host authenticates each request and
provides `CurrentNotificationIntegration` from trusted credential/session data.
Never deserialize that context, actor or grants from a request body.

Access explicitly lists operations, scope grants, channels, purposes and inspectable
reference namespaces. Empty grants deny everything. `Exact` compares all nullable
fields; `Organization` and `Installation` are explicit broader grants. Publishing
does not grant inspection, retry, cancellation, contact mutation or consent recording.

The mandatory host authorizer receives the actor, operation, requested scope and
publication or delivery identifier. It must verify tenant ownership, recipient and
account/address relationships, organization/workspace relationships, permitted
event/template/purpose combinations, sender credentials and selectable policy
extensions. A requested scope or transactional label is not proof of authorization.
This verification also runs before returning publication replays.

Inspection omits payloads, publication keys and recipient policy subjects; references
are allowlisted. Protect these operations through the host's HTTP/RPC middleware;
there is deliberately no unauthenticated route or default authentication scheme.
Use Effect HttpApi/Schema at that transport seam. Export only explicitly selected
operations through MCP/CLI integrations, never unrestricted direct transport dispatch.

External idempotency keys should be namespaced deterministically using trusted
integration/installation context. Keep that mapping stable across retries and
transport changes. A namespace is collision avoidance, not authorization. Hosts
still own database/schema installation isolation and confidential error mapping.

## Operations and provider feedback

The optional React screens and Effect Atom helpers are owned by
`@krak-stack/notifications-admin`. The Effect backend owns `/admin/*` contracts and
handlers, not UI. The host can use the packaged screens or build custom ones from
shared KrakStack primitives without changing publication. Administration screens
are available exclusively from notifications-admin, not from registry exports or
shadcn registry items.

Native scoped contact deliveries need no `kraksend_email_requests` record.
Administration reads existing deliveries and joins real recipient associations.
`deliveryScopes` opts into source-independent staff grants; old `contactManaged`
and `engineScopes` grants retain their previous semantics. Authorization precedes
metrics, search, pagination and inspection. Every delivery is counted once.

Configure `notificationFeedbackLayer(["email"])` from
`@krak-stack/notifications/feedback` on the publisher only when authenticated
provider feedback ingestion and durable reconciliation are deployed for those
channels/providers. The capability is recorded for new canonical deliveries;
it is not a request-controlled claim and is not retroactively applied to old rows.
Provider routing must honor the configured coverage. Leave it disabled if uncertain.

Existing feedback reconciliation can match opted-in canonical deliveries as well
as genuine legacy contact requests. Matching requires an accepted attempt, provider
message ID and recipient address; ambiguous matches remain unmatched. New canonical
bounce/complaint blocks use the matched delivery's exact scope, never an inferred
installation-wide scope. Historical contact feedback retains its existing behavior.

Without capability configuration, canonical deliveries remain explicitly feedback
unavailable. Contact membership does not establish coverage. Provider acceptance,
confirmed delivery, bounce/complaint observations and reading remain distinct facts.

New suppression calls can specify `scopeMatch: "exact"`, `"organization"` or
`"installation"`. Null is exact in the first case; broader matching is explicit.
Omitting `scopeMatch` preserves legacy suppression matching for compatibility.
Exact and legacy blocks coexist without overwriting each other. Reset must select
the same matching mode. Existing notification-purpose blocks also cover marketing;
adding a policy class must not bypass an existing optional-email block.

## Migration and retirement

1. Install additive engine migrations. Do not republish or reset existing work.
2. Move application callers to `PublicationInput` on the existing `publish` method.
   Keep existing keys and legacy request shapes for replaying accepted legacy work;
   use new keys for genuinely new publications with changed policy/associations.
3. Replace new `queueEmail` calls with resolved recipients and explicit policies.
   Establish valid scoped consent separately; do not manufacture grants or request
   rows. Read original legacy requests when resuming their accepted work.
4. The existing `queueEmail` entry point is deprecated compatibility translation.
   Its request IDs, `kraksend:email:` publication prefix, delivery key, null scope,
   consent checks and `kraksend.v1` interpretation remain stable. Existing campaign
   orchestration remains on that compatibility contract until its consent-aware
   caller migration; it must not be switched merely by rewriting queued work.
5. Remove the legacy authoring shape and `queueEmail` public writer in the next
   breaking release, after first-party and documented consumer migration. Do not
   create another permanent sending implementation during that window.
6. Retain legacy readers, policy versions, tokens, workflow/activity names and
   historical request records while queued **or retryable** work depends on them.
   Queue drain alone is insufficient to remove retry compatibility. Retiring
   historical retry eligibility requires an explicit consumer decision.

No migration rewrites delivery addresses, IDs, publication keys, request fingerprints,
attempt budgets or accepted provider identities. No historical contact request or
consent event is synthesized to make administration work.
