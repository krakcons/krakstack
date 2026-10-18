# @krak-stack/registry

Tree-shakable runtime components and Effect services from the KrakStack shadcn registry.

```bash
bun add @krak-stack/registry
```

## Effect forms

Applications using Effect forms need `@lucas-barake/effect-form@1.1.0` and
`@lucas-barake/effect-form-react@1.1.0`, which support stable Effect 4 without
compatibility patches:

```sh
bun add @lucas-barake/effect-form@1.1.0 @lucas-barake/effect-form-react@1.1.0
```

When upgrading from the patched betas, remove their `patchedDependencies`
entries and patch files, update any form version overrides to `1.1.0`, and run
`bun install`. Preserve unrelated dependency patches.

## Usage

Import only the subpaths used by the application:

```tsx
import { DataTable } from "@krak-stack/registry/data-table";
import { Pagination } from "@krak-stack/registry/pagination";
import { AgentService } from "@krak-stack/registry/agent";
import { AgentWidget, makeAgentAtoms } from "@krak-stack/registry/agent/client";
import { makeAgentApiGroup } from "@krak-stack/registry/agent/schema";
import { makeHttpApiToolkit } from "@krak-stack/registry/httpapi/toolkit";
import { makeHttpApiCli } from "@krak-stack/registry/httpapi/cli";
import { HttpApiAdapter } from "@krak-stack/registry/httpapi/adapter";
import { HttpApiOtlp } from "@krak-stack/registry/opentelemetry/api";
import { BrowserOtlp } from "@krak-stack/registry/opentelemetry/browser";
import { createDocsSource, makeDocs } from "@krak-stack/registry/docs";
import { loadMdxDocsDirectory } from "@krak-stack/registry/docs/server";
import {
  DocumentationToolkit,
  DocumentationToolkitLayer,
} from "@krak-stack/registry/documentation-toolkit";
import {
  WebFetchToolkit,
  WebFetchToolkitLayer,
} from "@krak-stack/registry/webfetch-toolkit";
import { Query } from "@krak-stack/registry/query";
import { createSeo } from "@krak-stack/registry/seo";
import { FileExtractionService } from "@krak-stack/registry/service-file-extraction";
import { FileExtractedTextSchema } from "@krak-stack/registry/service-file-extraction/schema";
import {
  HealthApiGroup,
  healthHandler,
  HealthService,
} from "@krak-stack/registry/service-health";
import { NotificationService } from "@krak-stack/registry/service-notification";
```

## OpenTelemetry

| Export                                                    | Purpose                                                                                 |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `HttpApiOtlp.layer` from `opentelemetry/api`              | Server exporters and same-origin browser ingestion routes. Includes `ServerOtlp.layer`. |
| `ServerOtlp.layer` from `opentelemetry/server`            | Exporters for workers, workflows, and CLIs without an HTTP server.                      |
| `BrowserOtlp.layer(options)` from `opentelemetry/browser` | Browser errors, traces, metrics, logs, and named events.                                |

### Setup

Provide the HTTP layer once at the application composition root:

```ts
import { Layer } from "effect";
import { HttpApiOtlp } from "@krak-stack/registry/opentelemetry/api";

const appLayer = appRoutes.pipe(Layer.provideMerge(HttpApiOtlp.layer));
```

Configure an OTLP/HTTP collector on the server:

```dotenv
OTEL_SERVICE_NAME=my-app-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
```

Analytics events require the logs signal. The proxy forwards enabled signals from
`/api/otel/v1/{traces,metrics,logs}` to the collector. Keep collector credentials
server-side. Server log endpoint/header overrides use
`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_HEADERS`, falling
back to the shared endpoint/headers; these overrides do not change proxy routing.
`OTEL_SDK_DISABLED=true` disables server export, not browser collection.

Install one browser layer on the Atom context passed to `AtomHttpApi.Service`:

```ts
import { Atom } from "effect/reactivity";
import { BrowserOtlp } from "@krak-stack/registry/opentelemetry/browser";

const apiRuntime = Atom.context();
if (!import.meta.env.SSR) {
  apiRuntime.addGlobalLayer(BrowserOtlp.layer({ serviceName: "my-app-web" }));
}
```

