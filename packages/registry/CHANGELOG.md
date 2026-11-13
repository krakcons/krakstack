# @krak-stack/registry

## 0.10.2

### Patch Changes

- 91114c4: Expose optional grouped DataTable styling hooks, including portalled menus, submenus, filter selects, page-size popups, feedback and gallery layouts. Add AppBrand part classes and stable slots, Pagination root/popup classes, and select-field popup classes. Preserve existing defaults and interaction/data behavior.

## 0.10.1

### Patch Changes

- 7bf29e1: Replace SecretValue with CopyValue, modeled on Kokobi's read-only copyable input. Values are visible by default; enable `secret` for reveal/hide and optional auto-hide. Add a borderless `variant="ghost"` with monospaced text and an icon-only copy button, and tighten spacing between actions.

  Migrate imports from `@krak-stack/registry/secret-value` to `@krak-stack/registry/copy-value`, rename `SecretValue` to `CopyValue`, and add `secret` to preserve masking. The shadcn registry item is now `@krak-stack/copy-value`. Include updated English/French documentation and previews.

- Add the server-only `docs/integrations` export and `docs-integrations` registry item for configurable English/French API, OAuth MCP, and webhook guides. Generate linked event summaries and grouped payload-field references directly from Effect schemas, including required/conditional fields, nested structures, and shared definitions, without raw schema dumps. Include reusable verification and delivery documentation for the KrakStack webhook sender, plus application-owned page overrides.
- 72bcef6: Keep the sidebar layout header pinned to the viewport during document overscroll without disabling native bounce. Preserve sidebar collapse offsets, document scrolling, and full-page layouts.

## 0.10.0

### Minor Changes

- Add Time Picker with independently scrolling hour and minute columns, default 12-hour AM/PM entry and optional 24-hour display. Keep values and bounds in canonical HH:mm format, support configurable minute steps and inclusive bounds, and provide accessible keyboard navigation, validation, clearing and styling hooks. Include English/French documentation and an interactive format preview.

## 0.9.0

### Minor Changes

- 5cc7796: Add Date Picker with localized calendar selection, typed date-only drafts, range constraints and accessible validation. Add Select With Custom Input with application-defined options that reveal a labeled text field. Both include styling hooks and English/French documentation and previews.
- 5cc7796: Add accessible Toast notifications built on the existing Base UI primitives, with provider-scoped state, external managers, actions, promise updates, six positions and English/French documentation and previews.

  Keep the toast viewport scrollable without flashing scrollbars during entry, exit or swipe animations.

  Expose typed Toast part classes, stable styling slots across the new controls, missing wrapper and portal class overrides, and a bilingual component styling guide. Preserve existing className targets and fix Phone Number Input's ignored input classes.

  Enforce the ITU E.164 15-digit phone-number limit, excluding extensions, and allow sidebar navigation rows to grow for wrapped labels.

## 0.8.2

### Patch Changes

- Move `motion` and `libphonenumber-js` from required dependencies to optional peers. Consumers only need to install them when using animation components or the phone-number input; notification-menu and unrelated component consumers no longer pull them in.

## 0.8.1

### Patch Changes

- Preserve native Space and Shift+Enter typing in the agent textarea instead of activating the reference popover trigger. Include regression coverage for plain text and reference queries.
- 09d03cc: Expose the notification menu through the browser-safe `@krak-stack/notifications/client` entry point using the optional registry peer. Keep one shared menu implementation. Constrain popover and notification content overflow, place archive actions inside notification cards, and show a labeled Archive all button beneath the tabs. Use the standard rounded trigger button.

## 0.8.0

### Minor Changes

- 9f63def: Add a restricted typed Cron Expression Editor with automatic spacing and per-field validation, and a numeric Phone Number Input with live formatting, protected calling codes and searchable countries. Include bilingual guides and interactive previews. Keep scheduling, phone verification and persistence application-owned.

## 0.7.0

### Minor Changes

- 8d543bf: Add Image Crop Editor and Timezone Select as standalone components with English/French guides and interactive previews. Timezone Select composes the existing Virtualized Combobox with a code-only continent prop (North America by default), local times, UTC offsets and browser-time comparisons. Existing registry entries remain unchanged.

## 0.6.0

### Minor Changes

- 5c9f4c2: Add Async Action Button, Unsaved Changes Guard, Danger Confirmation, Editable Text, Presence Transition, Auto Height, Animated List, and Animated Number as standalone components with bilingual documentation and reduced-motion-aware previews.

  Animated List includes controlled vertical drag reordering and accessible keyboard handles.

## 0.5.0

### Minor Changes

- b3cb799: Add App Switcher, Secret Value, Bulk List Input, Choice Cards, and Upload Attachment as standalone components with package exports and English/French documentation.

## 0.4.0

### Minor Changes

- 60ae40c: Add `MapMenuPresentation.Inline` alongside the default dialog presentation. Inline point and radius selection reuse the same search, red map and suggestion pins, stacked muted address details, current-location action, explicit confirmation, and retry feedback. Inline callers provide `onCancel` to restore host-owned drafts; dialog callers keep `open` and `onOpenChange` unchanged.

  Prevent Enter in location search from submitting a surrounding form and block confirmation while location acquisition is pending.

## 0.3.0

### Minor Changes

- 20be5ee: Replace the GoogleMap and GoogleMapPicker public entries with MapMenu at `@krak-stack/registry/map-menu` and `@krak-stack/map-menu` in the shadcn registry. Map rendering is now internal.

  Use the exported `MapMenuMode.Point` enum member for pinpoint-only selection without radius props, controls, circle or hint. `MapMenuMode.Radius` remains the default and retains radius confirmation. Rename picker types and styling slots to their MapMenu equivalents. Old public imports are removed without compatibility aliases.

