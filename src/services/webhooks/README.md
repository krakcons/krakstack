# Webhooks

`@krak-stack/registry/webhooks` provides tenant-scoped outbound webhooks backed
by PostgreSQL and Effect durable workflows. It owns its migrations, tables,
publication deduplication, signing, and delivery retries. Authentication,
authorization, HTTP endpoints, event catalogs, and audit recording belong to
the application.

## Local development delivery

Outbound loopback URLs are blocked by default. A **local development composition
root only** can provide `Layer.succeed(WebhookAllowLoopback, true)` around the
entire `Webhooks.layer` (exported from `@krak-stack/registry/webhooks`). This allows
HTTP(S) on exactly `localhost`, `127.0.0.1`, and `[::1]` for service create/update,
durable execution, and the built-in HTTP client. Other private destinations remain
blocked; redirects remain disabled. Gate the override on development mode in the
application, never on request input. Public API contracts using `WebhookPayload`
remain strict; use `webhookPayloadSchema(true)` only for development contracts.

**Français :** les URL locales sont bloquées par défaut. Seule la composition de
développement doit fournir `Layer.succeed(WebhookAllowLoopback, true)` autour de
`Webhooks.layer`. L’exception autorise HTTP(S) sur `localhost`, `127.0.0.1` et
`[::1]`, sans autoriser les autres adresses privées ni les redirections. Ne jamais
activer cette option depuis une requête ou en production. Le contrat public
`WebhookPayload` reste strict ; `webhookPayloadSchema(true)` est réservé au
développement.

## Receive

`WebhooksReceiver` is exported from `@krak-stack/registry/webhooks`, alongside
the outbound `Webhooks` service. Pass a `Redacted` secret, lowercase protocol headers, the exact
raw request body, an Effect schema for the complete `{ event, data }` envelope,
and an Effect handler. Verification uses constant-time Web Crypto HMAC-SHA256
and rejects timestamps more than five minutes in either direction. Parsing and
handling happen only after verification. Handler failures propagate so the HTTP
endpoint can return a non-2xx response and the sender can retry.

```ts
import { WebhooksReceiver } from "@krak-stack/registry/webhooks";
import { Redacted, Schema } from "effect";

const receiver = yield * WebhooksReceiver;
yield *
  receiver.receive({
    receiver: "billing-endpoint",
    secret: Redacted.make(endpointSecret),
    headers: request.headers,
    body: yield * request.text,
    schema: Schema.Struct({
      event: Schema.Literal("invoice.paid"),
      data: Schema.Struct({
        eventId: Schema.NonEmptyString,
        invoiceId: Schema.NonEmptyString,
      }),
    }),
    eventId: ({ data }) => data.eventId,
    handle: ({ data }) => markInvoicePaid(data.invoiceId),
  });
```

Provide `WebhooksReceiver.layer` with the application's SQL pool. It migrates only
`webhook_receipts`, using the `krakstack_webhook_receiver_migrations` ledger. It
does not create outbound tables, start a worker, or require a workflow engine.
`Webhooks.layer` remains outbound-only. Provide both layers when an app needs both.

The caller supplies a trusted receiver namespace and extracts an event ID from
the **signed payload**. Receipts store that key, a SHA-256 body hash, and a
completion timestamp, never the payload. Concurrent duplicate deliveries wait
for the first transaction and return `{ duplicate: true }` without rerunning
the handler. Reusing a key with different raw content fails with
`WebhookReceiptConflict`. Handler changes and the receipt commit in one SQL
transaction; failures roll both back. Handlers must use the same SQL pool and
must not perform external side effects inside this transaction. Use an outbox
for external work. `cleanup()` removes receipts older than 30 days; schedule it
explicitly. After expiry, handlers must still tolerate an old event being replayed.

Do not trust `webhook-id` for security: the current sender does
not include it in the signature. Enforce a request-body limit at the HTTP
boundary, keep secrets server-only, use HTTPS, and return 2xx only after work
commits. Queueing work requires a separate completion protocol.

### Réception

`WebhooksReceiver` vérifie la signature HMAC du corps brut et refuse les
horodatages décalés de plus de cinq minutes. Le schéma Effect valide ensuite
l’enveloppe avant le traitement. Sa couche crée uniquement les reçus de
déduplication, sans tables d’envoi ni tâche d’arrière-plan. L’identifiant de
l’événement doit provenir du corps signé. Les reçus et les modifications SQL
sont validés dans la même transaction ; un échec autorise une nouvelle tentative.
Le nettoyage explicite supprime les reçus après 30 jours : les traitements
doivent rester idempotents. Retournez un succès HTTP
uniquement après validation de la transaction. Limitez la taille du corps HTTP,
gardez le secret côté serveur et utilisez HTTPS. Une mise en file d’attente
n’est pas une confirmation de suppression terminée.

## Publish

```ts
import { Webhooks } from "@krak-stack/registry/webhooks";
import { Effect } from "effect";

const publish = Effect.gen(function* () {
  const webhooks = yield* Webhooks;
  yield* webhooks.publish({
    organizationId: "organization-id",
    eventId: "stable-domain-event-id",
    event: "invoice.paid",
    data: { invoiceId: "invoice-id" },
  });
});
```

