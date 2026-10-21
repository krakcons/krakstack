---
"@krak-stack/registry": patch
---

Default the activity history dateTime column to America/New_York, expose a timeZone override, and use Activity history titles in English and French.

Display event-time OpenTelemetry user.full_name, user.name, user.email and user.id attributes in activity history without resolving or linking Auth profiles. Preserve those trusted server annotations for audit events, while omitting them from analytics. Remove the separate actors prop.

Replace Events.listAudit / ListAudit with Events.list / ListEvents and require an explicit audit or analytics category. Preserve server pagination and service/tenant isolation; audit results remain restricted to server events.

Support an optional exact eventName filter, combined with category and search before counting and pagination.

Add an Action dropdown with a filter icon as the first toolbar menu in controlled AuditLogTable instances. Accept an application-owned events catalog of { value, label } options, use the labels in both the dropdown and Action column, and include All actions to clear the selection. Reset pagination when the event changes and preserve it across table query updates. Export EventQuery and EventQueryStandard for shared table and route state.

Display recorded target names with type and ID as secondary text. For older events whose target name is missing or duplicates the ID, show the target type above the ID instead. Target names remain event-time snapshots, not current entity lookups.

Migration required: replace Events.listAudit with Events.list({ ...query, organizationId, category: "audit" }), replace ListAudit with ListEvents, remove AuditActor/actors wiring, and use EventQuery / EventQueryStandard through API, client, and route query state to preserve eventName. Populate events with the full application event catalog and localized labels. Existing events are not backfilled.