Mount/read `ApiClient.runtime` in the root layout to start it. Dispose long-lived
server and browser runtimes on shutdown to flush pending data.

### Browser telemetry

`BrowserOtlp.event(name, properties?, options?)` formats a generic named OTLP log
event, just like `ServerOtlp.event`. Run it in the runtime providing
`BrowserOtlp.layer({ serviceName: "my-app-web", events: {} })` to enable export.
It adds no page context, analytics identity, or sessions. `page` and SPA navigation
tracking belong to `BrowserEvents` below. There is no browser identify API or
identity state.

| Layer option                              | Default                                                         |
| ----------------------------------------- | --------------------------------------------------------------- |
| `serviceName`                             | Required                                                        |
| `traces`                                  | `{}`; includes global exception capture. `false` disables both. |
| `events`, `logs`, `metrics`               | `false`; enable each independently with `{}`.                   |
| `baseUrl`                                 | `/api/otel`                                                     |
| `serviceVersion`, `attributes`, `headers` | Optional resource/transport metadata.                           |

### Server events and shared options

Define server events as Effects and run them inside the runtime with
`ServerOtlp.layer` (or the HTTP layer):

```ts
import { Effect } from "effect";
import { ServerOtlp } from "@krak-stack/registry/opentelemetry/server";

const orderCompleted = Effect.gen(function* () {
  yield* ServerOtlp.event("app.order.completed", { "order.total": 49 });
});
```

Server events inherit fiber-scoped log annotations, including identity supplied
by `ActorRequired` or application middleware. `AuthMiddleware` alone does not
annotate identity. Background jobs can supply identity per event.

Both generic `event` methods accept `options`:

| Option                                            | OTLP attribute / meaning                                            |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `userId`, `anonymousId`, `sessionId`, `messageId` | `user.id`, `analytics.anonymous_id`, `session.id`, `log.record.uid` |
| `context`                                         | Additional flat attributes                                          |
| `timestamp`                                       | Effect `DateTime.Utc` occurrence time; otherwise recorded now       |

Attribute precedence, lowest to highest: context, properties, explicit identity
options, scoped log annotations. Values support
strings, finite numbers, booleans, and homogeneous arrays, not nested objects.
Use stable event names and put dynamic values in attributes. Message IDs support
correlation, not guaranteed deduplication.

Events are OTLP log records with `eventName`, INFO severity, and active trace/span
IDs when available; they do not create spans. `browser.page_view`, `url.path`,
`analytics.page.name`, and `analytics.page.category` describe page events; the
analytics names are project conventions, not standardized OTel semantics.

Configure collector/storage separately. Generic telemetry generates no
visitor/session IDs or cookies. Browser flushing on hidden/pagehide is best-effort. Apply payload
and rate limits at ingestion, and keep sensitive data out of events and
high-cardinality fields out of Loki labels.

## Application events and cookieless analytics

Install the optional `@krak-stack/service-events` registry item, or use the
`@krak-stack/registry/events`, `/events/browser`,
and `/events/migrations` package exports. It enriches standard OTLP/HTTP JSON
logs on the existing `/api/otel/v1/logs` endpoint; it does not add another event
protocol or receiver. See the registry item's setup instructions for composition.

### Server setup

Persistence is selected by dependency injection when the Events layer starts,
not by a configuration flag:

| Provided to Events               | Event storage                      | Visit IDs                                 | Migrations            |
| -------------------------------- | ---------------------------------- | ----------------------------------------- | --------------------- |
| No `SqlClient`                   | None; forward enriched OTLP        | Omitted                                   | None                  |
| PostgreSQL or SQLite `SqlClient` | Blocking, deduplicated SQL inserts | Assigned from event history and forwarded | One initial migration |

```ts
import { Config, Layer, Redacted } from "effect";
import { PgClient } from "@effect/sql-pg";
import { Events } from "@krak-stack/registry/events";
import { HttpApiOtlp } from "@krak-stack/registry/opentelemetry/api";

const options = {
  origin: "https://example.com",
  secret: Redacted.make(existingApplicationSecret),
  trustCloudflare: false,
};

// Without database injection: enrich and forward only.
const stateless = Events.layer(options);

// PgClient.layerConfig also provides the generic SqlClient.
const sqlLayer = PgClient.layerConfig({ url: Config.Redacted("DATABASE_URL") });
const persistent = Events.layer(options).pipe(Layer.provide(sqlLayer));

// Choose stateless or persistent here. Enable OTLP logs export on the server.
const telemetry = HttpApiOtlp.layer.pipe(
  Layer.provide(Events.processorLayer.pipe(Layer.provide(persistent))),
);
```

