---
"@krak-stack/registry": minor
---

Add application events, server audit recording, and cookieless browser analytics through the OTLP/HTTP JSON logs endpoint.

- Install: `service-events`, or the `@krak-stack/registry/events`, `/events/browser`, and `/events/migrations` exports.
- Default OTLP: forward analytics to your telemetry backend; use `ServerOtlp.event` for server telemetry.
- Optional SQL: PostgreSQL/SQLite persistence for in-app queries, visit timelines, and transactional audit records. `Events.track` requires SQL and supports verified actor context.
- Browser: `BrowserEvents` provides event/page tracking, automatic SPA views, DNT/GPC support, and path sanitization.
- Enrichment: trusted Cloudflare/custom geolocation and daily visitor IDs, without browser storage or automatic raw IP storage.
- Web Vitals: opt-in collection through `BrowserOtlp` or `BrowserEvents`, independent of SQL.

SQL is authoritative for persisted events; collector forwarding is best effort. Audit classification provides an application audit trail, not immutable archival storage or a compliance guarantee.
