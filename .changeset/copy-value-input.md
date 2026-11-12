---
"@krak-stack/registry": patch
---

Replace SecretValue with CopyValue, modeled on Kokobi's read-only copyable input. Values are visible by default; enable `secret` for reveal/hide and optional auto-hide. Add a borderless `variant="ghost"` with monospaced text and an icon-only copy button, and tighten spacing between actions.

Migrate imports from `@krak-stack/registry/secret-value` to `@krak-stack/registry/copy-value`, rename `SecretValue` to `CopyValue`, and add `secret` to preserve masking. The shadcn registry item is now `@krak-stack/copy-value`. Include updated English/French documentation and previews.