SQLite SqlClient layers work the same way. Provide the database **to** Events;
merging sibling layers does not inject one into the other. The mode is fixed at
acquisition, not checked on each request. A database failure fails ingestion rather
than silently disabling storage. `Events.baseLayer(options)` uses the same
injection rules but leaves migrations to the application.

Events uses the trusted server OTel service name: optional `serviceName`, then
`OTEL_SERVICE_NAME`, then `service.name` in `OTEL_RESOURCE_ATTRIBUTES`. Configure
the name once through OTel; no separate site identifier is needed. The resolved
name scopes visitor hashing, visit lookup and SQL's `service_name` column. Server
recorded events include the configured OTel resource; browser events retain their
producer resource, which is not trusted to choose the storage scope. Use distinct
service names for environments sharing a database, or an explicit common
`serviceName` when multiple services intentionally share analytics scope.

Events use OTLP as the wire format, with the following analytics attributes:

| Concept              | OTLP representation                                                   |
| -------------------- | --------------------------------------------------------------------- |
| Track / page         | `eventName`, `analytics.event.type`                                   |
| Message ID           | `log.record.uid`                                                      |
| Occurrence / receipt | `timeUnixNano` / `observedTimeUnixNano`                               |
| Visitor / session    | `analytics.anonymous_id` / `session.id`                               |
| Page                 | `url.path`, `analytics.page_view.id`                                  |
| Language / locale    | `browser.language`, `analytics.locale`                                |
| Campaign             | `utm.source`, `utm.medium`, `utm.campaign`, `utm.content`, `utm.term` |
| Business properties  | `app.*`                                                               |
| Library              | Scope `krakstack.application.events`                                  |
| App / release        | Resource `service.name`, `service.version`                            |

```ts
import { BrowserEvents } from "@krak-stack/registry/events/browser";

const orderCompleted = BrowserEvents.track(
  "Order Completed",
  { total: 42 },
  {
    messageId: "order-42-completed",
  },
);
```

Install `BrowserEvents.layer({ serviceName: "my-app-web" })` on the mounted
browser runtime instead of `BrowserOtlp.layer(...)`; it includes generic telemetry.
Calls from any runtime use the active analytics layer; calls outside its lifetime
are no-ops. `track` and `page` return Effects and validate input with Effect Schema.

| Browser API / option                                       | Behavior                                                                          |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `track(name, properties?, options?)`                       | Named event; business properties prefixed with `app.`                             |
| `page({ path?, name?, category?, properties?, options? })` | Manual page view                                                                  |
| Event `options`                                            | `messageId`, `timestamp`, `context`; no client identity options                   |
| `pageViews`                                                | Defaults to `true`; initial view and SPA pathname changes, not query/hash changes |
| `pageViews: false`                                         | Manual router integration; avoid duplicate automatic/manual views                 |
| `webVitals: true`                                          | Passes through to BrowserOtlp's independent Web Vitals collection                 |
| `sanitizePath`                                             | Remove personal identifiers before transmission                                   |
| Batching                                                   | Every 5 seconds, at most 20 events                                                |

The browser captures event-time page context and privacy signals. The server owns
identity, sessions, geo/device enrichment, and classification. The identity hook
runs once per validated batch; it reflects auth at ingestion time, not event time.

| Operation  | Instruction                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| Server     | Provide `Events.layer(options)`; injected SqlClient enables persistence and runs the initial migration     |
| Hashing    | Reuse a stable server application secret (32+ characters), shared across instances; no SQL key management  |
| Storage    | An injected PostgreSQL/SQLite SqlClient enables blocking, deduplicated event inserts and visit assignment  |
| Auth       | Set `Events.layer({ ...options, identity: (request) => ... })` to resolve identity using your auth library |
| Identity   | Server hook only; browser IDs are discarded. Return IDs or `null` for anonymous; failures return 503       |
| Retention  | Application-owned; retain at least the latest 30 minutes of events to preserve active visits               |
| Cloudflare | Enable trust only behind verified ingress with origin-bypass protection                                    |
| Privacy    | No browser storage; daily visitor IDs; 30-minute visits when SQL is injected; DNT/GPC respected            |
| Opt-out    | Set browser `enabled: false`                                                                               |
| Limits     | JSON only; 64 KiB; edge rate limits required                                                               |

