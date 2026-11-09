---
"@krak-stack/registry": minor
---

Add `MapMenuPresentation.Inline` alongside the default dialog presentation. Inline point and radius selection reuse the same search, red map and suggestion pins, stacked muted address details, current-location action, explicit confirmation, and retry feedback. Inline callers provide `onCancel` to restore host-owned drafts; dialog callers keep `open` and `onOpenChange` unchanged.

Prevent Enter in location search from submitting a surrounding form and block confirmation while location acquisition is pending.
