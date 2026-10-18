---
"@krak-stack/registry": minor
---

Add optional application events and cookieless browser analytics on the existing OTLP/HTTP JSON logs receiver, with a server identity hook, trusted request enrichment, daily visitor identifiers, event-derived visits, optional blocking SQL persistence, and opt-in Web Vitals. An injected PostgreSQL/SQLite SqlClient enables storage, migrations and stable visit IDs. Without SqlClient, browser batches are enriched and forwarded without migrations or session IDs; server recording fails explicitly. Committed browser application events are acknowledged despite best-effort collector failure. No outbox, session metadata table, daily-key table or worker is added.

Install the feature as service-events, exporting Events and BrowserEvents under services/events and package exports events, events/browser and events/migrations. BrowserEvents owns track/page and optional SPA page tracking. Events.track is the single server recording method, with optional analytics/audit category (default analytics). Audit classification requires server actor attribution; domain-specific targets, outcomes and other properties belong to caller-owned Effect schemas. All events share transactional persistence. Generic BrowserOtlp/ServerOtlp emitters are named event and remain independent of application persistence.

The unreleased initial migration creates events and events_migrations, using PostgreSQL JSONB with a GIN containment index or SQLite JSON text. Previous experimental analytics schemas require explicit local migration/export; no compatibility aliases or automatic destructive renames are added.

Use the trusted server OTel service name for visitor hashing, visit coordination and service_name storage scope, without a separate site identifier. Application event scope is krakstack.application.events with app.event.schema.version=1, separate from generic krakstack.events telemetry. Browser-specific analytics context retains analytics.\* attributes and cannot choose the storage scope.

Web Vitals live independently in BrowserOtlp with webVitals: true, following OTel browser event conventions (browser.web_vital.\*, lowercase names, double values/deltas). BrowserEvents passes the option through; SQL and application event processing are not required.

Server recording inherits current log annotations. Auth owns actor types and verification; MCP/AI integrations own their context layers. Annotated identity replaces explicit identity without mixing principals. Browser actor/audit/executor claims are discarded and browser events remain analytics. This is an application audit trail, not immutable storage, guaranteed archival delivery or a compliance guarantee.

Isolate browser and server IDs using the trusted source in the single events table's composite primary key. Identical retries reuse the authoritative stored record without extending activity, including across UTC midnight or changed visitor metadata. Conflicting caller-owned content raises EventConflictError (HTTP 409 for browser batches) and rolls back the batch. The unreleased initial schema includes source; experimental local databases need an explicit schema update. Missing User-Agent now produces unknown device context instead of a parser defect.

Resolve daily visitors and event-derived sessions for server track calls when an HttpServerRequest is available. Browser and server arrivals share the same transactional visitor lock and activity lookup, so both paths join and extend the same visit. Explicit server annotations take precedence; untrusted session headers are ignored, and background events remain unattributed unless annotated. Preserve retry attribution and rollback without adding tables, browser state or continuation tokens.

Replace trustCloudflare with optional geolocation: "cloudflare" or an Effect callback returning validated IP/country/region/city fields or null. Omission disables IP/geography enrichment and automatic visitor/session attribution. Custom providers can return only an IP for cookieless visitors without geography; failures are explicit, no provider fallback occurs, and raw IPs are never stored automatically.