With persistence enabled, `events` stores per-event OTLP JSON and indexed
identity/time columns for project-owned reports without central ClickHouse access.
The primary key `(service_name, source, event_id)` deduplicates SQL writes while
isolating untrusted browser IDs from server IDs. Reusing an ID with different
caller-owned content fails with `EventConflictError` (HTTP 409 for browser ingestion).
Committed analytics-only batches are acknowledged even if best-effort OTLP forwarding fails; mixed batches
retain collector failure semantics for unrelated telemetry. There is no outbox,
worker or guaranteed central delivery. Events can be lost before ingestion commits.
Scope report queries to the service and authorized organization/user; own event retention.

There is no sessions table or cleanup API. For each service/anonymous visitor,
ingestion reads the latest persisted event: reuse its `session.id` while receipt
inactivity is under 30 minutes, otherwise generate a new one. IDs are stored on
events and forwarded through OTLP; group/filter by `session_id` for timelines.
Retries reuse the original persisted record, including its session ID, even across
midnight or changed/missing request metadata, without extending activity. Occurrence
time remains available for ordering; receipt time controls visit expiration.
Daily anonymous ID rotation splits visits at midnight UTC. Missing trusted IP/UA
means no attribution for new events; retries retain their original attribution.

Lookup and insertion are serialized inside the same transaction using a PostgreSQL
transaction advisory lock per service/visitor or SQLite's writer lock acquired before
reading. Without an injected SqlClient, no database or migration is needed:
enrichment and daily visitor estimates still work, but `session.id` is omitted.
The mode is selected at layer acquisition; database failures never silently switch
to non-persistent delivery. There is no `persistEvents` configuration flag.

PostgreSQL's `PgClient.layer(...)` also provides `SqlClient`. SQLite client layers
work the same way. Inject the database before acquisition; supplying only a
database URL or an unrelated database wrapper does not enable persistence.

The initial migration uses native `jsonb` on PostgreSQL with a GIN
`jsonb_path_ops` index for containment (`@>`) and supported JSONPath searches.
SQLite stores JSON as text. The service depends only on generic `SqlClient`;
database-specific search queries stay application-owned.

### Visit timelines

Here, a visit is a sequence of activity with gaps under 30 minutes; its identifier
is carried as OTLP `session.id` and indexed SQL `session_id`. Location,
browser/device context and identity stay on each event, so OTLP consumers need
no metadata join.

| Arrival                                                  | Result                                      |
| -------------------------------------------------------- | ------------------------------------------- |
| First event for a service/visitor                        | New session ID                              |
| New event after 29 minutes                               | Reuse the session ID                        |
| New event after 30 minutes without a new persisted event | New session ID                              |
| Retry of an existing event                               | Original ID; does not extend visit activity |

List visits by grouping authorized events on `session_id`. Open a timeline by
filtering the events directly—there is no session row or foreign key to resolve:

```ts
const timeline =
  yield *
  sql`
  SELECT event_id, event_name, occurred_at, received_at, payload_json
  FROM events
  WHERE service_name = ${serviceName}
    AND organization_id = ${authorizedOrganizationId}
    AND session_id = ${sessionId}
  ORDER BY occurred_at, event_id
`;
```

`authorizedOrganizationId` must come from server-verified authorization, not an
unchecked request parameter. Apply the equivalent user/service access policy for
non-organization analytics. Session IDs are grouping keys, not access tokens.
The full enriched OTLP record remains in `payload_json`; a timeline renderer can
read its page path, business properties and context without another table.

`events.track({ eventId, name, category?, identity?, properties?, timestamp? })` records
authoritative server events in SQL, joining the application's transaction when using
the same SqlClient. It requires persistence enabled and returns `{ eventId, inserted }`.
It does not export before commit; emit `ServerOtlp.event` afterward if desired.

