# @krak-stack/registry

## 0.1.54

### Patch Changes

- Emit newly persisted server events through `Otlp.event` as well as SQL, preserving enriched attributes, event IDs, timestamps, and trace context in the application event scope. Duplicate retries and conflicts do not emit again. OTLP delivery remains best effort and is not atomic with an outer application transaction.
- Export server events when SQL persistence is not configured; `inserted: false` then means no database row was written, not that telemetry was suppressed.

- Add `TrackingNotice` with English/French defaults, optional copy overrides, a custom privacy-policy link, and persistent analytics preferences. Import it from `@krak-stack/registry/events/tracking-notice`.
- Require consent by default for BrowserEvents and BrowserWebVitals. Remember choices for 180 days, honor DNT/GPC, and invalidate unsent events after withdrawal. Existing consumers must mount the notice or explicitly configure `requireConsent: false`.
- Add optional server consent enforcement through `Events.layerWith({ requireConsent: true })`, while preserving necessary audit recording. Keep essential browser error reporting independent, with sanitized messages and stack locations.
- Collect Web Vitals only when consent predates navigation; withdrawal disables it for the rest of the document. Already-started exports, including retries, may finish after withdrawal.
- Reorganize Events and OpenTelemetry documentation around setup and practical examples.

## 0.1.53

### Patch Changes

- Use Effect Crypto for secret-salted SHA-256 visitor IDs and generated UUIDv7 event and visit IDs. Applications must provide a platform Crypto layer alongside Otlp. The versioned visitor derivation changes IDs from the previous HMAC algorithm.

  Replace the Events layer factories with default `Events.layer` / `Events.baseLayer` values and partial `Events.layerWith(options)` / `Events.baseLayerWith(options)` overrides. Missing secret and origin options read server-only `APP_SECRET` and the origin of `VITE_SITE_URL`; explicit values skip their environment lookup. Geolocation remains opt-in. Migrate existing `Events.layer(options)` and `Events.baseLayer(options)` calls to their With counterparts.

## 0.1.52

### Patch Changes

- Replace AuditLogTable's profile resolver callbacks with an application-supplied `actors` list and export `AuditActor`. Match responsible actors by type and ID and resolve user impersonators from the same list. Use neutral labels for unavailable profiles so loading or partial member lists do not misidentify users as former members.
- Add `Events.listAudit` using the shared Query schema for organization-scoped pagination, filtering, and sorting. Return unchanged OTLP EventLogRecord values in the standard paginated response. Export a bilingual AuditLogTable from `events/client` with application-owned live member profiles, standard query state, and the shared KrakStack locale.

  Include audit queries and the table in the Events registry item and documentation. Include the opt-in Browser Web Vitals layer and its documentation in the OpenTelemetry registry item, without changing package subpath imports.

  Present audit history in five columns: Time, Action, Target, Actor, and Method. Separate the responsible user or organization from request authentication. Resolve current profiles in the application, while retaining key identities, historical roles, and target types in unchanged log records. Include localized labels and safe identity fallbacks.

  Define principal attribution as `app.actor.type/id`, authentication as `app.auth.method` and API-key identity as `app.auth.credential.id`. Method displays User session, API Key, or Unknown from verified authentication only, without interpreting agent, channel, or user-agent metadata. Protect auth annotations from browser claims. Document the application vocabulary and its relationship to OTel and OCSF.

  Retain the verified impersonator ID as `app.auth.impersonator.id` while keeping the effective user as Actor. Show localized impersonation attribution in the Actor cell, resolving profiles from the application-provided actors list and falling back to the retained ID when a profile is unavailable. Never infer membership status from a missing profile or change Method during impersonation.

- Add a `reference` table column and reusable `DataTableReferenceCell` for an image beside stacked primary/secondary text, such as a user's name and email. Include configurable circle/square images, initials/image-error fallbacks, and readable search, sorting, and exports without exposing image URLs.
- Require a typed `target: { id, name, type }` on audit events and generate an event UUID when `eventId` is omitted. Persist historical `user.roles`, but exclude user display names/photos from recorded events so applications can resolve current profiles by actor ID. Browser claims cannot override auth-owned attribution. Existing audit callers must supply a target; explicit IDs retain retry deduplication.

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
