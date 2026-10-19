# @krak-stack/registry

## 0.1.51

### Patch Changes

- 0e67ce7: Add application events, server audit recording, and cookieless browser analytics through the OTLP/HTTP JSON logs endpoint.
  - Install: `service-events`, or the `@krak-stack/registry/events`, `/events/browser`, and `/events/migrations` exports.
  - Default OTLP: forward analytics to your telemetry backend; use `Otlp.event` for server telemetry.
  - Optional SQL: PostgreSQL/SQLite persistence for in-app queries, visit timelines, and transactional audit records. `Events.track` requires SQL and supports verified actor context.
  - Browser: `BrowserEvents` provides event/page tracking, automatic SPA views, DNT/GPC support, and path sanitization.
  - Enrichment: trusted Cloudflare/custom geolocation and daily visitor IDs, without browser storage or automatic raw IP storage.
  - Web Vitals: a separate `BrowserWebVitals` layer reuses the browser event exporter, respects DNT/GPC, and keeps `web-vitals` out of base browser imports.
  - Dependencies: Bowser and Web Vitals are regular package dependencies, so package consumers do not need to declare them separately.
  - Composition: `BrowserEvents` and `BrowserWebVitals` consume `BrowserOtlp`; server-side `Events` and `HttpApiOtlp` consume `Otlp`. Browser event export is enabled by default, batching is shared, and `Events.ingestionLayer` connects HTTP ingestion to application recording.

  SQL is authoritative for persisted events; collector forwarding is best effort. Audit classification provides an application audit trail, not immutable archival storage or a compliance guarantee.

## 0.1.50

### Patch Changes

- Render configured empty groups and their actions in DataTable table and gallery views even when no resource rows exist. Preserve loading, error, and normal empty states when no groups are available.
- Persist Group by selections alongside column and view preferences, including explicitly cleared grouping. Keep existing saved preferences compatible and use the initial grouping when no grouping preference has been saved.

## 0.1.49

### Patch Changes

- e026d8d: Fix silent form submission failures in `SubmitError`, including typed HTTP errors such as `Forbidden` whose messages are empty.
  - Display a non-empty server or domain error message first, when available.
  - Otherwise, display an English or French message for recognized HTTP errors, then a generic failure message if no useful message or recognized status is available.
  - Use localized HTTP status messages instead of raw HTTP-client diagnostics for recognized statuses.
  - Support the provider locale and explicit `locale` and `messages` overrides.
  - Continue displaying schema validation errors beside their fields rather than in the submission error display.

## 0.1.48

### Patch Changes

- Fix Effect Form image previews for newly selected and replacement files. Use full-width image attachment rows with consistently sized, bordered previews, truncated filenames, compact file type and size metadata, and replace/delete actions aligned to the right. Replace the refresh icon with upload icons for changing images and files.

## 0.1.47

### Patch Changes

- Display language names in their native language in the UI language switcher so users can recognize their language regardless of the active UI locale. Editing-locale selectors continue to use translated language names.

## 0.1.46

### Patch Changes

- Highlight sidebar sections on nested routes using TanStack Router's built-in link matching. Add an exact option for overview and index links that should only highlight their own page. Ignore search parameters when determining active links.

## 0.1.45

### Patch Changes

- Support initial hidden columns through `DataTable.initialState.columnVisibility`, with saved user preferences taking precedence. Improve list columns with primary item actions, item menus for nonempty lists, responsive dropdowns, and truncated labels. Consolidate the column-type examples into one kitchen-sink preview.

- Preserve decoded pagination defaults in QueryStandard. Use TanStack Router's stripSearchParams({ page: 0, pageSize: 20 }) search middleware on the root route to omit defaults from URLs without making validated search state optional.