### Server audit events

`Events.track(event)` is the single server recording API. Audit events are ordinary
events with `category: "audit"`, using the same SQL table, OTLP format, transactions
and deduplication. Category defaults to `analytics`. Audit category requires trusted
actor annotations; it is a policy classification, not a different storage guarantee.
Domain-specific Effect schemas should validate required event properties before
recording. The generic service does not require or infer a target or outcome.
Auth owns actor resolution and actor types. MCP and agent integrations own their
context layers. These layers use `Effect.annotateLogs`; recording consumes the
current annotations without depending on auth, MCP or an AI SDK.

```ts
const audit = events
  .track({
    eventId: `document:${requestId}:deleted`,
    name: "document.deleted", // action
    category: "audit",
    properties: { document_id: documentId },
  })
  .pipe(
    // Normally supplied by trusted auth middleware, not request payloads.
    Effect.annotateLogs({
      "app.actor.type": "user",
      "app.actor.id": verifiedUserId,
      "user.id": verifiedUserId,
      "organization.id": verifiedOrganizationId,
    }),
    sql.withTransaction,
  );
```

| Contract            | Behavior                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Audit validation    | Requires nonempty `app.actor.type/id` server annotations; domain properties are caller-validated                      |
| ActorRequired       | Updated auth SDK supplies actor type/ID and API-key owner attribution, plus existing user/organization annotations    |
| Identity precedence | Annotated identity replaces explicit identity as a whole, avoiding mixed principals                                   |
| Context ownership   | Auth defines actor types/owners; MCP and AI layers attach applicable `mcp.*` and `gen_ai.*` attributes                |
| Context propagation | Server log annotations are inherited, just like `ServerOtlp.event`; only annotate data safe to persist                |
| Protected fields    | Event ID, schema version, source and explicit category cannot be overridden by annotations                            |
| Browser ingestion   | Always analytics; client actor, audit and executor claims are discarded                                               |
| Atomicity           | Use the same SqlClient transaction as the business change; failed/denied attempts need a transaction that will commit |

`app.actor.*` and `app.event.category` are application conventions,
not standard OTel audit fields. Audit category is stored as `app.event.category`
in the OTLP payload; there is no separate audit table or migration.

The unreleased feature is now installed as `service-events`, with `Events` and
`BrowserEvents` under `services/events`. Its initial migration creates `events`
and `events_migrations`. Application events use scope `krakstack.application.events`
and `app.event.schema.version=1`, separate from generic `krakstack.events` telemetry.
Browser analytics context retains its `analytics.*` attributes. If you tested the
earlier unreleased analytics schema locally, explicitly migrate/export those tables
before switching; the new initial migration does not rename or remove old tables.

This provides an application audit trail, not immutable storage. Protect audit
records with database permissions, authorized reads, backups and category-aware
retention. Local SQL remains authoritative; server recording does not automatically
export, and collector delivery remains best effort. A durable immutable archive
requires separately designed delivery and storage controls; no outbox is added.

