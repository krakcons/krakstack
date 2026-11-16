# Promotion brief: composable notification administration

**Reuse case:** product admin workspaces and embedded sending consoles need the
same delivery diagnostics, activity tables, feedback and suppression controls in
different layouts. Volunteer Rebuild demonstrates copied overview/detail markup,
CSS-hidden navigation and field-name heuristics that future consumers should not
need to repeat.

**Product assumptions removed:** no VolunteerConnector branding, routes, reference
lookups, authentication, permissions or consent decisions. Hosts own navigation,
layout and localized messages; backend authorization remains mandatory.

**Interface:** expose focused controlled delivery sections and operations views,
retain existing full-screen exports, add typed table customization, and make
query scope/cache identity explicit. Keep protected failures separate from retained
loading state; suppression commands remain authoritative and versioned.

**Dependencies:** existing React, Effect Atom, notifications backend and registry
primitives only. No new dashboard framework, router, dependency or database change.

**Documentation/install:** update `packages/notifications-admin/README.md` with
composition, table and query integration examples. Install through
`bun add @krak-stack/notifications-admin`; these SDK views are not registry items.
No registry source or generated registry output changes are needed.

**Consumer migration:** additive exports/options with backwards-compatible defaults.
Hosts may replace CSS selectors and copied diagnostics incrementally after an
authorized release. Do not modify consumer repositories or publish automatically.
