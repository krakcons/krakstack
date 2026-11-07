# Notification administration

Administration is part of `@krak-stack/notifications`, not a separately hosted or
branded product. Import `NotificationContacts` from
`@krak-stack/notifications/admin`. The host owns authentication, authorization,
provider credentials, CSRF protection, installation isolation and retention.
Acquiring the contact layer runs the administration migrations before use.

Subpaths under `@krak-stack/notifications/admin/` expose schemas, protected API
contracts/handlers, campaigns, durable workflows, sender safeguards, provider
feedback, dispatch policy and signed public unsubscribe routes. Existing engine
account unsubscribe, inbox and APNs/FCM integrations are unchanged.

## Frontend

Install `@krak-stack/notifications-contacts`, `@krak-stack/notifications-campaigns`
and `@krak-stack/notifications-operations` through the KrakStack registry, or import
`NotificationContacts`, `NotificationCampaigns` and `NotificationOperations` from
the corresponding `@krak-stack/registry/notifications/*` exports.

`src/agent-examples/send/console.tsx` exports `NotificationsAdminPanel` and
`makeNotificationsAdminAtoms` for a unified English/French host integration.
It is deliberately not mounted on a public documentation route. Lists use shared
KrakStack DataTable search, typed filters, sorting, column visibility and pagination.
Operations and campaigns refresh every 15 seconds; manual refresh is available.

## Server-backed tables

The protected APIs expose `/api/send/tables/contacts`, `/campaigns`, `/activity`,
`/feedback`, `/suppressions`, `/suppression-history` and `/recipients`, plus
`/api/send/contacts/:id/consent-table`. The existing `/api/send` prefix is retained
for compatibility. Every endpoint uses the same mandatory host admin middleware.

The `table` query parameter is an Effect-schema JSON codec for KrakStack table
state: zero-based `page`, `pageSize` (1–100), `globalFilter`, `sort` and `filters`.
The response is `{ items, total }`. Count and page use one SQL statement/snapshot;
even an empty page retains its correct count. Only explicitly exposed columns
and matching filter types are accepted. Inputs are parameterized and text search
treats SQL wildcard characters literally. Sorting has a deterministic tie-breaker.
Date column filters use inclusive UTC calendar dates. Overview windows remain
half-open ISO instants. Filters/search apply to the full authorized dataset.

Pass controlled table state and authoritative totals to the views. Keep prior
totals during loading so pagination does not incorrectly clamp to page zero.
Drill-down IDs constrain contact, campaign and delivery queries at the server;
client column filters cannot widen that scope. Legacy cursor APIs remain available.

## Visibility and safety

- Contacts are independent of login accounts. Creation never grants consent.
  Grants/withdrawals and suppression changes are distinct audited facts.
- Campaigns snapshot subscribed audiences. Completion means publication finished,
  not confirmed delivery or reading. Sender/environment safeguards default to deny.
- Compose workers with `sendRuntimeLayer` from `admin/policy`. Protected deliveries
  fail closed when their named policy is missing. Durable workflow activities,
  caller request IDs and publication idempotency keys remain stable across retries.
- Global statistics count distinct owned installation-scope email deliveries.
  Feedback shows individual confirmations, bounces, complaints and unmatched events.
  Account/organization/workspace deliveries and push suppressions stay excluded.
- Operations omit rendered bodies, unsubscribe capabilities, credentials, arbitrary
  references and worker leases. Protected campaign content is separately inspectable.
- Block/removal requires a trusted actor and audit reason. Removal also requires the
  exact reviewed opaque row version. Mutations and audits commit atomically; stale
  requests cannot undo intervening provider blocks. Replays do not repeat side effects.
- Unblocking never restores consent, clears account opt-outs, revives a delivery or
  resends mail. Provider acceptance, confirmed delivery, reading, consent and
  suppression remain separate facts. In-flight messages cannot be recalled.
- Public unsubscribe and provider feedback require their respective signed-token
  and host/provider-authentication boundaries, not browser-supplied trust.

## Compatibility

The unpublished send workspace is private and retained only as a compatibility
adapter/test harness. New consumers need only the notifications package. Legacy
SQL tables, migration ledger names, `kraksend.v1`, publication prefixes, token
purposes and versioned workflow/activity names are deliberately unchanged: renaming
persisted identifiers would strand records, tokens, queued deliveries or workflows.
`KrakSend` remains a deprecated source alias for `NotificationContacts`.

Run database coverage against `TEST_DATABASE_URL`, never `DATABASE_URL`:
`bun run --cwd packages/send test`. Browser journeys are in
`e2e/send-operations.spec.ts`, `e2e/send-campaign.spec.ts` and
`e2e/send-unsubscribe.spec.ts`; they use isolated Postgres and fake transport.