The [OneUptime audit pipeline reference](https://oneuptime.com/blog/post/2026-02-06-immutable-audit-log-pipeline-otel/view)
illustrates searchable storage plus an Object Lock archive. Its custom `audit.*`
fields are not an OTel standard, a plain content hash is not tamper-proof, and a
collector queue cannot recover events that never reached the collector. We do not
claim regulatory compliance or implement hashing/WORM storage here.

### Web Vitals (generic OpenTelemetry)

Web Vitals belong to `BrowserOtlp`, independently of analytics:

```ts
BrowserOtlp.layer({ serviceName: "my-app-web", webVitals: true });
```

This enables OTLP event export even without `events: {}`; no analytics, SQL,
visitor/session IDs or page tracking are required. `BrowserEvents` passes the
option through and prevents collection when analytics is disabled. Automatic
Web Vitals respect DNT/GPC by default (`respectDoNotTrack: false` overrides this).
Other generic telemetry signals are unaffected by that option.

Events follow the [OpenTelemetry browser event conventions](https://opentelemetry.io/docs/specs/semconv/browser/browser-events/)
(currently Development): event `browser.web_vital`, required attributes
`browser.web_vital.name/id/value/delta`, and recommended `rating/navigation_type`.
Names are lowercase (`lcp`, `inp`, `cls`, `fcp`, `ttfb`); value and delta are
OTLP doubles. Group updates by resource and metric ID and take the latest value,
or sum deltas after deduplicating delivery—not cumulative values. There is no
automatic analytics SQL persistence or page context for these generic events.
These are document metrics, not SPA navigation timings; unsupported metrics may
be absent. No performance entries, URLs or DOM attribution are exported.

| Feature                        | Coverage                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------- |
| Page views, events, visitors   | Included; approximate cookieless identity                                    |
| Visits / session IDs           | Event-derived when SqlClient is injected; no session metadata table          |
| Location                       | Trusted Cloudflare country, region and city; no bundled GeoIP database       |
| Browser, OS, device            | Server-side User-Agent parsing                                               |
| Referrer and UTM               | Referrer host and source/medium/campaign/content/term; no attribution engine |
| Web Vitals                     | Independent BrowserOtlp collection, no reporting UI                          |
| Dashboards, funnels, retention | Not included                                                                 |

Identity is approximate and pseudonymous. No identity merging, traits, Segment
destination routing, or clock-skew correction is included.

## Other services

`@krak-stack/registry/service-notification` is the source-compatible direct
dispatcher. Use the separate `@krak-stack/notifications` package for a durable
inbox, package-owned migrations, persisted delivery jobs, retries, workers, and
one-shot reminders.

Create a configured SEO helper once with site-wide defaults, then use it for each page:

```tsx
const siteSeo = createSeo({
  origin: "https://krakstack.net",
  locales: ["en", "fr"],
  siteName: "KrakStack",
  sameAs: ["https://github.com/krakcons/krakstack"],
});

<Route
  head={() =>
    siteSeo({
      title: "KrakStack",
      description: "Production-ready building blocks for TanStack apps.",
      locale: "en",
    })
  }
/>;
```

The returned object contains `meta`, `links`, and derived JSON-LD `scripts`. Website pages receive `WebSite` and `Organization` data; documentation pages can pass `type: "article"` for `Article` data. Use the lower-level `seo` function directly when a configured factory is not useful.

HTTP API adapter, AI tool, and CLI utilities are available under
the `@krak-stack/registry/httpapi/*` subpaths. Keep application-specific API
layers, handlers, authentication, and client bindings in the application.

Use `@krak-stack/registry/httpapi/toolkit` for HTTP API tools.

### HTTP API tools and MCP

Static toolkits keep definitions and implementations separate:
`DocumentationToolkit` / `DocumentationToolkitLayer({ docs, locale })` and
`WebFetchToolkit` / `WebFetchToolkitLayer(options?)`. Merge the definitions with
`Toolkit.merge`, then provide their handler layers. Web-fetch options are
validated during layer acquisition through the Effect error channel.

HTTP API tools are generated dynamically, so `makeHttpApiToolkit()` returns
matching definitions and handlers together.

CLI, toolkit, and MCP registration share `HttpApiAdapter.operations`. Each operation
contains its tool name, typed `inputSchema`, derived `inputJsonSchema`, and method
annotations. Inputs use `{ params, query, headers, body }`; only the CLI turns
terminal arguments into that shape. The generated HTTP client handles wire
encoding, and payload codecs retain their transformations.

Use `makeHttpApiToolkit(config)` to construct matching tools and handlers once:

```ts
import { makeHttpApiToolkit } from "@krak-stack/registry/httpapi/toolkit";

const { toolkit, handlers } = yield * makeHttpApiToolkit();
const tools = yield * toolkit.pipe(Effect.provide(handlers));
```

Provide one `HttpApiAdapter` layer through the surrounding Effect layers:

```ts
const adapterLayer = HttpApiAdapter.layer({
  api: AppApi,
  baseUrl: "https://example.com",
  methods: ["get"],
}).pipe(Layer.provide(FetchHttpClient.layer));
```

This replaces the separate `HttpApiSpec` and `ApiClient` services. The catalogue,
input/success codecs, execution client, and result encoder all use the same API.
Import from `@krak-stack/registry/httpapi/adapter`, or install
`@krak-stack/httpapi-adapter` with shadcn. The old client/helper package subpaths
and client registry item have been removed.
Configuration is optional. Construct once and use the returned pair for agents
or MCP; the separate `HttpApiToolkit` and `HttpApiToolkitLayer` factories have
been removed.

For CLI commands, `makeHttpApiCli()` returns `{ command, run }`. Provide the same
`HttpApiAdapter` layer and supply the platform CLI services when
running commands. `run` derives the CLI version from the API metadata:

```ts
const { command, run } = yield * makeHttpApiCli();
yield * run(args);
```

`makeHttpApiCli` is the only public CLI export. `HttpApiCli`, its layer, and the
custom runners have been removed. Process arguments, platform services, error
reporting, and exit handling belong to the application's Effect runtime:

```ts
import { NodeRuntime, NodeServices } from "@effect/platform-node";

Effect.gen(function* () {
  const { run } = yield* makeHttpApiCli();
  yield* run(process.argv.slice(2));
}).pipe(
  Effect.provide(adapterLayer),
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain,
);
```

Install `@effect/platform-node` matching your Effect version for this example;
`adapterLayer` supplies the application's `HttpApiAdapter`.

For an HTTP MCP server, register the toolkit directly with Effect. Keep the
transport and server identity in the application:

```ts
import { Effect, Layer } from "effect";
import { McpProtocol, McpServer } from "effect/ai";
import { FetchHttpClient } from "effect/http";
import { HttpApiAdapter } from "@krak-stack/registry/httpapi/adapter";
import { makeHttpApiToolkit } from "@krak-stack/registry/httpapi/toolkit";
import { AppApi } from "@/api";

export const mcpLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const { toolkit, handlers } = yield* makeHttpApiToolkit({});
    yield* McpServer.registerToolkit(toolkit).pipe(Effect.provide(handlers));
  }),
).pipe(
  Layer.provideMerge(
    McpServer.layerHttp({
      name: "app",
      version: "1.0.0",
      path: "/api/mcp",
      protocols: [McpProtocol.v2025_11_25],
    }),
  ),
  Layer.provide(
    HttpApiAdapter.layer({
      api: AppApi,
      baseUrl: "http://localhost:3000",
      methods: ["get"],
    }),
  ),
  Layer.provide(FetchHttpClient.layer),
);
```

This example explicitly selects GET operations; `HttpApiAdapter` otherwise includes
all supported methods. Use `include` to narrow exposure further. Supply an
authenticated `HttpClient` instead of `FetchHttpClient.layer` when the downstream
API requires credentials. Inbound MCP authentication and authorization remain
application-owned; tool annotations are not access controls.

If intentionally exposing writes, enforce authorization or confirmation in the
application before opting out of agent approval with `needsApproval: () => false`.
Approval requirements are no longer silently disabled by an MCP adapter.

The `HttpApiMcp` service, `@krak-stack/registry/httpapi/mcp` export, and
`@krak-stack/httpapi-mcp` registry item have been removed. Replace them with the
composition above. Any Effect toolkit can be registered this way; it does not
need to originate from an HttpApi.

Documentation consumers load and compile their application-owned MDX on the
server, then pass the validated page records to `createDocsSource` and
`makeDocs`:

```ts
const pages = await loadMdxDocsDirectory("src/content/docs");
const source = createDocsSource({ pages, locales: ["en", "fr"] });
```

The `@krak-stack/registry/docs/server` export requires the Bun runtime. Keep it
behind a server-only module or server function so it is not included in browser
bundles.

Add the package's Tailwind source to the application stylesheet:

```css
@import "@krak-stack/registry/tailwind.css";
```

The same canonical sources remain available through shadcn:

```bash
bunx shadcn@latest add @krak-stack/data-table
```

Project-specific configuration and scaffolding remain available through shadcn.

## Oxlint Plugin

Projects that prefer centrally versioned rules can load the compiled anti-slop
plugin directly from the package:

```json
{
  "jsPlugins": [
    {
      "name": "anti-slop",
      "specifier": "@krak-stack/registry/oxlint/anti-slop"
    }
  ]
}
```

Use `@krak-stack/lint-format` instead when the project should receive editable,
vendored rule source under `tools/oxlint/anti-slop`.
