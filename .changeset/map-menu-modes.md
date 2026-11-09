---
"@krak-stack/registry": minor
---

Replace the GoogleMap and GoogleMapPicker public entries with MapMenu at `@krak-stack/registry/map-menu` and `@krak-stack/map-menu` in the shadcn registry. Map rendering is now internal.

Use the exported `MapMenuMode.Point` enum member for pinpoint-only selection without radius props, controls, circle or hint. `MapMenuMode.Radius` remains the default and retains radius confirmation. Rename picker types and styling slots to their MapMenu equivalents. Old public imports are removed without compatibility aliases.