- 4e746f4: Add a controlled GoogleMapPicker with responsive toolbar layout, floating suggestions, configurable radius presets, localized source notices and a yellow default confirmation action. Keep lookup and persistence host-owned. GoogleMap radius fitting waits for updated overlays to paint and cancels stale scheduled fits.

  The default confirmation colour uses KrakStack's `oklch(0.9247 0.0524 66.1732)` rather than Tailwind yellow.

- 86fc54f: Add a domain-neutral Stepper and optional StepperContent with controlled navigation, underline/labelled/segmented presentations, explicit completion/error states, bilingual defaults, and reduced-motion-aware directional slide transitions inside a stationary frame.

## 0.2.2

### Patch Changes

- Prevent virtualized combobox group headings from collapsing into options after asynchronous search results refresh.

## 0.2.1

### Patch Changes

- Keep the color picker panel full-width inside its popup, with even padding and a HEX value centered beneath it. Prevent react-colorful's injected styles from overriding panel, hue slider, and pointer dimensions.

## 0.2.0

### Minor Changes

- 777c616: Add a localized ColorPicker with HEX entry, a live swatch, and a color-selection popover.

## 0.1.61

### Patch Changes

- 9ea9e42: Sign the stable webhook-id header with the timestamp and raw body, and use it automatically for transactional receiver deduplication. Remove the receiver eventId extraction callback. This changes the signature protocol; senders and receivers must upgrade together. Legacy timestamp/body signatures are rejected.

- 7fcaf6f: Add WebhooksReceiver with HMAC verification, timestamp checks, schema validation, and transactional receipt deduplication. Receiver-only applications migrate only receipt storage and do not start outbound workers.
- 9ea9e42: Add `@krak-stack/registry/webhooks/client` with a shared delivery activity table, failed-attempt status, retry details, JSON inspection, localized labels, and application-owned links.

## 0.1.60

### Patch Changes

- Add durable server-event subscriptions and JSON snapshot normalization to Events.
- Export reusable Webhooks with protected delivery, durable retries, endpoint names, sanitized errors, tenant-scoped statistics, and paginated delivery history.
- Support icons and icon styling in data-table reference cells.
- Merge the error component's homepage link classes with `cn` so its outline border is visible instead of being overridden by the base transparent border.

## 0.1.59

### Patch Changes

- Export reusable Cloudflare AI Gateway speech-to-text and text-to-speech services from `@krak-stack/registry/speech`, with schemas and an optional host-authenticated HTTP API contract.

## 0.1.58

### Patch Changes

- Replace the audit table's custom Action menu with the shared Action multi-select filter, populated from the application's full localized action catalog. Preserve legacy eventName links and migrate edits to shared filter state. Execute action, UTC date-range, actor/target text, and method filters on the server before pagination, sharing the same service-, organization-, and category-scoped predicate with the total count. Validate supported field/kind combinations and method values, and escape literal text searches.
- Give the data table View menu a localized heading and separator, matching the other toolbar menus.

## 0.1.57

### Patch Changes

- Add logical `fields` to data-table columns for independent search, sorting, filtering, and separate CSV/JSON fields while keeping combined cells. Built-in exports default to all filtered, sorted loaded rows; use `scope: "currentPage"` for the current page.

  Add typed column filters with text operators, numeric/UTC date ranges, boolean choices, and multi-select values. Share filter state between toolbar and column headers, including logical-field submenus, active indicators, and scoped clearing. Preserve validated filters in router, JSON, and HTTP query state. Server pagination and fetching unloaded exports remain application-owned.

  Support stable `filterValueGetter` values, searchable option lists, application-owned count badges, and wider filter menus. Put Selected bulk actions first in the menubar and give Sort by and Filters consistent popup headings and separators.

- 4d7f3c2: Use Effect CSV for DataTable downloads, including correct escaping of carriage returns and empty single-column records.

## 0.1.56

### Patch Changes

- Upgrade to Effect 4.1.0 and use Effect crypto services for UUIDv7 entity IDs, hashing, and secure capability generation. Preserve existing deterministic fingerprints and random upload capability tokens.
- d3000ed: Use exact matching for documentation sidebar links so Introduction is only highlighted on its own page.

## 0.1.55

### Patch Changes

- 9ec74fb: Default the activity history dateTime column to America/New_York, expose a timeZone override, and use Activity history titles in English and French.

  Display event-time OpenTelemetry user.full_name, user.name, user.email and user.id attributes in activity history without resolving or linking Auth profiles. Preserve those trusted server annotations for audit events, while omitting them from analytics. Remove the separate actors prop.

  Replace Events.listAudit / ListAudit with Events.list / ListEvents and require an explicit audit or analytics category. Preserve server pagination and service/tenant isolation; audit results remain restricted to server events.

  Support an optional exact eventName filter, combined with category and search before counting and pagination.

  Add an Action dropdown with a filter icon as the first toolbar menu in controlled AuditLogTable instances. Accept an application-owned events catalog of { value, label } options, use the labels in both the dropdown and Action column, and include All actions to clear the selection. Reset pagination when the event changes and preserve it across table query updates. Export EventQuery and EventQueryStandard for shared table and route state.

  Display recorded target names with type and ID as secondary text. For older events whose target name is missing or duplicates the ID, show the target type above the ID instead. Target names remain event-time snapshots, not current entity lookups.

  Migration required: replace Events.listAudit with Events.list({ ...query, organizationId, category: "audit" }), replace ListAudit with ListEvents, remove AuditActor/actors wiring, and use EventQuery / EventQueryStandard through API, client, and route query state to preserve eventName. Populate events with the full application event catalog and localized labels. Existing events are not backfilled.

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