`Webhooks.layer` runs migrations, registers the delivery workflow, and starts
outbox recovery before exposing the service. Supply the same
`PgClient` and `SqlClient` pool as the application's domain services, together
with the shared `WorkflowEngine` and Effect's runtime `Dns` service. The protected HTTP client is built in. Calling
`publish` inside the domain transaction commits deliveries atomically with the
domain change. Replays with the same tenant, event ID, and content are no-ops;
changed content fails with `WebhookError`. Newly created endpoints do not
receive historical publications.

`create`, `update`, `get`, `list`, and `delete` require `organizationId`.
Endpoint payloads contain `name`, `url`, `description`, `enabled`, `events` (null means
all events), and `customHeaders`. Secrets are server-only: do not return them
from general-purpose endpoint lists. `get` includes the latest 100 deliveries.
Names are trimmed, non-empty, and at most 200 characters. Existing endpoints use
their URL as the initial name. For older clients, omitting `name` on create uses
the URL; omitting it on update preserves the existing name.

## Composition

```ts
import { Layer } from "effect";
import { Webhooks } from "@krak-stack/registry/webhooks";
import { BunDns } from "@effect/platform-bun";

const webhooks = Webhooks.layer.pipe(Layer.provide(BunDns.layer));
// Provide the shared durable WorkflowEngine and SQL pool.
```

The application provides its shared `WorkflowEngine`; the package does not
create another cluster or runner. There is no separate worker layer or startup
flag. The service scans committed due deliveries every five seconds and submits a stable, versioned
workflow per delivery. Retry waits use durable clocks. Infrastructure errors
retry without consuming the endpoint's HTTP attempt budget. Configure a
SQL-backed workflow engine in production; an in-memory engine is only for tests.

`Webhooks.layer` includes a fetch-based Effect HTTP client. It rejects
private URL literals, checks every DNS answer before each request, fails closed
on resolution errors, and disables redirects. Requests time out after 30 seconds.
No HTTP-client wiring is required in the application.
Supply Effect's `Dns` service using `BunDns.layer` on Bun or `NodeDns.layer` on Node.
The registry implementation uses `effect/net/Dns`, not direct Node DNS imports.

`webhooks/http-client` exports `isPublicWebhookDestination` for endpoint management
checks. Browser-safe URL predicates are exported from `webhooks/url`.

DNS preflight and the fetch connection resolve separately: this adapter does not
pin the checked IP to the socket. Use network-level egress restrictions to prevent
DNS rebinding; do not treat preflight alone as complete SSRF protection.

Tests can provide Effect's `HttpClient` through `layerWithoutMigrations` together
with `webhookMigrationsLayer`. Sending is internal;
the public `Webhooks` API does not expose a one-attempt delivery method.

## Protocol and guarantees

`statistics({ organizationId, id, interval })` returns `total`, `success`, and
`failed` counts across all stored deliveries, plus zero-filled UTC `buckets`.
The supported intervals are `hour` (today, from midnight UTC) and `day` (this
month, from its first day UTC), through the current period. Buckets group by
delivery creation time and use the delivery's current status; retries are not
counted as additional deliveries. Total includes in-progress deliveries.
Failed includes both terminal failures and pending deliveries with `retries > 0`;
a successful retry moves that delivery into Success instead.
Each bucket includes `events: [{ event, total }]` for event-stacked charts.
Statistics are tenant-scoped and return `undefined` for a missing endpoint.
They are not limited to the 100 records returned by `get`, but cleanup removes
records from these totals: they are not lifetime counters. No statistics tables
or migrations are required.

`listDeliveries({ organizationId, id, page, pageSize, filters, sort, globalFilter })`
returns `{ data, meta: { page, pageSize, total, pageCount } }` across all stored
history. Pages are zero-based and contain up to 100 deliveries. Filtering and
sorting run before pagination. Status filters use the same success/failed/pending
interpretation as statistics, while returned records retain their worker status
so clients can show next-retry details. Event/status value filters, identifier text
filters, and creation/completion date ranges are supported. Sort fields are
`id`, `event`, `status`, `createdAt`, and `completedAt`; ID breaks ordering ties.
Missing or foreign-tenant endpoints return `undefined`, as with `get`.

- Body: `{ "event": "invoice.paid", "data": { ... } }`.
- `webhook-id`: stable delivery ID, usable for receiver deduplication.
- `webhook-timestamp`: ISO timestamp for the attempt.
- `webhook-signature`: hex HMAC-SHA256 of `${timestamp}.${body}`, using the endpoint secret.
- Any 2xx response completes the delivery. Other outcomes retry, up to eight attempts.
- Deliveries retain a sanitized `error` reason for HTTP failures, timeouts, policy blocks, and network failures. Success clears it. Older failures have `error: null`; response bodies, credentials, and raw exception details are not stored.
- Backoff uses Effect's exponential schedule: five seconds initially, multiplied by four per retry, capped at ten hours. Durable clocks preserve waits across restarts.
- Delivery is at least once: a crash after receiver acceptance but before persistence can resend.
- Disabled endpoints fail remaining pending deliveries instead of sending them.

The migration ledger is `krakstack_webhook_migrations`. Owned tables are
`webhooks`, `webhook_deliveries`, and `webhook_publications`. Compatible Kokobi
tables are adopted in place, preserving endpoint IDs, secrets, and pending work.
Do not run the old sender alongside the workflow workers during migration.
`cleanup` deletes deliveries completed more than seven days ago; publication
tombstones remain for deduplication and contain the original event payload.
Plan retention according to your application's privacy requirements.
